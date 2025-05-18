import Phaser from 'phaser';

import { gridToPxPosition, randInt } from '../../../utils';
import gameContext from '../gameContext';

export class Drill extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Player Drill
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "left" | "right" | "up" | "down" | "up_left" | "down_right" | "down_left" | "up_right" } orientation - The orientation of the drill
	 * @param {number} vehicle - vehicle index 0-14
	 * @param {number} drill - vehicle index 0-12
	 */
	constructor(scene, x, y, orientation = 'right', vehicle = randInt(0, 14), drill = randInt(0, 12)) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'vehicles', vehicle);

		this.drill = scene.add.image(gridToPxPosition(x), gridToPxPosition(y), 'drills', drill);

		this.drill.setScale(0.5);

		this.setOrientation(orientation);

		this.anims.create({
			key: 'teleport',
			frames: this.anims.generateFrameNumbers('teleport', {
				start: 0,
				end: 8,
			}),
			frameRate: 10,
			repeat: -1,
		});

		scene.add.existing(this);
		gameContext.sceneLayers.players.add(this);
		gameContext.sceneLayers.players.add(this.drill);
	}

	move(position, speed, orientation) {
		if (orientation) this.setOrientation(orientation);

		const pxPosition = gridToPxPosition(position);

		this.scene.tweens.add({
			targets: this,
			delay: 200,
			duration: speed + 10,
			...pxPosition,
		});

		this.scene.tweens.add({
			targets: this.drill,
			delay: 200,
			duration: speed + 10,
			...pxPosition,
			onComplete: () => {
				this.drill.setFlipY(false);
			},
		});

		const flips = 9;

		[...Array(flips)].forEach((_, index) =>
			setTimeout(
				() => {
					this.drill.setFlipY(!this.drill.flipY);
				},
				index * (speed / flips),
			),
		);
	}

	teleport(position, speed) {
		this.drill.visible = false;

		this.anims.play('teleport');

		this.scene.tweens.add({
			targets: this,
			duration: speed,
			...gridToPxPosition(position),
			onComplete: () => {
				this.anims.stop();
				this.drill.visible = true;
				this.setTexture('vehicles', randInt(0, 12));
				this.move(position, 0, this.orientation);
			},
		});
	}

	fall(position, speed = 800) {
		const pxPosition = gridToPxPosition(position);

		this.scene.tweens.add({ targets: this, duration: speed, ...pxPosition });

		this.scene.tweens.add({ targets: this.drill, duration: speed, ...pxPosition });
	}

	/**
	 * @param { "left" | "right" | "up_left" | "down_right" | "down_left" | "up_right" | "up_left_angle" | "down_right_angle" | "down_left_angle" | "up_right_angle" } orientation - The orientation of the drill
	 */
	setOrientation(orientation) {
		this.orientation = orientation;
		this.setOrigin(0.5, 0.5);

		this.drill.setFlipY(false);

		if (orientation.includes('_')) {
			this.angle = -90;
			this.drill.angle = -90;

			if (orientation === 'up_left') {
				this.setFlipX(false);
				this.setFlipY(true);

				this.drill.setFlipX(false);
				this.drill.setOrigin(-1, 0.8);
			} else if (orientation === 'up_right') {
				this.setFlipX(false);
				this.setFlipY(false);

				this.drill.setFlipX(false);
				this.drill.setOrigin(-1, 0.2);
			} else if (orientation === 'down_left') {
				this.setFlipX(true);
				this.setFlipY(true);

				this.drill.setFlipX(true);
				this.drill.setOrigin(2, 0.8);
			} else if (orientation === 'down_right') {
				this.setFlipX(true);
				this.setFlipY(false);

				this.drill.setFlipX(true);
				this.drill.setOrigin(2, 0.2);
			} else if (orientation === 'up_left_angle') {
				this.setFlipX(true);
				this.setFlipY(false);
				this.angle = 45;
				this.setOrigin(0.6, 0.6);

				this.drill.setFlipX(true);
				this.drill.angle = 45;
				this.drill.setOrigin(2.5, 0.4);
			} else if (orientation === 'up_right_angle') {
				this.setFlipX(false);
				this.setFlipY(false);
				this.angle = -45;
				this.setOrigin(0.4, 0.6);

				this.drill.setFlipX(false);
				this.drill.angle = -45;
				this.drill.setOrigin(-1.5, 0.4);
			} else if (orientation === 'down_left_angle') {
				this.setFlipX(true);
				this.setFlipY(false);
				this.angle = -45;
				this.setOrigin(0.6, 0.6);

				this.drill.setFlipX(true);
				this.drill.angle = -45;
				this.drill.setOrigin(2.5, 0.4);
			} else if (orientation === 'down_right_angle') {
				this.setFlipX(false);
				this.setFlipY(false);
				this.angle = 45;
				this.setOrigin(0.4, 0.6);

				this.drill.setFlipX(false);
				this.drill.angle = 45;
				this.drill.setOrigin(-1.5, 0.4);
			}
		} else {
			this.setFlipX(orientation === 'left');
			this.setFlipY(false);
			this.angle = 0;

			this.drill.setFlipX(orientation === 'left');
			this.drill.angle = 0;
			this.drill.setOrigin(orientation === 'left' ? 2 : -1, 0.2);
		}
	}
}
