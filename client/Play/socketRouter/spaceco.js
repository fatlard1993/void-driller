import { randInt } from 'vanilla-bean-components';

import gameContext from '../../shared/gameContext';
import Notify from '../../shared/Notify';
import { Achievement } from '../../shared/Achievement';
import { gridToPxPosition } from '../../../utils';

export default data => {
	if (data.update === 'spacecoBuyTransport') {
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		// Update SpaceCo state if provided
		if (data.spaceco) {
			gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
			gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
			if (data.spaceco.hull) {
				gameContext.serverState.world.spaceco.hull = data.spaceco.hull;
			}
		}

		if (data.playerId === gameContext.playerId) {
			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			gameContext.spaceco.dialog.options.view = 'transport';
		}
		setTimeout(() => window.location.reload(), 1500);
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

			[...Array(randInt(2, Math.min(100, Math.max(3, data.gain / 10))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

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
			}

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

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
			}

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

			[...Array(randInt(2, Math.min(100, Math.max(3, data.purchasedRepairs))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.heal.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

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

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
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

			new Notify({ type: 'success', content: 'Thank you!', timeout: 1000 });

			gameContext.spaceco.dialog.options.view = 'shop';
		} else if (data.update === 'spacecoSellItem') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

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

			// Stay on the player inventory view
			gameContext.spaceco.dialog.options.view = 'shop_Player';
		} else if (data.update === 'spacecoBuyUpgrade') {
			gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

			// Update status bars immediately after upgrade
			if (data.playerId === gameContext.playerId) {
				const { sprite } = gameContext.players.get(data.playerId);
				sprite.updateStatusBars();
			}

			[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);

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
		}
	}

	return false;
};
