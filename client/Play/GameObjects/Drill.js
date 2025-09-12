import Phaser from 'phaser';

import { gridToPxPosition, randInt } from '../../../utils';
import gameContext from '../../shared/gameContext';
import { gameLog } from '../../../utils/logger.js';

export class Drill extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Player Drill
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "left" | "right" | "up" | "down" | "up_left" | "down_right" | "down_left" | "up_right" } orientation - The orientation of the drill
	 * @param {number} vehicle - vehicle index 0-14
	 * @param {number} drill - vehicle index 0-12
	 * @param {string} name - The name of the driver
	 */
	constructor(scene, x, y, orientation = 'right', vehicle = randInt(0, 14), drill = randInt(0, 12), name) {
		// Defensive check - this should never happen if validation is working properly
		if (typeof x !== 'number' || typeof y !== 'number') {
			gameLog.error('Drill constructor called with invalid position', { x, y, name, vehicle, drill });
			throw new Error(`Invalid position passed to Drill constructor: x=${x}, y=${y}`);
		}

		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'vehicles', vehicle);

		this.drill = scene.add.image(gridToPxPosition(x), gridToPxPosition(y), 'drills', drill);

		this.drill.setScale(0.5);

		this.setOrientation(orientation);

		this.name = name;
		this.nameTag = scene.add.text(0, 0, name);

		this.nameTag.preFX.addShadow(0, 0, 0.06, 0.75, 0xff0000, 4, 0.8);
		this.nameTag.visible = false;

		this.updateNameTag({ position: { x, y } });

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

	updateNameTag({ position, speed = 0 } = {}) {
		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			const nameWidth = this.name.length * 10;

			if (this.nameTag.visible) {
				this.scene.tweens.add({ targets: this.nameTag, duration: speed, x: x - nameWidth / 2, y: y - 60 });
			} else {
				this.nameTag.x = x - nameWidth / 2;
				this.nameTag.y = y - 60;
			}
		}

		this.nameTag.visible = true;
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

		this.updateNameTag({ position, speed });

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

		// Reset drill properties
		this.drill.setFlipY(false);
		this.drill.setFlipX(false);
		this.setFlipX(false);
		this.setFlipY(false);
		this.angle = 0;
		this.drill.angle = 0;

		if (orientation.includes('_')) {
			if (orientation.includes('_angle')) {
				// True diagonal/angled movement - CORRECTED ALIGNMENT
				const baseOrientation = orientation.replace('_angle', '');

				if (baseOrientation === 'up_left') {
					this.setFlipX(true);
					this.angle = 45;
					this.setOrigin(0.6, 0.6);
					this.drill.setFlipX(true);
					this.drill.angle = 45;
					this.drill.setOrigin(2.2, 0.5);
				} else if (baseOrientation === 'up_right') {
					this.setFlipX(false);
					this.angle = -45;
					this.setOrigin(0.4, 0.6);
					this.drill.setFlipX(false);
					this.drill.angle = -45;
					this.drill.setOrigin(-1.2, 0.5);
				} else if (baseOrientation === 'down_left') {
					this.setFlipX(true);
					this.angle = -45;
					this.setOrigin(0.65, 0.65);
					this.drill.setFlipX(true);
					this.drill.angle = -45;
					this.drill.setOrigin(2.7, 0.5);
				} else if (baseOrientation === 'down_right') {
					this.setFlipX(false);
					this.angle = 45;
					this.setOrigin(0.4, 0.6);
					this.drill.setFlipX(false);
					this.drill.angle = 45;
					this.drill.setOrigin(-1.5, 0.4);
				}
			} else {
				// Vertical movement with side support
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
				}
			}
		} else {
			// Pure horizontal movement - unchanged
			this.setFlipX(orientation === 'left');
			this.drill.setFlipX(orientation === 'left');
			this.drill.setOrigin(orientation === 'left' ? 2 : -1, 0.2);
		}
	}
}
