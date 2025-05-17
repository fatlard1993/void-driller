import Phaser from 'phaser';

import { gridToPxPosition, randInt } from '../../../utils';
import gameContext from '../gameContext';

export class Item extends Phaser.GameObjects.Image {
	/**
	 * Create an Item
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "oil" | "remote_charge" | "repair_nanites" | "responder" | "responder_teleporter" | "teleporter" | "timed_charge" } name - The item name
	 */
	constructor(scene, x, y, name) {
		const itemIndex = {
			repair_nanites: 0,
			teleporter: 1,
			responder: 3,
			responder_teleporter: 5,
			oil: 6,
			timed_charge: 7,
			remote_charge: 8,
		};
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'items', itemIndex[name]);

		this.name = name;

		this.setOrigin(0.5, -0.01);

		scene.add.existing(this);
	}

	collect() {
		const player = gameContext.players.get(gameContext.playerId);

		this.scene.tweens.add({
			targets: this,
			x: gridToPxPosition(player.position.x) - randInt(-16, 16),
			y: gridToPxPosition(player.position.y) - randInt(111, 222),
			alpha: 0.3,
			duration: randInt(400, 900),
			delay: randInt(0, 500),
			ease: 'Linear',
			onComplete: () => {
				this.destroy();

				gameContext.scene.sound.play('pickup', { volume: gameContext.volume.effects });
			},
		});
	}
}
