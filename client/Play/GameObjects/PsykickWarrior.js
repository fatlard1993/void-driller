// ./client/Play/GameObjects/PsykickWarrior.js
import { Alien } from './Alien';

export class PsykickWarrior extends Alien {
	/**
	 * Create a PsykickWarrior
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 3; // Purple psykick warrior sprite

		super(scene, x, y, spriteIndex);

		this.name = 'psykick_warrior';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 600,
			frameRate: 4,
			repeat: 0,
		});

		this.anims.create({
			key: 'defend',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 1, spriteIndex + 2, spriteIndex + 1],
			}),
			duration: 800,
			frameRate: 3,
			repeat: 1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	attack() {
		this.anims.play('defend');
	}
}
