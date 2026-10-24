import {
	createClientEventRouter,
	createValidationMiddleware,
	createLoggingMiddleware,
} from '@fatlard1993/web-game-framework/client';

import gameContext from '../shared/gameContext';
import { destroyGround } from '../Play/effects';

// Handle player movement updates
const handlePlayerMove = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	let playerData = gameContext.players.get(data.player.id);

	if (!playerData) {
		// Player doesn't exist yet, let addPlayer handle it
		const serverPlayer = gameContext.serverState.players.find(p => p.id === data.player.id);
		if (serverPlayer) {
			scene.addPlayer(serverPlayer);
			playerData = gameContext.players.get(data.player.id);
		}
	}

	if (!playerData?.sprite) return;

	const sprite = playerData.sprite;

	// Use the same smooth movement animation as Play scene
	sprite.move(data.player.position, 500, data.player.orientation);

	// Update label position (will follow the sprite animation)
	setTimeout(() => {
		scene.updatePlayerLabel(data.player.id, data.player.position);
	}, 500);

	// Update sprite stats
	if (data.player.health !== undefined && sprite.updateHealth) {
		sprite.updateHealth(data.player.health);
	}

	// Update server state
	const serverPlayer = gameContext.serverState.players.find(p => p.id === data.player.id);
	if (serverPlayer) {
		Object.assign(serverPlayer, data.player);
	}

	// Handle ground destruction and item collection - matching Play scene behavior
	if (data.ground) {
		const pos = data.player.position;
		const grid = gameContext.serverState.world.grid;
		const cell = grid[pos.x]?.[pos.y];

		if (cell) {
			// Destroy ground with animation (if ground was dug)
			if (data.ground.ground) {
				destroyGround(pos);
			}

			// Handle item collection with proper animation
			if (cell.items?.length) {
				cell.items.forEach(item => {
					if (item.sprite?.scene) {
						// Use destroy animation for other players in Watch mode
						item.sprite.destroy();
					}
				});
				cell.items = [];
			}
		}
	}
};

// Handle adding new players
const handleAddPlayer = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	// Add to server state if not exists
	if (!gameContext.serverState.players.find(p => p.id === data.newPlayer.id)) {
		gameContext.serverState.players.push(data.newPlayer);
	}

	// Create sprite if not exists
	if (!gameContext.players.has(data.newPlayer.id)) {
		scene.addPlayer(data.newPlayer);
	}

	// Show alert around the new player
	setTimeout(() => {
		scene.showAlert(`${data.newPlayer.name} joined`, 'success', data.newPlayer.id);
	}, 100); // Small delay to ensure sprite is created
};

// Handle removing players
const handleRemovePlayer = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	const player = gameContext.players.get(data.id);
	if (player) {
		player.sprite?.destroy();
		gameContext.players.delete(data.id);
	}

	// Remove label
	const label = scene.playerLabels.get(data.id);
	if (label) {
		label.destroy();
		scene.playerLabels.delete(data.id);
	}

	// Remove from server state
	const index = gameContext.serverState.players.findIndex(p => p.id === data.id);
	if (index > -1) {
		const [left] = gameContext.serverState.players.splice(index, 1);
		scene.showAlert(`${left.name} left`, 'warning');
	}
};

// Handle achievement notifications
const handleAchievement = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	const player = gameContext.serverState.players.find(p => p.id === data.playerId);
	if (!player) return;

	scene.showAchievementNotification(data.playerId, data.achievement);
	scene.showAlert(`${player.name}: ${data.achievement.name}`, 'success');
};

// Handle player damage
const handleHurtPlayers = data => {
	if (!data.players) return;

	data.players.forEach(playerUpdate => {
		const playerData = gameContext.players.get(playerUpdate.id);
		if (playerData?.sprite?.updateHealth) {
			playerData.sprite.updateHealth(playerUpdate.health);
		}

		const serverPlayer = gameContext.serverState.players.find(p => p.id === playerUpdate.id);
		if (serverPlayer) {
			serverPlayer.health = playerUpdate.health;
		}
	});
};

