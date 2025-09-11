// ./client/Play/GameObjects/MasterGiftBearer.js
import { Alien } from './Alien';

export class MasterGiftBearer extends Alien {
	/**
	 * Create a MasterGiftBearer
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 21; // Same as gift bearer but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'master_gift_bearer';

		// Scale up for master status
		this.setScale(1.1);
		// Radiant golden tint
		this.setTint(0xffee44);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 1200,
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'offer',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex + 2, spriteIndex + 1],
			}),
			duration: 1500,
			frameRate: 2,
			repeat: 3,
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
