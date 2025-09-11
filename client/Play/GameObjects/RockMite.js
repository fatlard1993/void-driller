// ./client/Play/GameObjects/RockMite.js
import { Alien } from './Alien';

export class RockMite extends Alien {
	/**
	 * Create a RockMite
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 6; // Small orange creature sprite

		super(scene, x, y, spriteIndex);

		this.name = 'rock_mite';

		// Scale down for small creature
		this.setScale(0.8);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 400,
			frameRate: 6,
			repeat: 0,
		});

		this.anims.create({
			key: 'collect',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2],
			}),
			duration: 600,
			frameRate: 4,
			repeat: 2,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	collect() {
		this.anims.play('collect');
	}
}
