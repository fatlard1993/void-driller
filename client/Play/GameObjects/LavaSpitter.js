// ./client/Play/GameObjects/LavaSpitter.js
import { Alien } from './Alien';

export class LavaSpitter extends Alien {
	/**
	 * Create a LavaSpitter
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 12; // Red volcanic creature sprite

		super(scene, x, y, spriteIndex);

		this.name = 'lava_spitter';

		// Reddish tint for volcanic creature
		this.setTint(0xff6644);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 600,
			frameRate: 4,
			repeat: 0,
		});

		this.anims.create({
			key: 'spit',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2, spriteIndex],
			}),
			duration: 800,
			frameRate: 5,
			repeat: 1,
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
