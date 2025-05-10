import Phaser from 'phaser';

import { gridToPxPosition, randInt } from '../../../utils';

export class Lava extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Lava block
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "fill" | "full" } type - The lava type
	 */
	constructor(scene, x, y, type = 'fill') {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'lava', 0);

		this.anims.create({
			key: 'fill',
			frames: this.anims.generateFrameNumbers('lava', {
				start: 11,
				end: 6,
			}),
			frameRate: 3,
			repeat: 0,
		});

		this.on('animationcomplete-fill', () => {
			this.full();
		});

		this.anims.create({
			key: 'full',
			frames: this.anims.generateFrameNumbers('lava', {
				start: 0,
				end: 5,
			}),
			frameRate: 9,
			repeat: -1,
		});

		this.anims.create({
			key: 'dissipate',
			frames: this.anims.generateFrameNumbers('lava', {
				start: 6,
				end: 11,
			}),
			frameRate: 3,
			repeat: 0,
		});

		this.on('animationcomplete-dissipate', () => {
			this.destroy();
		});

		scene.add.existing(this);

		this[type]();
	}

	fill() {
		this.anims.play('fill');
	}

	full() {
		this.anims.play('full');
	}

	dissipate() {
		this.anims.play('dissipate');
	}
}
