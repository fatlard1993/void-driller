import Phaser from 'phaser';

// Camera zoom scales even scrollFactor 0 objects toward the screen center; this undoes it so children are placed and sized in screen pixels
export class ScreenLayer extends Phaser.GameObjects.Container {
	constructor(scene, depth) {
		super(scene);

		this.setScrollFactor(0);
		this.setDepth(depth);
		this.pin();

		scene.add.existing(this);
		scene.events.on(Phaser.Scenes.Events.PRE_RENDER, this.pin, this);
		this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.PRE_RENDER, this.pin, this));
	}

	pin() {
		const camera = this.scene.cameras.main;
		const inverse = 1 / camera.zoom;

		this.setScale(inverse);
		this.setPosition(camera.width * camera.originX * (1 - inverse), camera.height * camera.originY * (1 - inverse));
	}
}
