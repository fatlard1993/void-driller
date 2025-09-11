// ./client/Play/GameObjects/GrandSpawnMother.js
import { Alien } from './Alien';

export class GrandSpawnMother extends Alien {
	/**
	 * Create a GrandSpawnMother
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 33; // Same as spawn mother but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'grand_spawn_mother';

		// Scale up massively for grand status
		this.setScale(1.8);
		// Ancient breeding creature tint
		this.setTint(0xffaa44);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 1200,
			frameRate: 1,
			repeat: 0,
		});

		this.anims.create({
			key: 'spawn',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1, spriteIndex + 2, spriteIndex + 1],
			}),
			duration: 1500,
			frameRate: 2,
			repeat: 3,
		});

		this.anims.create({
			key: 'rest',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex, spriteIndex + 1],
			}),
			duration: 3000,
			frameRate: 0.5,
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
