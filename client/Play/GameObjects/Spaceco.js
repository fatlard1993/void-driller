import Phaser from 'phaser';
import { theme } from 'vanilla-bean-components';

import { convertRange, getSurroundingRadius, gridToPxPosition, pxToGridPosition } from '../../../utils';
import SpacecoDialog from '../SpacecoDialog';
import gameContext from '../../shared/gameContext';

export class Spaceco extends Phaser.GameObjects.Sprite {
	/**
	 * Create a Spaceco Outpost
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param {number} variant - Which image variant to use
	 */
	constructor(scene, x, y, variant = 0) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'spaceco', variant);

		this.setOrigin(0.5, 0.82);

		this.tradeButton = scene.add.text(0, 0, 'Trade', {
			fontSize: '12px',
			fontFamily: 'monospace',
			fill: '#ffffff',
			backgroundColor: 'hsl(209, 55%, 45%)',
			padding: { x: 8, y: 4 }
		});

		// Apply standard button shadow effects to match vanilla-bean-components
		this.tradeButton.preFX.addShadow(0, 1, 0.05, 0.3, 0x000000, 2, 1.0);
		this.tradeButton.preFX.addShadow(0, -1, 0.05, 0.3, 0x000000, 2, 1.0);
		this.tradeButton.preFX.addShadow(1, 0, 0.05, 0.3, 0x000000, 2, 1.0);
		this.tradeButton.preFX.addShadow(-1, 0, 0.05, 0.5, 0x000000, 2, 1.0);
		this.tradeButton.visible = false;

		this.tradeButton.setInteractive({ draggable: false, cursor: 'pointer' });

		this.tradeButton.on('pointerover', () => {
			gameContext.cursor.visible = false;
			// Simulate button hover effect with slight position shift
			this.tradeButton.y = this.tradeButton.y - 1;
		});
		this.tradeButton.on('pointerout', () => {
			// Reset button position
			this.tradeButton.y = this.tradeButton.y + 1;
		});
		this.tradeButton.on('pointerdown', () => {
			if (!gameContext.openDialog?.elem?.open && !gameContext.openDialog?.elem?.getAnimations?.()?.length) {
				gameContext.openDialog = this.dialog = new SpacecoDialog();
			}
		});

		this.healthBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.healthBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);

		this.healthBarFrame.visible = false;
		this.healthBar.visible = false;

		this.updateStatusBars({ position: { x, y } });

		gameContext.sceneLayers.interfaces.add(this.healthBarFrame);
		gameContext.sceneLayers.interfaces.add(this.healthBar);

		scene.add.existing(this);

		gameContext.sceneLayers.interfaces.add(this.tradeButton);
	}

	updateStatusBars({ position, speed = 0 } = {}) {
		const { spaceco } = gameContext.serverState.world;

		this.healthBar.width = convertRange(spaceco.health, [0, 9], [1, 100]);

		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			if (this.healthBar.visible) {
				this.scene.tweens.add({ targets: this.healthBar, duration: speed, x: x, y: y - 136 });
				this.scene.tweens.add({ targets: this.healthBarFrame, duration: speed, x: x, y: y - 136 });
			} else {
				this.healthBar.x = x;
				this.healthBar.y = y - 136;

				this.healthBarFrame.x = x;
				this.healthBarFrame.y = y - 136;
			}
		}

		this.healthBarFrame.visible = true;
		this.healthBar.visible = true;
	}

	hurt() {
		const { spaceco } = gameContext.serverState.world;

		if (spaceco.health === 0) {
			const player = gameContext.players.currentPlayer;

			const delta = {
				x: spaceco.position.x - player.position.x,
				y: spaceco.position.y - player.position.y,
			};

			gameContext.scene.cameras.main.shake(
				1000,
				convertRange(Math.abs(delta.x) + Math.abs(delta.y), [0, 20], [0.01, 0]),
			);
			gameContext.scene.cameras.main.flash(600);
			gameContext.scene.sound.play('explode', { volume: gameContext.volume.effects });
			// this.destroy();
		} else {
			gameContext.scene.sound.play('hurt', { volume: gameContext.volume.effects });
		}

		this.updateStatusBars({ position: spaceco.position });
	}

	fall(position, speed = 800) {
		this.hidePrompt();

		this.scene.tweens.add({
			targets: this,
			duration: speed,
			x: gridToPxPosition(position.x),
			y: gridToPxPosition(position.y),
			onComplete: () => {
				this.anims.stop();
				this.hurt();
				this.checkForNearbyPlayer();
			},
		});
	}

	checkForNearbyPlayer() {
		const player = gameContext.players.currentPlayer;

		if (!player) return;

		this.nearSpaceco = getSurroundingRadius(player.position, 1).some(
			position =>
				pxToGridPosition(gameContext.spaceco.x) === position.x &&
				pxToGridPosition(gameContext.spaceco.y) === position.y,
		);

		if (this.nearSpaceco) gameContext.spaceco.showPrompt();
		else gameContext.spaceco.hidePrompt();
	}

	relocate(newPosition, duration = 1000) {
		this.hidePrompt();

		const newPixelPosition = gridToPxPosition(newPosition);

		// Create relocation effect
		const relocateEffect = this.scene.add.sprite(this.x, this.y, 'teleport', 0);
		relocateEffect.anims.play('teleport');

		// Fade out current position
		this.scene.tweens.add({
			targets: this,
			alpha: 0,
			duration: duration / 3,
			onComplete: () => {
				// Snap to new position
				this.x = newPixelPosition.x;
				this.y = newPixelPosition.y;

				// Create arrival effect
				const arrivalEffect = this.scene.add.sprite(this.x, this.y, 'teleport', 0);
				arrivalEffect.anims.play('teleport');

				// Fade back in
				this.scene.tweens.add({
					targets: this,
					alpha: 1,
					duration: duration / 3,
					onComplete: () => {
						this.updateStatusBars({ position: newPosition });
						this.checkForNearbyPlayer();

						// Clean up effects
						relocateEffect.destroy();
						arrivalEffect.on('animationcomplete', () => {
							arrivalEffect.destroy();
						});
					},
				});
			},
		});

		this.scene.sound.play('teleport', { volume: gameContext.volume.effects });
	}

	showPrompt() {
		if (this.tradeButton.visible) return;

		// Center the corporate trade button above the SpaceCo outpost
		this.tradeButton.x = this.x;
		this.tradeButton.y = this.y - 160;
		this.tradeButton.setOrigin(0.5, 0.5); // Center the text

		this.tradeButton.visible = true;

		gameContext.sounds.alert.play({ volume: gameContext.volume.alerts });
	}

	hidePrompt() {
		this.tradeButton.visible = false;
	}
}
