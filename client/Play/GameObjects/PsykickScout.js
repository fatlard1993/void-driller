// ./client/Play/GameObjects/PsykickScout.js
import { Alien } from './Alien';

export class PsykickScout extends Alien {
	/**
	 * Create a PsykickScout
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 0; // Purple psykick base sprite

		super(scene, x, y, spriteIndex);

		this.name = 'psykick_scout';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 800,
			frameRate: 3,
			repeat: 0,
		});

		this.anims.create({
			key: 'communicate',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex + 2, spriteIndex + 1]
			}),
			duration: 1000,
			frameRate: 4,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	communicate() {
		this.anims.play('communicate');
	}
}