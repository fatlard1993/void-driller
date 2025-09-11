// ./client/Play/GameObjects/GasSporecyst.js
import { Alien } from './Alien';

export class GasSporecyst extends Alien {
	/**
	 * Create a GasSporecyst
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 27; // Green gas-producing creature sprite

		super(scene, x, y, spriteIndex);

		this.name = 'gas_sporecyst';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 800,
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'release',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 1, spriteIndex + 2, spriteIndex + 1, spriteIndex],
			}),
			duration: 1000,
			frameRate: 4,
			repeat: 1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	release() {
		this.anims.play('release');
	}
}
