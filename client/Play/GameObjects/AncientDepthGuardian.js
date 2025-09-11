// ./client/Play/GameObjects/AncientDepthGuardian.js
import { Alien } from './Alien';

export class AncientDepthGuardian extends Alien {
	/**
	 * Create an AncientDepthGuardian
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 18; // Same as depth guardian but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'ancient_depth_guardian';

		// Scale up substantially for ancient status
		this.setScale(1.4);
		// Ancient crystalline tint
		this.setTint(0x6644aa);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 1000,
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'guard',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex, spriteIndex + 2],
			}),
			duration: 2000,
			frameRate: 1,
			repeat: -1,
		});

		this.anims.create({
			key: 'protect',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex + 1, end: spriteIndex + 2 }),
			duration: 800,
			frameRate: 3,
			repeat: 3,
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
