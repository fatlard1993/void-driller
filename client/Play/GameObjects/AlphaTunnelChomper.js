// ./client/Play/GameObjects/AlphaTunnelChomper.js
import { Alien } from './Alien';

export class AlphaTunnelChomper extends Alien {
	/**
	 * Create an AlphaTunnelChomper
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		const spriteIndex = 9; // Same as tunnel chomper but enhanced

		super(scene, x, y, spriteIndex);

		this.name = 'alpha_tunnel_chomper';

		// Scale up for pack leader status
		this.setScale(1.1);
		// Darker tint for alpha status
		this.setTint(0xcc8844);

		this.anims.create({
			key: 'awake',
			frames: this.anims.generateFrameNumbers('aliens', { start: spriteIndex, end: spriteIndex + 2 }),
			duration: 400,
			frameRate: 6,
			repeat: 0,
		});

		this.anims.create({
			key: 'chomp',
			frames: this.anims.generateFrameNumbers('aliens', {
				frames: [spriteIndex + 2, spriteIndex + 1, spriteIndex + 2, spriteIndex],
			}),
			duration: 600,
			frameRate: 7,
			repeat: 2,
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
