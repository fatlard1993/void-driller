// ./client/shared/gameContext.js
import { gameContext } from '../../byod-web-game/client';

const safeParseLocalStorage = (key, defaultValue = null) => {
	try {
		return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
	} catch (err) {
		console.warn(key, err);

		return defaultValue;
	}
};

gameContext.achievementQueue = [];
gameContext.sceneLayers = {};
gameContext.sounds = {};
gameContext.volume = {
	music: 0.2,
	briefings: 0.6,
	alerts: 0.5,
	interfaces: 0.06,
	effects: 0.3,
	...safeParseLocalStorage('volume', {}),
};
gameContext.alert = { fuel: 0.33, health: 0.33, cargo: 0.33, ...safeParseLocalStorage('alert', {}) };
gameContext.briefings = { ...safeParseLocalStorage('briefings', {}) };
gameContext.dismissedAlerts = {};
gameContext.scale = safeParseLocalStorage('scale', 1.0);
gameContext.debugVisible = safeParseLocalStorage('debugVisible', false);
gameContext.notify = { autoDismissTimeout: 5000, ...safeParseLocalStorage('notify', {}) };

gameContext.autoPath = {
	enabled: true,
	strategy: 'prefer_easier',
	ignore: [],
	maxRadius: 7,
	// New options:
	obstacleAvoidanceWeight: 2.0, // How much to penalize paths near obstacles
	maxSearchIterations: 2000, // Maximum A* iterations
	preferOpenSpaces: true, // Prefer routing through open areas when possible
	...safeParseLocalStorage('autoPath', {}),
};

gameContext.getNearbyPlayers = (position, range = 1) => {
	const currentPlayer = gameContext.players.currentPlayer;
	if (!currentPlayer || !position) return [];

	const nearbyPlayers = [];

	// Check all players except the current one
	gameContext.players.forEach((player, playerId) => {
		// Skip self
		if (playerId === currentPlayer.id) return;

		// Skip if player doesn't have position
		if (!player.position) return;

		// Calculate Manhattan distance (grid-based movement)
		const distance = Math.abs(player.position.x - position.x) + Math.abs(player.position.y - position.y);

		if (distance <= range) {
			nearbyPlayers.push({
				...player,
				distance: distance,
			});
		}
	});

	// Sort by distance (closest first)
	return nearbyPlayers.sort((a, b) => a.distance - b.distance);
};

/**
 * @type {{
 * 	game: Phaser.Game,
 *  scene: Phaser.Scene,
 *  sceneLayers: {
 * 		ground: Phaser.GameObjects.Layer,
 * 		hazards: Phaser.GameObjects.Layer,
 * 		items: Phaser.GameObjects.Layer,
 * 		players: Phaser.GameObjects.Layer,
 * 		interfaces: Phaser.GameObjects.Layer
 * 	},
 * 	spaceco: Phaser.GameObjects.Sprite,
 * 	cursor: Phaser.GameObjects.Rectangle,
 * 	volume: { music: number, alerts: number, interfaces: number, effects: number },
 * 	alert: { fuel: number, health: number, cargo: number },
 *  dismissedAlerts: { fuel: boolean, health: boolean, cargo: boolean },
 * 	serverState: {},
 * 	briefings: {},
 *  achievementQueue: [],
 * 	sounds: {},
 * 	players: gameContext.Players,
 * 	gameId: '',
 * 	playerId: '',
 *  autoPath: {
 *    enabled: boolean,
 *    strategy: 'prefer_easier' | 'prefer_open' | 'prefer_strongest',
 *    ignore: string[]
 *  }
 * }}
 */
export default gameContext;
