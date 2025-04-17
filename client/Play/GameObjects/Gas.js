import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';

export class Gas extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Gas block
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "poisonous" | "noxious" } type - The gas type
	 * @param { "fill" | "full" } subtype - The gas subtype
	 */
	constructor(scene, x, y, type = 'poisonous', subtype = 'fill') {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'map', `${type}_gas_${subtype}1`);

		this.setFlipY(true);

		this.anims.create({
			key: 'fill',
			frames: this.anims.generateFrameNames('map', {
				prefix: `${type}_gas_fill`,
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
				prefix: `${type}_gas_full`,
				start: 1,
				end: 3,
			}),
			frameRate: 3,
			repeat: -1,
		});

		this.anims.create({
			key: 'dissipate',
			frames: this.anims.generateFrameNames('map', {
				prefix: `${type}_gas_fill`,
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

		this[subtype]();
	}

	fill() {
		this.anims.play('fill');
	}

	full() {
		this.anims.play('full');
	}

	dissipate() {
		this.anims.stop();
		this.setFlipY(false);
		this.anims.play('dissipate');
	}
}
