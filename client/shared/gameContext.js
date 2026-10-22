// ./client/shared/gameContext.js
import { gameContext } from '@fatlard1993/web-game-framework/client';
import { readStorage } from '@vanilla-bean/components/utils';

gameContext.achievementQueue = [];
gameContext.sceneLayers = {};
gameContext.sounds = {};
gameContext.volume = {
	music: 0.2,
	briefings: 0.6,
	alerts: 0.5,
	interfaces: 0.06,
	effects: 0.3,
	...readStorage('volume', {}),
};
gameContext.alert = { fuel: 0.33, health: 0.33, cargo: 0.33, ...readStorage('alert', {}) };
gameContext.briefings = { ...readStorage('briefings', {}) };
gameContext.dismissedAlerts = {};
gameContext.scale = readStorage('scale', 1.0);
gameContext.debugVisible = readStorage('debugVisible', false);
gameContext.notifySettings = { autoDismissTimeout: 5000, ...readStorage('notify', {}) };

gameContext.autoPath = {
	enabled: true,
	strategy: 'prefer_easier',
	ignore: [],
	maxRadius: 7,
	// New options:
	obstacleAvoidanceWeight: 2.0, // How much to penalize paths near obstacles
	maxSearchIterations: 2000, // Maximum A* iterations
	preferOpenSpaces: true, // Prefer routing through open areas when possible
	...readStorage('autoPath', {}),
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
