// ./client/Play/GameObjects/ElitePsykickWarrior.js
import { Alien } from './Alien';

export class ElitePsykickWarrior extends Alien {
	/**
	 * Create an ElitePsykickWarrior
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 3; // Same as psykick warrior but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'elite_psykick_warrior';

		// Scale up for elite status
		this.setScale(1.2);
		// Enhanced purple crystalline tint
		this.setTint(0xaa66ff);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 500,
			frameRate: 5,
			repeat: 0,
		});

		this.anims.create({
			key: 'defend',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2, spriteIndex],
			}),
			duration: 600,
			frameRate: 6,
			repeat: 2,
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
