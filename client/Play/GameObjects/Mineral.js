import Phaser from 'phaser';

import { gridToPxPosition, rand, randInt } from '../../../utils';
import gameContext from '../gameContext';

export class Mineral extends Phaser.GameObjects.Image {
	/**
	 * Create a Mineral
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "black" | "blue" | "green" | "orange" | "pink" | "purple" | "red" | "teal" | "white" | "yellow" } name - The mineral name
	 * @param {object} origin - The x/y origin (randomized if undefined)
	 */
	constructor(scene, x, y, name, origin) {
		const mineralColorIndex = {
			teal: 0,
			blue: 1,
			red: 2,
			purple: 3,
			pink: 4,
			orange: 5,
			green: 6,
			yellow: 7,
			black: 8,
			white: 9,
		};
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'minerals', mineralColorIndex[name] * 6 + randInt(0, 5));

		this.name = name;

		this.setOrigin(origin.x ?? rand(-0.3, 1.2), origin.y ?? rand(-0.3, 1.2));
		this.setAlpha(0.9);
		this.setScale(rand(0.6, 0.8));
		this.setAngle(randInt(-33, 33));

		scene.add.existing(this);
	}

	collect() {
		const player = gameContext.players.get(gameContext.playerId);

		this.scene.tweens.add({
			targets: this,
			x: gridToPxPosition(player.position.x) - randInt(-16, 16),
			y: gridToPxPosition(player.position.y) - randInt(111, 222),
			alpha: 0.3,
			duration: randInt(300, 700),
			delay: randInt(0, 300),
			ease: 'Linear',
			onComplete: () => {
				this.destroy();

				gameContext.scene.sound.play('pickup', { volume: gameContext.volume.effects });
			},
		});
	}
}
