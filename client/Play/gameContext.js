import Phaser from 'phaser';
import { Context } from 'vanilla-bean-components';

class Players extends Map {
	constructor() {
		super();
	}

	update(id, updater = current => current) {
		this.set(id, updater(this.get(id)));
	}
}

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
 * 	spaceco: Phaser.GameObjects.Sprite
 * 	volume: { music: number, alerts: number, interfaces: number, effects: number },
 * 	serverState: {},
 * 	players: Players,
 * 	gameId: '',
 * 	playerId: ''
 * }}
 */
const gameContext = new Context({
	sceneLayers: {},
	volume: { music: 0.2, alerts: 0.3, interfaces: 0.1, effects: 0.2, ...JSON.parse(localStorage.getItem('volume')) },
	players: new Players(),
});

export default gameContext;
