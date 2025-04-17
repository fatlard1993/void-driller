import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';

export class Lava extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Lava block
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "fill" | "full" } type - The lava type
	 */
	constructor(scene, x, y, type = 'fill') {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'map', `lava_${type}1`);

		this.anims.create({
			key: 'fill',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'lava_fill',
				start: 1,
				end: 3,
			}),
			frameRate: 1,
			repeat: 0,
		});

		this.on('animationcomplete-fill', () => {
			this.full();
		});

		this.anims.create({
			key: 'full',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'lava_full',
				start: 1,
				end: 3,
			}),
			frameRate: 3,
			repeat: -1,
		});

		this.anims.create({
			key: 'dissipate',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'lava_fill',
				start: 3,
				end: 1,
			}),
			frameRate: 1,
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
		this.anims.stop();
		this.setFlipY(true);
		this.anims.play('dissipate');
	}
}
