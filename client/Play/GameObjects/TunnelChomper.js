// ./client/Play/GameObjects/TunnelChomper.js
import { Alien } from './Alien';

export class TunnelChomper extends Alien {
	/**
	 * Create a TunnelChomper
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 9; // Aggressive borer sprite

		super(scene, x, y, spriteIndex);

		this.name = 'tunnel_chomper';

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 500,
			frameRate: 5,
			repeat: 0,
		});

		this.anims.create({
			key: 'chomp',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2, spriteIndex],
			}),
			duration: 700,
			frameRate: 6,
			repeat: 1,
		});

		scene.add.existing(this);
	}

	awake() {
		this.anims.play('awake');
	}

	attack() {
		this.anims.play('chomp');
	}
}
