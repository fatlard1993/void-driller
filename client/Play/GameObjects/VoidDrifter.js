// ./client/Play/GameObjects/VoidDrifter.js
import { Alien } from './Alien';

export class VoidDrifter extends Alien {
	/**
	 * Create a VoidDrifter
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 15; // Blue ethereal entity sprite

		super(scene, x, y, spriteIndex);

		this.name = 'void_drifter';

		// Semi-transparent for ethereal effect
		this.setAlpha(0.8);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 1000,
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'phase',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex + 2, spriteIndex + 1],
			}),
			duration: 1200,
			frameRate: 3,
			repeat: -1,
		});

		this.anims.create({
			key: 'flee',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex + 1, end: spriteIndex + 2 }),
			duration: 300,
			frameRate: 8,
			repeat: 0,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('phase');
	}

	flee() {
		this.anims.play('flee');
	}

	sleep() {
		super.sleep();
		// Fade out when sleeping
		this.scene.tweens.add({
			targets: this,
			alpha: 0.3,
			duration: 500,
		});
	}
}
