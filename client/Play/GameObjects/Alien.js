// ./client/Play/GameObjects/Alien.js
import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';

export class Alien extends Phaser.GameObjects.Sprite {
	/**
	 * Create an Alien
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param {number} spriteIndex - The initial index of the sprite
	 */
	constructor(scene, x, y, spriteIndex) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'aliens', spriteIndex);

		this.initialIndex = spriteIndex;
		this.currentGridPosition = { x, y };

		scene.add.existing(this);
	}

	/**
	 * @param { "left" | "right" } orientation - The orientation of the alien
	 */
	setOrientation(orientation) {
		this.setFlipX(orientation === 'left');
	}

	sleep() {
		this.anims.stop();
		this.setTexture('aliens', this.initialIndex);
	}

	awake() {
		// Default awake behavior - override in subclasses
	}

	attack() {
		// Default attack behavior - override in subclasses
	}

	move(position, speed, orientation) {
		if (orientation) this.setOrientation(orientation);

		this.awake();

		// Update our grid position tracking
		this.currentGridPosition = { x: position.x, y: position.y };

		this.scene.tweens.add({
			targets: this,
			duration: speed,
			x: gridToPxPosition(position.x),
			y: gridToPxPosition(position.y),
		});
	}
}
