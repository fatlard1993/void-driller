import {
	createClientEventRouter,
	createValidationMiddleware,
	createLoggingMiddleware,
} from '@fatlard1993/web-game-framework/client';

import gameContext from '../shared/gameContext';
import { inventoryItem } from '../shared/inventoryItem';
import { registerWorldEvents } from '../Play/eventRouter';

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

	// The rig takes the ground and the loot; a placed device stays
	const cell = gameContext.serverState.world.grid[data.player.position.x]?.[data.player.position.y];

	if (cell) {
		cell.ground?.sprite?.dig();
		cell.ground = {};
		cell.items = cell.items.filter(item => {
			if (item.placed) return true;
			if (item.sprite?.scene) item.sprite.destroy();
			return false;
		});
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

	const quiet = ['remove_detonator', 'remove_teleporter', 'disarm_bomb', 'deactivate_teleporter'];
	if (!quiet.includes(data.item)) scene.showAlert(`Used ${inventoryItem(data.item).name}`, 'info', data.playerId);
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
	// The asteroid to come: views of it before the transition draws it are not a transport this page missed
	gameContext.arrivingAt = data.newWorldState?.name;
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

	registerWorldEvents(router);

	return router;
};
