// ./client/Play/GameObjects/EnhancedGasSporecyst.js
import { Alien } from './Alien';

export class EnhancedGasSporecyst extends Alien {
	/**
	 * Create an EnhancedGasSporecyst
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 27; // Same as gas sporecyst but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'enhanced_gas_sporecyst';

		// Scale up for enhanced status
		this.setScale(1.1);
		// Toxic green tint
		this.setTint(0x44ff44);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 600,
			frameRate: 3,
			repeat: 0,
		});

		this.anims.create({
			key: 'release',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 1, spriteIndex + 2, spriteIndex + 1, spriteIndex],
			}),
			duration: 800,
			frameRate: 5,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	release() {
		this.anims.play('release');
	}
}
