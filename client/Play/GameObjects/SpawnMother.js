// ./client/Play/GameObjects/SpawnMother.js
import { Alien } from './Alien';

export class SpawnMother extends Alien {
	/**
	 * Create a SpawnMother
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 33; // Large breeding creature sprite

		super(scene, x, y, spriteIndex);

		this.name = 'spawn_mother';

		// Scale up significantly for mother creature
		this.setScale(1.5);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 1000,
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'spawn',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex + 2, spriteIndex + 1],
			}),
			duration: 1200,
			frameRate: 3,
			repeat: 2,
		});

		this.anims.create({
			key: 'rest',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1],
			}),
			duration: 2000,
			frameRate: 1,
			repeat: -1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	spawn() {
		this.anims.play('spawn');
	}

	rest() {
		this.anims.play('rest');
	}
}
