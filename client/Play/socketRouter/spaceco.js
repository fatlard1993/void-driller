import { randInt } from 'vanilla-bean-components';

import gameContext from '../../shared/gameContext';
import Notify from '../../shared/Notify';
import { Achievement } from '../../shared/Achievement';
import { gridToPxPosition } from '../../../utils';
import { checkResourceAlerts } from './player';

export default data => {
	if (data.update === 'spacecoBuyTransport') {
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		// Check for resource alerts after transport purchase
		if (data.playerId === gameContext.playerId) {
			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);
		}

		// Update SpaceCo state if provided
		if (data.spaceco) {
			gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
			gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			if (data.spaceco.hull) {
				gameContext.serverState.world.spaceco.hull = data.spaceco.hull;
			}
		}

		// All players experience the transport transition
		if (data.playerId === gameContext.playerId) {
			// Player who bought transport gets the thank you and coins
			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			// Play coin sounds and thank you alert
			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });
		} else {
			// Other players get a notification that transport is happening
			new Notify({ type: 'info', content: `Transporting to ${data.world}...`, timeout: 2000 });
		}

		// Close any open dialogs for all players
		if (gameContext.openDialog?.elem?.open) {
			gameContext.openDialog.close();
		}
		if (gameContext.spaceco?.dialog?.elem?.open) {
			gameContext.spaceco.dialog.close();
		}

		// Start music transition for all players
		if (gameContext.musicManager) {
			gameContext.musicManager.playTransportTransition(() => {
				// Music finished - fade in the new world
				console.log('🎵 Music transition complete, fading in world');
				if (gameContext.scene?.fadeInWorld) {
					gameContext.scene.fadeInWorld();
				}
			});
		}

		// Immediately start the world transition (don't wait for music)
		if (data.newWorldState && gameContext.scene?.startWorldTransition) {
			setTimeout(() => {
				gameContext.scene.startWorldTransition(data.newWorldState);
			}, 500);
		} else {
			// Fallback if seamless transition not available
			setTimeout(() => window.location.reload(), 1500);
		}
	} else if (data.update === 'spacecoAchievement') {
		new Achievement({ achievement: data.achievement });

		gameContext.serverState.world.spaceco.achievements = data.spaceco.achievements;
		gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
		gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
	} else if (data.update === 'spacecoFall') {
		gameContext.serverState.world.spaceco.position = data.position;
		gameContext.serverState.world.spaceco.health = data.health;

		// Update SpaceCo state if provided
		if (data.spaceco) {
			gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
			gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			if (data.spaceco.health !== undefined) {
				gameContext.serverState.world.spaceco.health = data.spaceco.health;
			}
		}

		gameContext.spaceco.fall(data.position);
	} else if (data.update === 'spacecoHazardDamage') {
		// Update SpaceCo position and health
		gameContext.serverState.world.spaceco.position = data.position;
		gameContext.serverState.world.spaceco.health = data.health;

		// Update SpaceCo state if provided
		if (data.spaceco) {
			gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
			gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			if (data.spaceco.health !== undefined) {
				gameContext.serverState.world.spaceco.health = data.spaceco.health;
			}
		}

		// Visual feedback for hazard damage
		if (gameContext.spaceco && gameContext.spaceco.hurt) {
			gameContext.spaceco.hurt();
		}
	} else if (data.playerId === gameContext.playerId) {
		if (data.update === 'spacecoSell') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Check for resource alerts after selling (cargo reduced)
			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);

			[...Array(randInt(2, Math.min(100, Math.max(3, data.gain / 10))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			// Play thank you sound immediately with coins
			gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			// Update SpaceCo state with complete data if provided
			if (data.spaceco) {
				gameContext.serverState.world.spaceco.hull = data.spaceco.hull;
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			} else if (data.spacecoHull) {
				// Fallback to legacy format
				gameContext.serverState.world.spaceco.hull = data.spacecoHull;
			}

			gameContext.spaceco.dialog.options.view = 'sell';
		} else if (data.update === 'spacecoRefuel') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Update status bars immediately after refuel
			if (data.playerId === gameContext.playerId) {
				const { sprite } = gameContext.players.get(data.playerId);
				sprite.updateStatusBars();

				// Check for resource alerts after refuel
				const updatedPlayer = gameContext.players.get(data.playerId);
				checkResourceAlerts(updatedPlayer);
			}

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			// Play thank you sound immediately with coins
			gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			// Update SpaceCo state if provided
			if (data.spaceco) {
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			}

			gameContext.spaceco.dialog.options.view = 'refuel';

			gameContext.dismissedAlerts.fuel = false;
		} else if (data.update === 'spacecoRepair') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Update status bars immediately after repair
			if (data.playerId === gameContext.playerId && data.type === 'player') {
				const { sprite } = gameContext.players.get(data.playerId);
				sprite.updateStatusBars();
				
				// Check for resource alerts after repair
				const updatedPlayer = gameContext.players.get(data.playerId);
				checkResourceAlerts(updatedPlayer);
			}

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			[...Array(randInt(2, Math.min(100, Math.max(3, data.purchasedRepairs))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.heal.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			// Play thank you sound immediately with coins and heals
			gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			// Update SpaceCo state if provided
			if (data.spaceco) {
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
				if (data.spaceco.shop) {
					gameContext.serverState.world.spaceco.shop = data.spaceco.shop;
				}
				if (data.spaceco.health !== undefined) {
					gameContext.serverState.world.spaceco.health = data.spaceco.health;
				}
			}

			gameContext.spaceco.dialog.options.view = 'repair';

			if (data.type === 'outpost') {
				if (data.spaceco && data.spaceco.health !== undefined) {
					gameContext.serverState.world.spaceco.health = data.spaceco.health;
				} else {
					// Fallback to legacy behavior
					gameContext.serverState.world.spaceco.health = 9;
				}
				gameContext.spaceco.hurt();
			} else {
				gameContext.dismissedAlerts.health = false;
			}
		} else if (data.update === 'spacecoRelocate') {
			// Handle SpaceCo outpost relocation

			// Update SpaceCo position in game context
			gameContext.spaceco.x = gridToPxPosition(data.newPosition.x);
			gameContext.spaceco.y = gridToPxPosition(data.newPosition.y);

			// Update server state
			gameContext.serverState.world.spaceco.position = data.newPosition;

			// Animate the relocation
			gameContext.scene.tweens.add({
				targets: gameContext.spaceco,
				duration: 1000,
				x: gridToPxPosition(data.newPosition.x),
				y: gridToPxPosition(data.newPosition.y),
				ease: 'Power2.easeInOut',
				onComplete: () => {
					// Update status bars position
					gameContext.spaceco.updateStatusBars({ position: data.newPosition });

					// Check for nearby player after relocation
					gameContext.spaceco.checkForNearbyPlayer();

					// Play relocation sound
					gameContext.sounds.teleport.play({ volume: gameContext.volume.effects });
				},
			});

			// Also animate the status bars
			gameContext.scene.tweens.add({
				targets: [gameContext.spaceco.healthBar, gameContext.spaceco.healthBarFrame],
				duration: 1000,
				x: gridToPxPosition(data.newPosition.x),
				y: gridToPxPosition(data.newPosition.y) - 136,
				ease: 'Power2.easeInOut',
			});
		} else if (data.update === 'spacecoBuyItem') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Check for resource alerts after buying item
			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			// Play thank you sound after coins
			setTimeout(() => {
				gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });
			}, Math.min(100, data.cost) * 60);

			// Update SpaceCo state with complete data if provided
			if (data.spaceco) {
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
				if (data.spaceco.shop) {
					gameContext.serverState.world.spaceco.shop = data.spaceco.shop;
				}
			} else if (data.spacecoUpdates && data.spacecoUpdates.shop) {
				// Fallback to legacy format
				gameContext.serverState.world.spaceco.shop = data.spacecoUpdates.shop;
			}

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			gameContext.spaceco.dialog.options.view = 'shop';
		} else if (data.update === 'spacecoSellItem') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));
			
			// Check for resource alerts after selling item
			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);

			// Play coin sound effects for selling (fewer sounds than buying)
			[...Array(randInt(1, Math.min(50, Math.max(2, data.sellValue))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(50, 90)),
			);

			// Update SpaceCo state with complete data if provided
			if (data.spaceco) {
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
				if (data.spaceco.shop) {
					gameContext.serverState.world.spaceco.shop = data.spaceco.shop;
				}
			} else if (data.spacecoUpdates && data.spacecoUpdates.shop) {
				// Fallback to legacy format
				gameContext.serverState.world.spaceco.shop = data.spacecoUpdates.shop;
			}

			new Notify({ type: 'success', content: `Sold for $${data.sellValue}!`, timeout: 1500 });

			// Stay on the player inventory view to allow more sales
			gameContext.spaceco.dialog.options.view = 'shop_Player';
		} else if (data.update === 'spacecoEggSubmission') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Update egg hunt data in SpaceCo state
			if (!gameContext.serverState.world.spaceco.eggHunt) {
				gameContext.serverState.world.spaceco.eggHunt = {
					totalEggsSubmitted: 0,
					playerSubmissions: new Map(),
				};
			}
			gameContext.serverState.world.spaceco.eggHunt.totalEggsSubmitted = data.totalEggsSubmitted;
			gameContext.serverState.world.spaceco.eggHunt.playerSubmissions.set(data.playerId, data.playerSubmissions);

			// Special sound for egg submission - mysterious resonant tone
			gameContext.sounds.psykick_attack.play({ volume: gameContext.volume.effects * 0.7 });

			new Notify({
				type: 'success',
				content: `Submitted ${data.count} psykick egg${data.count > 1 ? 's' : ''} to the endgame hunt!`,
				timeout: 2000,
			});

			// Stay on the player inventory view and refresh dialog to show updated counts
			gameContext.spaceco.dialog.options.view = 'shop_Player';
			
			// Force dialog refresh to show updated egg submission counts
			if (gameContext.spaceco.dialog && gameContext.spaceco.dialog.render) {
				gameContext.spaceco.dialog.render();
			}
		} else if (data.update === 'spacecoBuyUpgrade') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Update status bars immediately after upgrade
			if (data.playerId === gameContext.playerId) {
				const { sprite } = gameContext.players.get(data.playerId);
				sprite.updateStatusBars();

				// Check for resource alerts after upgrade
				const updatedPlayer = gameContext.players.get(data.playerId);
				checkResourceAlerts(updatedPlayer);
			}

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			// Play thank you sound immediately with coins
			gameContext.sounds.alert_thank_you?.play({ volume: gameContext.volume.alerts });

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			// Update SpaceCo state with complete data if provided
			if (data.spaceco) {
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
				if (data.spaceco[data.type]) {
					gameContext.serverState.world.spaceco[data.type] = data.spaceco[data.type];
				}
			} else if (data.spacecoUpdates && data.spacecoUpdates[data.type]) {
				// Fallback to legacy format
				gameContext.serverState.world.spaceco[data.type] = data.spacecoUpdates[data.type];
			}

			gameContext.spaceco.dialog.options.view = 'upgrade';

			gameContext.dismissedAlerts = {};
		} else if (data.update === 'spacecoResupply') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Update SpaceCo shop stock
			if (data.spaceco?.shop) {
				gameContext.serverState.world.spaceco.shop = data.spaceco.shop;
				gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
				gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			}

			// Play coin sounds
			const cost = data.updates.credits ? Math.abs(data.updates.credits) : 100;
			[...Array(randInt(2, Math.min(100, Math.max(3, cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			// Show success notification
			new Notify({ type: 'success', content: 'Shop restocked!', timeout: 2000 });

			// Stay on shop view - setting view triggers re-render
			gameContext.spaceco.dialog.options.view = 'shop_SpaceCo';
		}
	}

	return false;
};
