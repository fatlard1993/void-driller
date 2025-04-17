import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';

export class Spaceco extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Spaceco Outpost
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'map', 'spaceco_hurt0');

		this.setOrigin(0.5, 0.65);

		scene.add.existing(this);
	}

	hurt(damage) {
		this.setTexture(`spaceco_hurt${damage}`);
	}
}
