import gameContext from '../../shared/gameContext';
import Notify from '../../shared/Notify';
import { explode, implode } from '../effects';
import { Gas, Lava } from '../GameObjects';
import { createAlien } from '../GameObjects/aliens';

// Import the alert checking function from player.js
import { checkResourceAlerts } from './player';

// Note: This file has extensive direct grid manipulations that need
// refactored to use safe update patterns, but due to their complexity,
// we rely on server-side validation to prevent corruption instead.

export default data => {
	if (data.update === 'dissipateGas') {
		data.addedGas.forEach(gas => {
			const sprite = new Gas(gameContext.scene, gas.x, gas.y, 'fill');

			gameContext.serverState.world.grid[gas.x][gas.y].hazards = gameContext.serverState.world.grid[gas.x][
				gas.y
			].hazards.filter(hazard => {
				if (hazard.type === 'alien') {
					gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });

					hazard.sprite.destroy();

					return false;
				} else return true;
			});

			gameContext.serverState.world.grid[gas.x][gas.y].hazards.push({ type: 'gas', sprite });
			gameContext.sceneLayers.hazards.add(sprite);
		});

		data.removedGas.forEach(gas => {
			const updatedHazards = [];

			gameContext.serverState.world.grid[gas.x][gas.y].hazards.forEach(hazard => {
				if (hazard.type === 'gas') hazard.sprite.dissipate();
				else updatedHazards.push(hazard);
			});

			gameContext.serverState.world.grid[gas.x][gas.y].hazards = updatedHazards;
		});
	} else if (data.update === 'spillLava') {
		data.addedLava.forEach(lava => {
			const sprite = new Lava(gameContext.scene, lava.x, lava.y, 'fill');

			gameContext.serverState.world.grid[lava.x][lava.y].hazards = gameContext.serverState.world.grid[lava.x][
				lava.y
			].hazards.filter(hazard => {
				if (hazard.type === 'alien') {
					gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });

					hazard.sprite.destroy();

					return false;
				} else return true;
			});

			gameContext.serverState.world.grid[lava.x][lava.y].hazards.push({ type: 'lava', sprite });
			gameContext.sceneLayers.hazards.add(sprite);
		});

		data.removedLava.forEach(lava => {
			const updatedHazards = [];

			gameContext.serverState.world.grid[lava.x][lava.y].hazards.forEach(hazard => {
				if (hazard.type === 'lava') hazard.sprite.dissipate();
				else updatedHazards.push(hazard);
			});

			gameContext.serverState.world.grid[lava.x][lava.y].hazards = updatedHazards;
		});
	}
	if (data.update === 'alien_wake') {
		const alien = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			hazard => hazard.type === 'alien' && hazard.name === data.alien,
		);

		if (!alien?.sprite) return;

		alien.sprite.awake();

		if (data.move) {
			alien.sprite.move(data.move, 500, data.orientation);

			// Update grid positions
			gameContext.serverState.world.grid[data.position.x][data.position.y].hazards = gameContext.serverState.world.grid[
				data.position.x
			][data.position.y].hazards.filter(hazard => !(hazard.type === 'alien' && hazard.name === data.alien));

			gameContext.serverState.world.grid[data.move.x][data.move.y].hazards.push(alien);
		}
	} else if (data.update === 'alien_sleep') {
		const alien = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			hazard => hazard.type === 'alien' && hazard.name === data.name,
		);

		if (!alien?.sprite) return;

		alien.sprite.sleep();
	} else if (data.update === 'alien_attack') {
		const alien = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			hazard => hazard.type === 'alien',
		);

		if (!alien?.sprite) return;

		alien.sprite.attack?.();

		if (data.playerUpdates && data.playerId === gameContext.playerId) {
			gameContext.players.update(data.playerId, _ => ({
				..._,
				...data.playerUpdates,
				hull: { ..._.hull, ...(data.playerUpdates?.hull || {}) },
			}));
			
			// Check for resource alerts after alien attack damage
			const updatedPlayer = gameContext.players.get(data.playerId);
			checkResourceAlerts(updatedPlayer);
		}
	} else if (data.update === 'alien_message') {
		if (data.targetPlayerId === gameContext.playerId) {
			new Notify({ type: 'tip', textContent: `Alien ${data.name} says: ${data.message}`, timeout: 3000 });
		}
	} else if (data.update === 'alien_move') {
		// Handle alien movement - move sprite from old position to new position
		const oldAlien = gameContext.serverState.world.grid[data.from.x][data.from.y].hazards.find(
			hazard => hazard.type === 'alien' && hazard.name === data.name,
		);

		if (oldAlien?.sprite) {
			// Move the sprite
			oldAlien.sprite.move(data.to, 500, data.orientation);

			// Update the game state grid
			gameContext.serverState.world.grid[data.from.x][data.from.y].hazards = gameContext.serverState.world.grid[
				data.from.x
			][data.from.y].hazards.filter(hazard => !(hazard.type === 'alien' && hazard.name === data.name));

			// Add to new position
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
	} else if (data.update === 'alien_spawn') {
		// Handle dynamic alien spawning
		const { spawnPosition, spawnType, spawnTarget } = data;

		if (spawnType === 'alien') {
			const sprite = createAlien(gameContext.scene, spawnPosition.x, spawnPosition.y, spawnTarget, 'right');

			if (sprite) {
				// Add to game state
				if (!gameContext.serverState.world.grid[spawnPosition.x][spawnPosition.y].hazards) {
					gameContext.serverState.world.grid[spawnPosition.x][spawnPosition.y].hazards = [];
				}

				gameContext.serverState.world.grid[spawnPosition.x][spawnPosition.y].hazards.push({
					type: 'alien',
					name: spawnTarget,
					sprite: sprite,
				});

				// Add to scene
				gameContext.sceneLayers.hazards.add(sprite);
			}
		}
	} else if (data.update === 'explodeBomb') {
		explode({ position: data.position, radius: data.radius });
	} else if (data.update === 'explodeImplosion') {
		implode({
			position: data.position,
			radius: data.radius,
			implosionType: data.implosionType,
			collectedMinerals: data.collectedMinerals,
			collectedItems: data.collectedItems,
		});

		// Show collection notification to the player who used the implosion
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
	} else if (data.update === 'groundEffect') {
		// Handle mineral-specific ground effects
		if (data.type === 'gasRelease') {
			// Play hissing sound for gas release
			gameContext.scene.sound.play('psykick_attack', {
				volume: gameContext.volume.effects * 0.6,
				rate: 1.5,
			});

			// Create gas hazard sprite at position (already handled server-side, but add visual feedback)
			const gasSprite = new Gas(gameContext.scene, data.position.x, data.position.y, 'fill');
			gameContext.sceneLayers.hazards.add(gasSprite);

			// Add to client state
			if (!gameContext.serverState.world.grid[data.position.x][data.position.y].hazards) {
				gameContext.serverState.world.grid[data.position.x][data.position.y].hazards = [];
			}
			gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.push({
				type: 'gas',
				sprite: gasSprite,
			});

			// Show notification if current player triggered it
			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'warning',
					content: 'Byzanium released gas when stressed!',
					timeout: 2000,
				});
			}
		} else if (data.type === 'explosionWarning') {
			// Play warning sound for impending adamantite explosion
			gameContext.scene.sound.play('comm_err', { volume: gameContext.volume.effects * 0.7 });

			// Show warning notification if current player triggered it
			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'error',
					content: 'Adamantite destabilizing...',
					timeout: 1500,
				});
			}
		} else if (data.type === 'explosion') {
			// Use existing explosion effect
			explode({ position: data.position, radius: data.radius });

			// Show explosion notification if current player triggered it
			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'error',
					content: 'Adamantite exploded from mining stress!',
					timeout: 3000,
				});
			}
		} else if (data.type === 'psychicPulse') {
			// Play psychic pulse sound for saronite
			gameContext.scene.sound.play('pickup_egg', {
				volume: gameContext.volume.effects * 0.4,
			});

			// Show notification if current player triggered it
			if (data.playerId === gameContext.playerId) {
				new Notify({
					type: 'tip',
					content: 'Saronite pulsates eerily...',
					timeout: 2000,
				});
			}
		}
	}

	return false;
};
