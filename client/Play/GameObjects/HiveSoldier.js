// ./client/Play/GameObjects/HiveSoldier.js
import { Alien } from './Alien';

export class HiveSoldier extends Alien {
	/**
	 * Create a HiveSoldier
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 24; // Green hive soldier sprite

		super(scene, x, y, spriteIndex);

		this.name = 'hive_soldier';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 500,
			frameRate: 5,
			repeat: 0,
		});

		this.anims.create({
			key: 'defend',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2, spriteIndex],
			}),
			duration: 800,
			frameRate: 5,
			repeat: 1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	attack() {
		this.anims.play('defend');
	}
}
