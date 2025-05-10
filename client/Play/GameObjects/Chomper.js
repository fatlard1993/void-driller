import Phaser from 'phaser';

import { gridToPxPosition, randInt } from '../../../utils';

export class Chomper extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Chomper Monster
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "red" | "purple" } type - The monster type
	 */
	constructor(scene, x, y, type) {
		const monsterIndex = randInt(0, 14) * 8;
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'monsters', monsterIndex);

		this.monsterIndex = monsterIndex;

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('monsters', { start: monsterIndex, end: monsterIndex + 2 }),
			duration: 500,
			frameRate: 3,
			repeat: 0,
		});

		scene.add.existing(this);

		// this.sleep();
	}

	sleep() {
		// this.anims.play('sleep');
		this.anims.stop();
		this.setTexture(this.monsterIndex);
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
