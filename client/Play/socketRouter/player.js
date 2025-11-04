import { convertRange, randInt } from 'vanilla-bean-components';
import gameContext from '../../shared/gameContext';
import { destroyGround } from '../effects';
import { Drill, Item } from '../GameObjects';
import { Achievement } from '../../shared/Achievement';
import Notify from '../../shared/Notify';
import { vehicles, drills } from '../../../constants';

// Check player resource levels against alert thresholds
export function checkResourceAlerts(player) {
	if (!player || player.id !== gameContext.playerId) return;

	const alerts = gameContext.alert;
	const dismissed = gameContext.dismissedAlerts;

	// Check fuel level
	if (player.fuel && player.maxFuel) {
		const fuelRatio = player.fuel / player.maxFuel;
		if (fuelRatio <= alerts.fuel && !dismissed.fuel) {
			gameContext.sounds.alert_fuel?.play({ volume: gameContext.volume.alerts });
			gameContext.dismissedAlerts.fuel = true;

			// Show visual alert positioned near center, avoiding player UI
			// Calculate fuel bar position (middle bar)
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

			// Show visual alert positioned near center, stacked above fuel alerts
			// Calculate health bar position (left bar)
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

			// Show visual alert positioned near center, stacked below fuel alerts
			// Calculate cargo bar position (right bar)
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

export default data => {
	if (data.update === 'playerMove') {
		let player = gameContext.players.get(data.player.id);

		if (!player?.sprite) {
			const sprite = new Drill(
				gameContext.scene,
				data.player.position.x,
				data.player.position.y,
				data.player.orientation,
				gameContext.serverState.world.vehicles[data.player.configuration.vehicle].spriteIndex,
				gameContext.serverState.world.drills[data.player.configuration.drill].spriteIndex,
			);

			gameContext.players.set(data.player.id, { ...player, ...data.player, sprite });
			gameContext.sceneLayers.players.add(sprite);
		} else gameContext.players.set(data.player.id, { ...player, ...data.player });

		player = gameContext.players.get(data.player.id);

		const gridConfig = gameContext.serverState.world.grid[player.position.x][player.position.y];

		destroyGround(player.position);

		if (gridConfig.items.length) {
			gridConfig.items.forEach(({ sprite }) => {
				if (sprite.scene) sprite[player.id === gameContext.playerId ? 'collect' : 'destroy']();
			});
		}

		player.sprite.move(player.position, 500, player.orientation);

		// Check for resource alerts after player movement
		checkResourceAlerts(player);

		// Update HUD if it exists
		if (player.id === gameContext.playerId && gameContext.statusBarHUD) {
			gameContext.statusBarHUD.update(player);
		}

		gameContext.serverState.world.grid[player.position.x][player.position.y].ground = {};
		gameContext.serverState.world.grid[player.position.x][player.position.y].items = [];
	} else if (data.update === 'addPlayer') {
		console.log('🎮 addPlayer event received:', data.newPlayer);

		const sprite = new Drill(
			gameContext.scene,
			data.newPlayer.position.x,
			data.newPlayer.position.y,
			data.newPlayer.orientation,
			vehicles[data.newPlayer.configuration.vehicle].spriteIndex,
			drills[data.newPlayer.configuration.drill].spriteIndex,
			data.newPlayer.name,
		);

		gameContext.players.set(data.newPlayer.id, { ...data.newPlayer, sprite });
		gameContext.sceneLayers.players.add(sprite);

		console.log('✅ Player added successfully:', data.newPlayer.id, gameContext.players.size, 'total players');
	} else if (data.update === 'removePlayer') {
		const player = gameContext.players.get(data.id);

		player.sprite.destroy();

		gameContext.players.delete(data.id);
	} else if (data.update === 'hurtPlayers') {
		data.players.forEach(player => {
			gameContext.players.update(player.id, _ => ({ ..._, health: player.health }));

			if (player.id === gameContext.playerId) {
				const { sprite } = gameContext.players.get(player.id);

				sprite.updateStatusBars();

				// Check for health alerts after taking damage
				const updatedPlayer = gameContext.players.get(player.id);
				checkResourceAlerts(updatedPlayer);

				// Update HUD
				if (gameContext.statusBarHUD) {
					gameContext.statusBarHUD.update(updatedPlayer);
				}

				gameContext.scene.sound.play('hurt', {
					volume: convertRange(data.damage, [0, 3], [0, gameContext.volume.effects]),
				});
			}
		});
	} else if (data.update === 'useItem') {
		console.log('useItem', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		// Check for resource alerts after using items (fuel, health items, etc.)
		const updatedPlayer = gameContext.players.get(data.playerId);
		checkResourceAlerts(updatedPlayer);

		// Update HUD
		if (data.playerId === gameContext.playerId && gameContext.statusBarHUD) {
			gameContext.statusBarHUD.update(updatedPlayer);
		}

		if (data.item === 'spaceco_teleporter' || data.item.startsWith('activated_teleporter')) {
			gameContext.players.get(data.playerId).sprite.teleport(data.updates.position, 1000);

			if (data.item.startsWith('activated_teleporter')) {
				gameContext.serverState.world.grid[data.stationPosition.x][data.stationPosition.y].items =
					gameContext.serverState.world.grid[data.stationPosition.x][data.stationPosition.y].items.filter(item => {
						if (item.name !== 'teleport_station') return true;

						if (item.sprite?.scene) item.sprite.destroy();
					});
			}
		} else if (data.item === 'repair_nanites') {
			[...Array(randInt(2, 40))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.heal.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);
			const player = gameContext.players.get(data.playerId);

			player.sprite.move(player.position, 0, player.orientation);
		} else if (data.item === 'advanced_teleporter') {
			const sprite = new Item(gameContext.scene, data.stationPosition.x, data.stationPosition.y, 'teleport_station');

			gameContext.serverState.world.grid[data.stationPosition.x][data.stationPosition.y].items.push({
				name: 'teleport_station',
				sprite,
			});
		} else if (data.item === 'timed_charge' || data.item === 'remote_charge') {
			const sprite = new Item(gameContext.scene, data.bombPosition.x, data.bombPosition.y, data.item);

			gameContext.serverState.world.grid[data.bombPosition.x][data.bombPosition.y].items.push({
				name: data.item,
				sprite,
			});
		} else {
			console.warn(`unknown item ${data.item}`);
		}
	} else if (data.update === 'playerFall') {
		console.log('playerFall', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		gameContext.players.get(data.playerId).sprite.fall(data.updates.position);
	} else if (data.update === 'updatePlayer') {
		console.log('sync player', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		// Check for resource alerts after player update
		const updatedPlayer = gameContext.players.get(data.playerId);
		checkResourceAlerts(updatedPlayer);
	} else if (data.update === 'playerMovementComplete') {
		console.log('playerMovementComplete', data);
		gameContext.players.update(data.playerId, _ => ({
			..._,
			moving: false,
			_movingStartTime: null,
			_stuckClickCount: 0,
		}));

		// Check for resource alerts after movement completion (fuel consumption)
		const player = gameContext.players.get(data.playerId);
		checkResourceAlerts(player);
	} else if (data.update === 'playerCantMove') {
		console.log('playerCantMove', data);
		gameContext.players.update(data.playerId, _ => ({
			..._,
			moving: false,
			_movingStartTime: null,
			_stuckClickCount: 0,
		}));
	} else if (data.update === 'playerMovementInterrupted') {
		console.log('playerMovementInterrupted', data);
		gameContext.players.update(data.playerId, _ => ({
			..._,
			moving: false,
			_movingStartTime: null,
			_stuckClickCount: 0,
		}));

		// Show rescue dialog if stranded due to no fuel or no health
		if (['no_fuel', 'no_health'].includes(data.reason) && data.playerId === gameContext.playerId) {
			import('../RescueDialog.js').then(module => {
				gameContext.openDialog = new module.default();
			});
		}
	} else if (data.update === 'playerMovementError') {
		console.log('playerMovementError', data);
		gameContext.players.update(data.playerId, _ => ({
			..._,
			moving: false,
			_movingStartTime: null,
			_stuckClickCount: 0,
		}));
	} else if (data.update === 'achievement') {
		console.log('achievement', data);
		// Only show achievement to the player who earned it
		if (data.playerId === gameContext.playerId) {
			new Achievement({ achievement: data.achievement });
		}
	}

	return false;
};
