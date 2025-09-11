// ./client/Play/GameObjects/HiveDrone.js
import { Alien } from './Alien';

export class HiveDrone extends Alien {
	/**
	 * Create a HiveDrone
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 21; // Green hive creature sprite

		super(scene, x, y, spriteIndex);

		this.name = 'hive_drone';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 600,
			frameRate: 4,
			repeat: 0,
		});

		this.anims.create({
			key: 'work',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 1, spriteIndex + 2, spriteIndex + 1, spriteIndex],
			}),
			duration: 1000,
			frameRate: 4,
			repeat: -1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('work');
	}
}
