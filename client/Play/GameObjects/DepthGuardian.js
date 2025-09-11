// ./client/Play/GameObjects/DepthGuardian.js
import { Alien } from './Alien';

export class DepthGuardian extends Alien {
	/**
	 * Create a DepthGuardian
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 18; // Large guardian sprite

		super(scene, x, y, spriteIndex);

		this.name = 'depth_guardian';

		// Scale up for imposing presence
		this.setScale(1.2);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 800,
			frameRate: 3,
			repeat: 0,
		});

		this.anims.create({
			key: 'guard',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex, spriteIndex + 2]
			}),
			duration: 1500,
			frameRate: 2,
			repeat: -1,
		});

		this.anims.create({
			key: 'protect',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex + 1, end: spriteIndex + 2 }),
			duration: 600,
			frameRate: 4,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('guard');
	}

	attack() {
		this.anims.play('protect');
	}
}