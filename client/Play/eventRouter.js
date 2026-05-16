/**
 * Client-side EventRouter setup for void-driller
 *
 * Complete replacement for socketRouter/* files
 * All game events handled through EventRouter pattern
 */
import { createClientEventRouter, createValidationMiddleware, createLoggingMiddleware } from '@fatlard1993/web-game-framework/client';
import { randInt } from 'vanilla-bean-components';

import gameContext from '../shared/gameContext';
import { destroyGround, explode, implode } from './effects';
import { Drill, Item, Gas, Lava } from './GameObjects';
import { createAlien } from './GameObjects/aliens';
import { Achievement } from '../shared/Achievement';
import Notify from '../shared/Notify';
import TradeDialog from './TradeDialog';
import { vehicles, drills } from '../../constants';

// Helper function to check resource alerts
function checkResourceAlerts(player) {
	if (!player || player.id !== gameContext.playerId) return;

	const alerts = gameContext.alert;
	const dismissed = gameContext.dismissedAlerts;

	// Check fuel level
	if (player.fuel && player.maxFuel) {
		const fuelRatio = player.fuel / player.maxFuel;
		if (fuelRatio <= alerts.fuel && !dismissed.fuel) {
			gameContext.sounds.alert_fuel?.play({ volume: gameContext.volume.alerts });
			gameContext.dismissedAlerts.fuel = true;

			const barWidth = window.innerWidth * 0.3;
			const totalWidth = barWidth * 3;
			const startX = (window.innerWidth - totalWidth) / 2;
			const fuelBarCenter = startX + barWidth + barWidth / 2;

			new Notify({
				type: 'error',
				content: 'FUEL',
				x: fuelBarCenter,
				y: 40,
				timeout: 30 * 1000,
			});
		} else if (fuelRatio > alerts.fuel) {
			gameContext.dismissedAlerts.fuel = false;
		}
	}

	// Check health level
	if (player.health && player.maxHealth) {
		const healthRatio = player.health / player.maxHealth;
		if (healthRatio <= alerts.health && !dismissed.health) {
			gameContext.sounds.alert_health?.play({ volume: gameContext.volume.alerts });
			gameContext.dismissedAlerts.health = true;

			const barWidth = window.innerWidth * 0.3;
			const totalWidth = barWidth * 3;
			const startX = (window.innerWidth - totalWidth) / 2;
			const healthBarCenter = startX + barWidth / 2;

			new Notify({
				type: 'error',
				content: 'HEALTH',
				x: healthBarCenter,
				y: 40,
				timeout: 30 * 1000,
			});
		} else if (healthRatio > alerts.health) {
			gameContext.dismissedAlerts.health = false;
		}
	}

	// Check cargo level
	if (player.cargo && player.maxCargo) {
		const cargoRatio = player.cargo / player.maxCargo;
		if (cargoRatio >= 1 - alerts.cargo && !dismissed.cargo) {
			gameContext.sounds.alert_cargo?.play({ volume: gameContext.volume.alerts });
			gameContext.dismissedAlerts.cargo = true;

			const barWidth = window.innerWidth * 0.3;
			const totalWidth = barWidth * 3;
			const startX = (window.innerWidth - totalWidth) / 2;
			const cargoBarCenter = startX + barWidth * 2 + barWidth / 2;

			new Notify({
				type: 'error',
				content: 'CARGO',
				x: cargoBarCenter,
				y: 40,
				timeout: 30 * 1000,
			});
		} else if (cargoRatio < alerts.cargo) {
			gameContext.dismissedAlerts.cargo = false;
		}
	}
}

/**
 * Setup EventRouter for void-driller client
 * @returns {EventRouter} Configured router instance
 */
