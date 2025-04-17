import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';
import gameContext from '../gameContext';

export class Ground extends Phaser.GameObjects.Sprite {
	/**
	 * Create a piece of Ground
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "black" | "blue" | "green" | "orange" | "pink" | "purple" | "red" | "teal" | "white" | "yellow" } name - The ground name
	 */
	constructor(scene, x, y, name) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'map', `ground_${name}`);

		this.name = name;

		this.anims.create({
			key: 'dig',
			showOnStart: true,
			hideOnEnd: true,
			frames: this.anims.generateFrameNames('map', {
				prefix: `ground_${name}_dig`,
				start: 1,
				end: 3,
			}),
			duration: 500,
			repeat: 0,
		});

		this.on('animationcomplete-dig', () => {
			this.destroy();
		});

		scene.add.existing(this);
	}

	dig() {
		this.scene.sound.play('dig', { volume: gameContext.volume.effects });

		this.anims.play('dig', false);
	}
}
