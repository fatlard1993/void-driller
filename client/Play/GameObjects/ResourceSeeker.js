// ./client/Play/GameObjects/ResourceSeeker.js
import { Alien } from './Alien';

export class ResourceSeeker extends Alien {
	/**
	 * Create a ResourceSeeker
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 15; // Reuse void drifter sprite with different behavior

		super(scene, x, y, spriteIndex);

		this.name = 'resource_seeker';

		// Golden tint for resource-hoarding creature
		this.setTint(0xffdd88);
		this.setAlpha(0.9);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 600,
			frameRate: 4,
			repeat: 0,
		});

		this.anims.create({
			key: 'hoard',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex, spriteIndex + 1],
			}),
			duration: 1000,
			frameRate: 4,
			repeat: -1,
		});

		this.anims.create({
			key: 'drop',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex + 1, end: spriteIndex + 2 }),
			duration: 400,
			frameRate: 6,
			repeat: 1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('hoard');
	}

	drop() {
		this.anims.play('drop');
	}
}
