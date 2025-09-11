// ./client/Play/GameObjects/GiftBearer.js
import { Alien } from './Alien';

export class GiftBearer extends Alien {
	/**
	 * Create a GiftBearer
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 21; // Reuse hive drone sprite with different behavior

		super(scene, x, y, spriteIndex);

		this.name = 'gift_bearer';

		// Golden tint for gift-bearing creature
		this.setTint(0xffdd88);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 1000,
			frameRate: 3,
			repeat: 0,
		});

		this.anims.create({
			key: 'offer',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex + 2, spriteIndex + 1],
			}),
			duration: 1200,
			frameRate: 3,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	offer() {
		this.anims.play('offer');
	}
}
