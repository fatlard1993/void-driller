import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';

export class Chomper extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Chomper Monster
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "red" | "purple" } type - The monster type
	 */
	constructor(scene, x, y, type) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'map', `${type}_monster_sleep1`);

		this.anims.create({
			key: 'sleep',
			frames: this.anims.generateFrameNames('map', {
				prefix: `${type}_monster_sleep`,
				start: 1,
				end: 3,
			}),
			frameRate: 2,
			repeat: -1,
		});

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNames('map', {
				prefix: `${type}_monster_awake`,
				start: 1,
				end: 3,
			}),
			frameRate: 12,
			repeat: -1,
		});

		scene.add.existing(this);

		this.sleep();
	}

	sleep() {
		this.anims.play('sleep');
	}

	awake() {
		this.anims.play('awake');
	}

	/**
	 * @param { "left" | "right" } orientation - The orientation of the chomper
	 */
	setOrientation(orientation) {
		this.setFlipX(orientation === 'left');
	}

	move(position, speed, orientation) {
		if (orientation) this.setOrientation(orientation);

		this.awake();

		this.scene.tweens.add({
			targets: this,
			duration: speed,
			x: gridToPxPosition(position.x),
			y: gridToPxPosition(position.y),
		});
	}
}
