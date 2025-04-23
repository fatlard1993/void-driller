import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';
import gameContext from '../gameContext';

export class Drill extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Player Drill
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "left" | "right" | "up" | "down" | "up_left" | "down_right" | "down_left" | "up_right" } orientation - The orientation of the drill
	 */
	constructor(scene, x, y, orientation = 'right') {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'map', 'drill_move1');

		this.setOrientation(orientation);

		this.anims.create({
			key: 'move',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'drill_move',
				start: 1,
				end: 3,
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.anims.create({
			key: 'teleport',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'drill_teleport',
				start: 1,
				end: 3,
			}),
			frameRate: 10,
			repeat: -1,
		});

		scene.add.existing(this);
		gameContext.sceneLayers.players.add(this);
	}

	move(position, speed, orientation) {
		if (orientation) this.setOrientation(orientation);

		this.anims.play('move');

		this.scene.tweens.add({
			targets: this,
			duration: speed,
			x: gridToPxPosition(position.x),
			y: gridToPxPosition(position.y),
			onComplete: () => {
				this.anims.stop();
			},
		});
	}

	teleport(position, speed) {
		this.anims.play('teleport');

		this.scene.tweens.add({
			targets: this,
			duration: speed,
			x: gridToPxPosition(position.x),
			y: gridToPxPosition(position.y),
			onComplete: () => {
				this.anims.play('move');
				this.anims.stop();
			},
		});
	}

	/**
	 * @param { "left" | "right" | "up_left" | "down_right" | "down_left" | "up_right" | "up_left_angle" | "down_right_angle" | "down_left_angle" | "up_right_angle" } orientation - The orientation of the drill
	 */
	setOrientation(orientation) {
		this.setOrigin(0.5, 0.5);

		if (orientation.includes('_')) {
			this.angle = -90;

			if (orientation === 'up_left') {
				this.setFlipX(false);
				this.setFlipY(true);
			} else if (orientation === 'up_right') {
				this.setFlipX(false);
				this.setFlipY(false);
			} else if (orientation === 'down_left') {
				this.setFlipX(true);
				this.setFlipY(true);
			} else if (orientation === 'down_right') {
				this.setFlipX(true);
				this.setFlipY(false);
			} else if (orientation === 'up_left_angle') {
				this.setFlipX(true);
				this.setFlipY(false);
				this.angle = 45;
				this.setOrigin(0.6, 0.6);
			} else if (orientation === 'up_right_angle') {
				this.setFlipX(false);
				this.setFlipY(false);
				this.angle = -45;
				this.setOrigin(0.4, 0.6);
			} else if (orientation === 'down_left_angle') {
				this.setFlipX(true);
				this.setFlipY(false);
				this.angle = -45;
				this.setOrigin(0.6, 0.6);
			} else if (orientation === 'down_right_angle') {
				this.setFlipX(false);
				this.setFlipY(false);
				this.angle = 45;
				this.setOrigin(0.4, 0.6);
			}
		} else {
			this.setFlipX(orientation === 'left');
			this.setFlipY(false);
			this.angle = 0;
		}
	}
}
