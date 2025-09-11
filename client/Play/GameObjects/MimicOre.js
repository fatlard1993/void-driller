// ./client/Play/GameObjects/MimicOre.js
import { Alien } from './Alien';

export class MimicOre extends Alien {
	/**
	 * Create a MimicOre
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 30; // Disguised predator sprite

		super(scene, x, y, spriteIndex);

		this.name = 'mimic_ore';

		// Start completely still and mineral-like
		this.setTint(0xcccccc); // Mineral-like coloring

		this.anims.create({
			key: 'reveal',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 400,
			frameRate: 4,
			repeat: 0,
		});

		this.anims.create({
			key: 'attack',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex + 1, end: spriteIndex + 2 }),
			duration: 600,
			frameRate: 6,
			repeat: 1,
		});

		scene.add.existing(this);
	}

	awake() {
		// Remove mineral tint and reveal true form
		this.setTint(0xffffff);
		this.anims.play('reveal');
	}

	attack() {
		this.anims.play('attack');
	}

	sleep() {
		super.sleep();
		// Return to mineral disguise
		this.setTint(0xcccccc);
	}
}
