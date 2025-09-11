// ./client/Play/GameObjects/VolatileLavaSpitter.js
import { Alien } from './Alien';

export class VolatileLavaSpitter extends Alien {
	/**
	 * Create a VolatileLavaSpitter
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 12; // Same as lava spitter but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'volatile_lava_spitter';

		// Scale up for volatile status
		this.setScale(1.1);
		// Intense volcanic tint
		this.setTint(0xff2222);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 500,
			frameRate: 5,
			repeat: 0,
		});

		this.anims.create({
			key: 'spit',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2, spriteIndex],
			}),
			duration: 600,
			frameRate: 7,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	spit() {
		this.anims.play('spit');
	}
}
