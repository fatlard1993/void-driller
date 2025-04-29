import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';
import SpacecoDialog from '../SpacecoDialog';
import gameContext from '../gameContext';

export class Spaceco extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Spaceco Outpost
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 */
	constructor(scene, x, y) {
		super(
			scene,
			gridToPxPosition(x),
			gridToPxPosition(y),
			'map',
			`spaceco_health${gameContext.serverState.world.spaceco.health}`,
		);

		this.setOrigin(0.5, 0.65);

		this.tradeButton = scene.add.text(0, 0, '[trade]');
		this.tradeButton.visible = false;

		this.tradeButton.setInteractive({ draggable: false, cursor: 'pointer' });

		this.tradeButton.on('pointerover', () => {
			gameContext.cursor.visible = false;
			this.tradeButton.setTint(0x00ff00);
		});
		this.tradeButton.on('pointerout', () => {
			this.tradeButton.setTint(0xffffff);
		});
		this.tradeButton.on('pointerdown', () => {
			this.dialog = new SpacecoDialog();
		});

		scene.add.existing(this);

		gameContext.sceneLayers.interfaces.add(this.tradeButton);
	}

	hurt() {
		console.log(`spaceco_health${gameContext.serverState.world.spaceco.health}`);
		this.setTexture('map', `spaceco_health${gameContext.serverState.world.spaceco.health}`);

		gameContext.scene.sound.play('hurt', { volume: gameContext.volume.effects });
	}

	fall(position, speed = 800) {
		this.scene.tweens.add({
			targets: this,
			duration: speed,
			x: gridToPxPosition(position.x),
			y: gridToPxPosition(position.y),
			onComplete: () => {
				this.anims.stop();
				this.hurt();
			},
		});
	}

	showPrompt() {
		if (this.tradeButton.visible) return;

		this.tradeButton.x = this.x - 33;
		this.tradeButton.y = this.y - 80;

		this.tradeButton.visible = true;

		gameContext.sounds.alert.play({ volume: gameContext.volume.alerts });
	}

	hidePrompt() {
		this.tradeButton.visible = false;
	}
}
