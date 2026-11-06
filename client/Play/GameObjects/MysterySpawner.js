import { Alien } from './Alien';

export class MysterySpawner extends Alien {
	/**
	 * Create a MysterySpawner: the unidentified structure that seeds scouts
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 36;

		super(scene, x, y, spriteIndex);

		this.name = 'mystery_spawner';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 1 }),
			duration: 1200,
			frameRate: 2,
			repeat: -1,
		});

		scene.add.existing(this);
	}

	awake() {
		if (this.isAwake) return;
		this.isAwake = true;
		this.anims.play('awake');
	}
}
