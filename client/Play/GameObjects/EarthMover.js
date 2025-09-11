// ./client/Play/GameObjects/EarthMover.js
import { Alien } from './Alien';

export class EarthMover extends Alien {
	/**
	 * Create an EarthMover
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 9; // Reuse tunnel chomper sprite but different behavior

		super(scene, x, y, spriteIndex);

		this.name = 'earth_mover';

		// Brownish tint for earth-working creature
		this.setTint(0xaa8866);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 800,
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'work',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 1, spriteIndex + 2, spriteIndex + 1, spriteIndex],
			}),
			duration: 1500,
			frameRate: 3,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	work() {
		this.anims.play('work');
	}
}
