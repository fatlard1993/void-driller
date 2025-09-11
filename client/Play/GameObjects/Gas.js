import Phaser from 'phaser';

import { gridToPxPosition, shuffleArray } from '../../../utils';

export class Gas extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Gas block
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "fill" | "full" } subtype - The gas subtype
	 */
	constructor(scene, x, y, subtype = 'fill') {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'fogs', 0);

		this.anims.create({
			key: 'fill',
			frames: this.anims.generateFrameNumbers('fogs', {
				start: 7,
				end: 4,
			}),
			frameRate: 1,
			repeat: 0,
		});

		this.on('animationcomplete-fill', () => {
			this.full();
		});

		this.anims.create({
			key: 'full',
			frames: this.anims.generateFrameNumbers('fogs', {
				frames: shuffleArray([0, 1, 2, 3]),
			}),
			frameRate: 0.5,
			repeat: -1,
		});

		this.anims.create({
			key: 'dissipate',
			frames: this.anims.generateFrameNumbers('fogs', {
				start: 4,
				end: 7,
			}),
			frameRate: 1,
			repeat: 0,
		});

		this.on('animationcomplete-dissipate', () => {
			this.destroy();
		});

		scene.add.existing(this);

		this[subtype]();
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