export function setupEventRouter() {
	const router = createClientEventRouter({
		gameId: gameContext.gameId,
		logger: console,
	});

	// Add validation middleware
	router.use(
		createValidationMiddleware({
			requiredFields: ['id', 'update'],
		})
	);

	// Add logging middleware (only for development)
	if (process.env.NODE_ENV === 'development') {
		router.use(
			createLoggingMiddleware({
				exclude: ['playerMove'], // Don't log every movement
			})
		);
	}

	// === Player Events ===

	router.on('playerMove', (data) => {
		let player = gameContext.players.get(data.player.id);

		if (!player?.sprite) {
			const sprite = new Drill(
				gameContext.scene,
				data.player.position.x,
				data.player.position.y,
				data.player.orientation,
				gameContext.serverState.world.vehicles[data.player.configuration.vehicle].spriteIndex,
				gameContext.serverState.world.drills[data.player.configuration.drill].spriteIndex
			);

			gameContext.players.set(data.player.id, { ...player, ...data.player, sprite });
			gameContext.sceneLayers.players.add(sprite);
		} else {
			gameContext.players.set(data.player.id, { ...player, ...data.player });
		}

		player = gameContext.players.get(data.player.id);
		const gridConfig = gameContext.serverState.world.grid[player.position.x][player.position.y];

		destroyGround(player.position);

		if (gridConfig.items.length) {
			gridConfig.items.forEach(({ sprite }) => {
				if (sprite.scene) {
					sprite[player.id === gameContext.playerId ? 'collect' : 'destroy']();
				}
			});
		}

		player.sprite.move(player.position, 500, player.orientation);
		checkResourceAlerts(player);

		if (player.id === gameContext.playerId && gameContext.statusBarHUD) {
			gameContext.statusBarHUD.update(player);
		}

		gameContext.serverState.world.grid[player.position.x][player.position.y].ground = {};
		gameContext.serverState.world.grid[player.position.x][player.position.y].items = [];
	});

	router.on('addPlayer', (data) => {
		console.log('🎮 addPlayer event received:', data.newPlayer);

		const sprite = new Drill(
			gameContext.scene,
			data.newPlayer.position.x,
			data.newPlayer.position.y,
			data.newPlayer.orientation,
			vehicles[data.newPlayer.configuration.vehicle].spriteIndex,
			drills[data.newPlayer.configuration.drill].spriteIndex
		);

		gameContext.players.set(data.newPlayer.id, { ...data.newPlayer, sprite });
		gameContext.sceneLayers.players.add(sprite);

		if (data.newPlayer.id === gameContext.playerId) {
			gameContext.camera.follow(sprite);
		}
	});

	router.on('removePlayer', (data) => {
		const player = gameContext.players.get(data.id);

		if (player?.sprite?.scene) {
			player.sprite.destroy();
		}

		gameContext.players.delete(data.id);
	});

	router.on('hurtPlayers', (data) => {
		data.players.forEach((playerData) => {
			const player = gameContext.players.get(playerData.id);
			if (player) {
				gameContext.players.set(playerData.id, { ...player, ...playerData });

				if (playerData.id === gameContext.playerId) {
					checkResourceAlerts(gameContext.players.get(playerData.id));
					if (gameContext.statusBarHUD) {
						gameContext.statusBarHUD.update(gameContext.players.get(playerData.id));
					}
				}
			}
		});
	});

	router.on('useItem', (data) => {
		if (data.playerId === gameContext.playerId && data.updates) {
			gameContext.players.update(data.playerId, (_) => ({ ..._, ...data.updates }));
			checkResourceAlerts(gameContext.players.get(data.playerId));
		}
	});

	router.on('playerFall', (data) => {
		gameContext.players.update(data.playerId, (_) => ({ ..._, position: data.position }));
	});

	router.on('updatePlayer', (data) => {
		gameContext.players.update(data.playerId, (_) => ({ ..._, ...data.updates }));
	});

	router.on('playerMovementComplete', (data) => {
		const player = gameContext.players.get(data.playerId);
		if (player) {
			gameContext.players.set(data.playerId, { ...player, moving: false });
		}
	});

	router.on('playerCantMove', (data) => {
		if (data.playerId === gameContext.playerId) {
			new Notify({ type: 'error', content: data.reason || 'Cannot move there', timeout: 2000 });
		}
	});

	router.on('playerMovementInterrupted', (data) => {
		const player = gameContext.players.get(data.playerId);
		if (player) {
			gameContext.players.set(data.playerId, { ...player, moving: false, position: data.position });
			if (data.playerId === gameContext.playerId) {
				new Notify({ type: 'warning', content: data.reason || 'Movement interrupted', timeout: 2000 });
			}
		}
	});

	router.on('playerMovementError', (data) => {
		if (data.playerId === gameContext.playerId) {
			new Notify({ type: 'error', content: data.error || 'Movement failed', timeout: 2000 });
		}
	});

	router.on('achievement', (data) => {
		new Achievement({ achievement: data.achievement });

		const player = gameContext.players.get(data.playerId);
		if (player) {
			gameContext.players.set(data.playerId, {
				...player,
				achievements: data.achievements,
				stats: data.stats,
				xp: data.xp,
			});
		}
	});

	// === SpaceCo Events ===

	router.on('spacecoBuyTransport', (data) => {
		gameContext.players.update(data.playerId, (_) => ({ ..._, ...data.updates }));

		if (data.playerId === gameContext.playerId) {
			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);
		}

		if (data.spaceco) {
			gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
			gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			if (data.spaceco.hull) {
				gameContext.serverState.world.spaceco.hull = data.spaceco.hull;
			}
		}

		if (data.playerId === gameContext.playerId) {
			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70))
			);

			gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });
		} else {
			new Notify({ type: 'info', content: `Transporting to ${data.world}...`, timeout: 2000 });
		}

		if (gameContext.openDialog?.elem?.open) {
			gameContext.openDialog.close();
		}
		if (gameContext.spaceco?.dialog?.elem?.open) {
			gameContext.spaceco.dialog.close();
		}

		if (gameContext.musicManager) {
			gameContext.musicManager.playTransportTransition(() => {
				console.log('🎵 Music transition complete, fading in world');
				if (gameContext.scene?.fadeInWorld) {
					gameContext.scene.fadeInWorld();
				}
			});
		}

		if (data.newWorldState && gameContext.scene?.startWorldTransition) {
			setTimeout(() => {
				gameContext.scene.startWorldTransition(data.newWorldState);
			}, 500);
		} else {
			setTimeout(() => window.location.reload(), 1500);
		}
	});

	router.on('spacecoAchievement', (data) => {
		new Achievement({ achievement: data.achievement });

		gameContext.serverState.world.spaceco.achievements = data.spaceco.achievements;
		gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
		gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
	});

	router.on('spacecoFall', (data) => {
		gameContext.serverState.world.spaceco.position = data.position;
		gameContext.serverState.world.spaceco.health = data.health;
	});

	router.on('spacecoEggSubmission', (data) => {
		if (data.spaceco) {
			gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
			gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
		}
	});

	// === World Events ===

	router.on('dissipateGas', (data) => {
		data.addedGas.forEach((gas) => {
			const sprite = new Gas(gameContext.scene, gas.x, gas.y, 'fill');

			gameContext.serverState.world.grid[gas.x][gas.y].hazards = gameContext.serverState.world.grid[gas.x][gas.y].hazards.filter((hazard) => {
				if (hazard.type === 'alien') {
					gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });
					hazard.sprite.destroy();
					return false;
				}
				return true;
			});

			gameContext.serverState.world.grid[gas.x][gas.y].hazards.push({ type: 'gas', sprite });
			gameContext.sceneLayers.hazards.add(sprite);
		});

		data.removedGas.forEach((gas) => {
			const updatedHazards = [];

			gameContext.serverState.world.grid[gas.x][gas.y].hazards.forEach((hazard) => {
				if (hazard.type === 'gas') hazard.sprite.dissipate();
				else updatedHazards.push(hazard);
			});

			gameContext.serverState.world.grid[gas.x][gas.y].hazards = updatedHazards;
		});
	});

	router.on('spillLava', (data) => {
		data.addedLava.forEach((lava) => {
			const sprite = new Lava(gameContext.scene, lava.x, lava.y, 'fill');

			gameContext.serverState.world.grid[lava.x][lava.y].hazards = gameContext.serverState.world.grid[lava.x][lava.y].hazards.filter((hazard) => {
				if (hazard.type === 'alien') {
					gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });
					hazard.sprite.destroy();
					return false;
				}
				return true;
			});

			gameContext.serverState.world.grid[lava.x][lava.y].hazards.push({ type: 'lava', sprite });
			gameContext.sceneLayers.hazards.add(sprite);
		});

		data.removedLava.forEach((lava) => {
			const updatedHazards = [];

			gameContext.serverState.world.grid[lava.x][lava.y].hazards.forEach((hazard) => {
				if (hazard.type === 'lava') hazard.sprite.dissipate();
				else updatedHazards.push(hazard);
			});

			gameContext.serverState.world.grid[lava.x][lava.y].hazards = updatedHazards;
		});
	});

	router.on('alien_wake', (data) => {
		const alien = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			(hazard) => hazard.type === 'alien' && hazard.name === data.alien
		);

		if (!alien?.sprite) return;

		alien.sprite.awake();

		if (data.move) {
			alien.sprite.move(data.move, 500, data.orientation);

			gameContext.serverState.world.grid[data.position.x][data.position.y].hazards = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.filter(
				(hazard) => !(hazard.type === 'alien' && hazard.name === data.alien)
			);

			gameContext.serverState.world.grid[data.move.x][data.move.y].hazards.push(alien);
		}
	});

	router.on('alien_sleep', (data) => {
		const alien = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			(hazard) => hazard.type === 'alien' && hazard.name === data.name
		);

		if (!alien?.sprite) return;

		alien.sprite.sleep();
	});

	router.on('alien_attack', (data) => {
		const alien = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find((hazard) => hazard.type === 'alien');

		if (!alien?.sprite) return;

		alien.sprite.attack?.();

		if (data.playerUpdates && data.playerId === gameContext.playerId) {
			gameContext.players.update(data.playerId, (_) => ({
				..._,
				...data.playerUpdates,
				hull: { ..._.hull, ...(data.playerUpdates?.hull || {}) },
			}));

			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);
		}
	});

	router.on('alien_message', (data) => {
		if (data.targetPlayerId === gameContext.playerId) {
			new Notify({ type: 'tip', textContent: `Alien ${data.name} says: ${data.message}`, timeout: 3000 });
		}
	});

	router.on('alien_move', (data) => {
		const oldAlien = gameContext.serverState.world.grid[data.from.x][data.from.y].hazards.find(
			(hazard) => hazard.type === 'alien' && hazard.name === data.name
		);

		if (oldAlien?.sprite) {
			oldAlien.sprite.move(data.to, 500, data.orientation);

			gameContext.serverState.world.grid[data.from.x][data.from.y].hazards = gameContext.serverState.world.grid[data.from.x][data.from.y].hazards.filter(
				(hazard) => !(hazard.type === 'alien' && hazard.name === data.name)
			);

			if (!gameContext.serverState.world.grid[data.to.x]) {
				gameContext.serverState.world.grid[data.to.x] = [];
			}
			if (!gameContext.serverState.world.grid[data.to.x][data.to.y]) {
				gameContext.serverState.world.grid[data.to.x][data.to.y] = { ground: {}, items: [], hazards: [] };
			}

			gameContext.serverState.world.grid[data.to.x][data.to.y].hazards.push({
				...oldAlien,
				sprite: oldAlien.sprite,
			});
		}
	});

	router.on('alien_spawn', (data) => {
		const { spawnPosition, spawnType, spawnTarget } = data;

		if (spawnType === 'alien') {
			const sprite = createAlien(gameContext.scene, spawnPosition.x, spawnPosition.y, spawnTarget, 'right');

			if (sprite) {
				if (!gameContext.serverState.world.grid[spawnPosition.x][spawnPosition.y].hazards) {
					gameContext.serverState.world.grid[spawnPosition.x][spawnPosition.y].hazards = [];
				}

				gameContext.serverState.world.grid[spawnPosition.x][spawnPosition.y].hazards.push({
					type: 'alien',
					name: spawnTarget,
					sprite: sprite,
				});

				gameContext.sceneLayers.hazards.add(sprite);
			}
		}
	});

	router.on('explodeBomb', (data) => {
		explode({ position: data.position, radius: data.radius });
	});

	router.on('explodeImplosion', (data) => {
		implode({
			position: data.position,
			radius: data.radius,
			implosionType: data.implosionType,
			collectedMinerals: data.collectedMinerals,
			collectedItems: data.collectedItems,
		});

		if (data.playerId === gameContext.playerId) {
			const totalMinerals = Object.values(data.collectedMinerals || {}).reduce((sum, count) => sum + count, 0);
			const totalItems = Object.values(data.collectedItems || {}).reduce((sum, count) => sum + count, 0);

			if (totalMinerals > 0 || totalItems > 0) {
				new Notify({
					type: 'success',
					content: `Implosion collected: ${totalMinerals} minerals, ${totalItems} items`,
					timeout: 3000,
				});
			}
		}
	});

	router.on('groundEffect', (data) => {
		if (data.type === 'gasRelease') {
			gameContext.scene.sound.play('psykick_attack', {
				volume: gameContext.volume.effects * 0.6,
				rate: 1.5,
			});

			const gasSprite = new Gas(gameContext.scene, data.position.x, data.position.y, 'fill');
			gameContext.sceneLayers.hazards.add(gasSprite);

			if (!gameContext.serverState.world.grid[data.position.x][data.position.y].hazards) {
				gameContext.serverState.world.grid[data.position.x][data.position.y].hazards = [];
			}
			gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.push({
				type: 'gas',
				sprite: gasSprite,
			});

			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'warning',
					content: 'Byzanium released gas when stressed!',
					timeout: 2000,
				});
			}
		} else if (data.type === 'explosionWarning') {
			gameContext.scene.sound.play('comm_err', { volume: gameContext.volume.effects * 0.7 });

			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'error',
					content: 'Adamantite destabilizing...',
					timeout: 1500,
				});
			}
		} else if (data.type === 'explosion') {
			explode({ position: data.position, radius: data.radius });

			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'error',
					content: 'Adamantite exploded!',
					timeout: 2000,
				});
			}
		}
	});

	// === Trade Events ===

	router.on('tradeSessionStarted', (data) => {
		const { trade, player1Name, player2Name } = data;

		const isPlayer1 = trade.player1Id === gameContext.playerId;
		const isPlayer2 = trade.player2Id === gameContext.playerId;

		if (isPlayer1) {
			const otherPlayer = gameContext.players.get(trade.player2Id);

			if (gameContext.openDialog?.elem?.open) {
				gameContext.openDialog.close();
			}

			gameContext.openDialog = new TradeDialog({
				otherPlayer,
				tradeSession: trade,
			});

			new Notify({
				type: 'info',
				content: `Trade session started with ${player2Name}`,
				timeout: 3000,
			});
		} else if (isPlayer2) {
			gameContext.pendingTradeInvitation = trade;

			new Notify({
				type: 'info',
				content: `${player1Name} wants to trade! Press their Trade button to accept.`,
				timeout: 5000,
			});

			gameContext.scene.sound.play('alert_trade', { volume: gameContext.volume.interfaces });

			const currentPlayerSprite = gameContext.players.currentPlayer?.sprite;
			if (currentPlayerSprite && currentPlayerSprite.checkForNearbyPlayers) {
				currentPlayerSprite.checkForNearbyPlayers();
			}
		}
	});

	router.on('tradeUpdated', (data) => {
		const { trade, updatedBy } = data;

		if (gameContext.openDialog instanceof TradeDialog && gameContext.openDialog.tradeSession?.id === trade.id) {
			gameContext.openDialog.updateFromSocketEvent(trade);

			if (updatedBy !== gameContext.playerId) {
				const otherPlayerName = gameContext.openDialog.otherPlayer.name;
				new Notify({
					type: 'info',
					content: `${otherPlayerName} updated their offer`,
					timeout: 2000,
				});
			}
		}
	});

	router.on('tradeAcceptanceChanged', (data) => {
		const { tradeId, playerId, player1Accepted, player2Accepted } = data;

		if (gameContext.openDialog instanceof TradeDialog && gameContext.openDialog.tradeSession?.id === tradeId) {
			const trade = {
				...gameContext.openDialog.tradeSession,
				player1Accepted,
				player2Accepted,
			};
			gameContext.openDialog.updateFromSocketEvent(trade);

			if (playerId !== gameContext.playerId) {
				const otherPlayerName = gameContext.openDialog.otherPlayer.name;
				new Notify({
					type: 'success',
					content: `${otherPlayerName} accepted the trade!`,
					timeout: 2000,
				});
			}
		}
	});

	router.on('tradeCompleted', (data) => {
		const { player1Id, player2Id, player1Updates, player2Updates } = data;

		if (player1Id === gameContext.playerId) {
			gameContext.players.update(player1Id, (player) => ({
				...player,
				...player1Updates,
			}));

			new Notify({
				type: 'success',
				content: 'Trade completed successfully!',
				timeout: 3000,
			});
		} else if (player2Id === gameContext.playerId) {
			gameContext.players.update(player2Id, (player) => ({
				...player,
				...player2Updates,
			}));

			new Notify({
				type: 'success',
				content: 'Trade completed successfully!',
				timeout: 3000,
			});
		}

		if (player1Id !== gameContext.playerId) {
			gameContext.players.update(player1Id, (player) => ({
				...player,
				...player1Updates,
			}));
		}
		if (player2Id !== gameContext.playerId) {
			gameContext.players.update(player2Id, (player) => ({
				...player,
				...player2Updates,
			}));
		}

		if (gameContext.pendingTradeInvitation?.id === data.tradeId) {
			gameContext.pendingTradeInvitation = null;
		}

		if (gameContext.openDialog instanceof TradeDialog) {
			gameContext.openDialog.close();
		}
	});

	router.on('tradeFailed', (data) => {
		const { error, player1Id, player2Id } = data;

		if (player1Id === gameContext.playerId || player2Id === gameContext.playerId) {
			new Notify({
				type: 'error',
				content: `Trade failed: ${error}`,
				timeout: 4000,
			});

			if (gameContext.openDialog instanceof TradeDialog) {
				gameContext.openDialog.close();
			}
		}
	});

	router.on('tradeCancelled', (data) => {
		const { cancelledBy, player1Id, player2Id } = data;

		if (cancelledBy === gameContext.playerId) {
			new Notify({
				type: 'info',
				content: 'You cancelled the trade',
				timeout: 2000,
			});
		} else if (player1Id === gameContext.playerId || player2Id === gameContext.playerId) {
			new Notify({
				type: 'warning',
				content: 'Trade was cancelled',
				timeout: 3000,
			});
		}

		if (gameContext.pendingTradeInvitation?.id === data.tradeId) {
			gameContext.pendingTradeInvitation = null;
		}

		if (gameContext.openDialog instanceof TradeDialog) {
			gameContext.openDialog.close();
		}
	});

	console.log('✅ EventRouter configured with', router.listEvents().length, 'event handlers');

	return router;
}

export default setupEventRouter;