// Handle item usage
const handleUseItem = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	const player = gameContext.serverState.players.find(p => p.id === data.playerId);
	if (!player) return;

	// Show alert for interesting items positioned around the player
	const alertableItems = ['teleporter', 'bomb', 'implosion_device', 'healing_kit', 'repair_kit', 'oil', 'battery'];
	if (alertableItems.includes(data.item)) {
		const itemName = data.item.replace(/_/g, ' ');
		scene.showAlert(`Used ${itemName}`, 'info', data.playerId);
	}
};

// Handle world updates (aliens, hazards, etc.)
const handleWorldUpdate = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	// Handle different world update types
	if (data.update === 'alien_attack') {
		const player = gameContext.serverState.players.find(p => p.id === data.targetPlayerId);
		if (player) {
			scene.showAlert(`Alien attack!`, 'danger', data.targetPlayerId);
		}
	} else if (data.update === 'explodeBomb' || data.update === 'explodeImplosion') {
		// Explosions don't have a specific player position
		scene.showAlert('💥 Explosion!', 'warning');
	}
};

// Handle transport transition
const handleSpacecoBuyTransport = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	// Show notification
	const player = gameContext.serverState.players.find(p => p.id === data.playerId);
	if (player) {
		scene.showAlert(`Transporting to ${data.world}...`, 'info', data.playerId);
	}

	// Start the world transition immediately
	if (data.newWorldState && scene.startWorldTransition) {
		setTimeout(() => {
			scene.startWorldTransition(data.newWorldState);
		}, 500);

		// Fade in when ship journey completes (matching Play mode music timing)
		// Ship timeline: 1s fade-in + 3s delay + 17s flight = 21s total
		// Call fadeInWorld at the end of ship journey
		setTimeout(() => {
			if (scene.fadeInWorld) {
				scene.fadeInWorld();
			}
		}, 500 + 21000); // 500ms initial delay + 21s ship journey
	}
};

// Handle SpaceCo falling
const handleSpacecoFall = data => {
	const scene = gameContext.scene;
	if (!scene) return;

	// Update server state
	gameContext.serverState.world.spaceco.position = data.position;
	if (data.health !== undefined) {
		gameContext.serverState.world.spaceco.health = data.health;
	}

	// Update SpaceCo state if provided
	if (data.spaceco) {
		gameContext.serverState.world.spaceco.xp = data.spaceco.xp;
		gameContext.serverState.world.spaceco.stats = data.spaceco.stats;
		if (data.spaceco.health !== undefined) {
			gameContext.serverState.world.spaceco.health = data.spaceco.health;
		}
	}

	// Animate the fall if SpaceCo sprite exists
	const spaceco = gameContext.serverState.world.spaceco;
	if (spaceco.sprite && spaceco.sprite.fall) {
		spaceco.sprite.fall(data.position);
	}

	// Show alert
	scene.showAlert('SpaceCo building fell!', 'warning');
};

export default () => {
	const router = createClientEventRouter({
		gameId: gameContext.gameId,
		logger: console,
	});

	router.use(createValidationMiddleware({ requiredFields: ['id', 'update'] }));

	if (process.env.NODE_ENV === 'development') router.use(createLoggingMiddleware({ exclude: ['playerMove'] }));

	router.on('playerMove', handlePlayerMove);
	router.on('addPlayer', handleAddPlayer);
	router.on('removePlayer', handleRemovePlayer);
	router.on('achievement', handleAchievement);
	router.on('hurtPlayers', handleHurtPlayers);
	router.on('useItem', handleUseItem);
	router.on('alien_attack', handleWorldUpdate);
	router.on('explodeBomb', handleWorldUpdate);
	router.on('explodeImplosion', handleWorldUpdate);
	router.on('spacecoBuyTransport', handleSpacecoBuyTransport);
	router.on('spacecoFall', handleSpacecoFall);

	return router;
};
