// ./client/Play/GameObjects/Player.js
import { convertRange, theme } from 'vanilla-bean-components';
import Phaser from 'phaser';

import { engines } from '../../../constants';
import { gridToPxPosition, getSurroundingRadius } from '../../../utils';
import gameContext from '../../shared/gameContext';
import TradeDialog from '../TradeDialog';
import { useItem } from '../../api';
import { Drill } from './Drill';

const iconIndex = {
	oil: 0,
	health: 1,
	cargo: 2,
	super_oxygen_liquid_nitrogen: 3,
	battery: 4,
};

const fuelColors = {
	oil: Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
	battery: Phaser.Display.Color.ValueToColor(theme.colors.blue.toRgbString()).color,
	super_oxygen_liquid_nitrogen: Phaser.Display.Color.ValueToColor(theme.colors.teal.toRgbString()).color,
};

export class Player extends Drill {
	constructor(scene, x, y, orientation, vehicle, drill, name) {
		super(scene, x, y, orientation, vehicle, drill, name);

		this.healthBarIcon = scene.add.image(0, 0, 'icons', 1);
		this.healthBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.healthBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);

		this.fuelBarIcon = scene.add.image(0, 0, 'icons', 0);
		this.fuelBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.fuelBar = scene.add.rectangle(0, 0, 100, 3, fuelColors.oil);

		this.cargoBarIcon = scene.add.image(0, 0, 'icons', 2);
		this.cargoBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.cargoBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.dark(theme.colors.green).toRgbString()).color,
		);

		this.showStatusBars(false);
		this.updateStatusBars({ position: { x, y } });

		// Trade-related properties
		this.tradePromptVisible = false;
		this.tradeButton = null;
		this.nearbyPlayersLastCheck = [];

		gameContext.sceneLayers.interfaces.add(this.healthBarIcon);
		gameContext.sceneLayers.interfaces.add(this.healthBarFrame);
		gameContext.sceneLayers.interfaces.add(this.healthBar);
		gameContext.sceneLayers.interfaces.add(this.fuelBarIcon);
		gameContext.sceneLayers.interfaces.add(this.fuelBarFrame);
		gameContext.sceneLayers.interfaces.add(this.fuelBar);
		gameContext.sceneLayers.interfaces.add(this.cargoBarIcon);
		gameContext.sceneLayers.interfaces.add(this.cargoBarFrame);
		gameContext.sceneLayers.interfaces.add(this.cargoBar);

		this.move({ x, y }, 0, orientation);

		scene.cameras.main.startFollow(this);
	}

	showStatusBars(show = true) {
		this.nameTag.visible = false;

		this.healthBarIcon.visible = show;
		this.healthBarFrame.visible = show;
		this.healthBar.visible = show;
		this.fuelBarIcon.visible = show;
		this.fuelBarFrame.visible = show;
		this.fuelBar.visible = show;
		this.cargoBarIcon.visible = show;
		this.cargoBarFrame.visible = show;
		this.cargoBar.visible = show;
	}

	updateStatusBars({ position, speed = 0 } = {}) {
		const player = gameContext.players.currentPlayer;

		if (player) {
			this.healthBar.width = convertRange(player.health, [0, player.maxHealth], [1, 100]);
			this.fuelBar.width = convertRange(player.fuel, [0, player.maxFuel], [1, 100]);
			this.cargoBar.width = convertRange(player.cargo, [0, player.maxCargo], [1, 100]);

			const engineConfig = engines[player.configuration.engine];

			this.fuelBarIcon.setTexture('icons', iconIndex[engineConfig.fuelType]);
			this.fuelBarIcon.setScale(engineConfig.fuelType === 'oil' ? 0.8 : 1);
			this.fuelBar.fillColor = fuelColors[engineConfig.fuelType];
		}

		this.showStatusBars(!!player);

		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			if (this.healthBar.visible) {
				this.scene.tweens.add({ targets: this.healthBar, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarFrame, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarIcon, duration: speed, x: x - 70, y: y - 40 });
			} else {
				this.healthBarIcon.x = x - 70;
				this.healthBarIcon.y = y - 40;

				this.healthBar.x = x;
				this.healthBar.y = y - 40;

				this.healthBarFrame.x = x;
				this.healthBarFrame.y = y - 40;
			}

			if (this.fuelBar.visible) {
				this.scene.tweens.add({ targets: this.fuelBar, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarFrame, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarIcon, duration: speed, x: x + 60, y: y - 50 });
			} else {
				this.fuelBarIcon.x = x + 60;
				this.fuelBarIcon.y = y - 50;

				this.fuelBar.x = x;
				this.fuelBar.y = y - 50;

				this.fuelBarFrame.x = x;
				this.fuelBarFrame.y = y - 50;
			}

			if (this.cargoBar.visible) {
				this.scene.tweens.add({ targets: this.cargoBar, duration: speed, x, y: y - 60 });
				this.scene.tweens.add({ targets: this.cargoBarFrame, duration: speed, x, y: y - 60 });
				this.scene.tweens.add({ targets: this.cargoBarIcon, duration: speed, x: x - 70, y: y - 60 });
			} else {
				this.cargoBarIcon.x = x - 70;
				this.cargoBarIcon.y = y - 60;

				this.cargoBar.x = x;
				this.cargoBar.y = y - 60;

				this.cargoBarFrame.x = x;
				this.cargoBarFrame.y = y - 60;
			}
		}
	}

	findNearbyPlayers(range = 1) {
		if (!this.currentGridPosition) return [];

		const nearbyPlayers = [];
		const currentPlayer = gameContext.players.currentPlayer;

		if (!currentPlayer) return [];

		// Check all other players
		gameContext.players.forEach((player, playerId) => {
			// Skip self
			if (playerId === currentPlayer.id) return;

			// Calculate Manhattan distance
			const distance =
				Math.abs(player.position.x - this.currentGridPosition.x) +
				Math.abs(player.position.y - this.currentGridPosition.y);

			if (distance <= range) {
				nearbyPlayers.push(player);
			}
		});

		return nearbyPlayers;
	}

	checkForNearbyPlayers() {
		const nearbyPlayers = this.findNearbyPlayers(1);
		const hasNearbyPlayers = nearbyPlayers.length > 0;

		// Show or hide trade prompt based on nearby players
		if (hasNearbyPlayers && !this.tradePromptVisible) {
			this.showTradePrompt(nearbyPlayers[0]);
		} else if (!hasNearbyPlayers && this.tradePromptVisible) {
			this.hideTradePrompt();
		}

		// Update cached nearby players
		this.nearbyPlayersLastCheck = nearbyPlayers;
	}

	showTradePrompt(targetPlayer) {
		if (this.tradePromptVisible || !targetPlayer) return;

		// Clean up any existing trade button
		this.hideTradePrompt();

		this.tradeButton = this.scene.add.text(0, 0, '[trade]', {
			fontSize: '14px',
			fill: '#ffffff',
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			padding: { x: 6, y: 3 },
		});

		this.tradeButton.preFX.addShadow(0, 0, 0.06, 0.75, 0x00aaff, 4, 0.8);
		this.tradeButton.setInteractive({ cursor: 'pointer' });

		this.tradeButton.on('pointerover', () => {
			if (gameContext.cursor) gameContext.cursor.visible = false;
			this.tradeButton.setTint(0x00aaff);
		});

		this.tradeButton.on('pointerout', () => {
			this.tradeButton.setTint(0xffffff);
		});

		this.tradeButton.on('pointerdown', () => {
			if (!gameContext.openDialog?.elem?.open) {
				gameContext.openDialog = new TradeDialog({
					targetPlayer: targetPlayer,
				});
			}
		});

		this.updateTradePromptPosition();
		this.tradePromptVisible = true;
		gameContext.sceneLayers.interfaces.add(this.tradeButton);

		// Play notification sound
		gameContext.sounds.blip?.play({ volume: gameContext.volume.interfaces });
	}

	hideTradePrompt() {
		if (this.tradeButton) {
			this.tradeButton.destroy();
			this.tradeButton = null;
		}
		this.tradePromptVisible = false;
	}

	updateTradePromptPosition() {
		if (this.tradeButton && this.currentGridPosition) {
			const { x, y } = gridToPxPosition(this.currentGridPosition);
			this.tradeButton.x = x - 22;
			this.tradeButton.y = y - 80; // Position above status bars
		}
	}

	move(position, speed, orientation) {
		super.move(position, speed, orientation);

		this.updateStatusBars({ position, speed });

		gameContext.spaceco.checkForNearbyPlayer();

		// Update current grid position for trade checking
		this.currentGridPosition = { x: position.x, y: position.y };

		// Update trade prompt position
		if (this.tradePromptVisible) {
			this.updateTradePromptPosition();
		}

		// Check for nearby players for trading after a short delay
		setTimeout(() => {
			this.checkForNearbyPlayers();
			this.checkForNearbyItems();
		}, 200);
	}

	teleport(position, speed) {
		super.teleport(position, speed);

		this.updateStatusBars({ position, speed });

		// Update position and check for trades after teleport
		this.currentGridPosition = { x: position.x, y: position.y };
		setTimeout(() => {
			this.checkForNearbyPlayers();
			this.checkForNearbyItems();
		}, speed + 100);
	}

	fall(position, speed) {
		super.fall(position, speed);

		this.showStatusBars(false);
		this.hideTradePrompt(); // Hide trade prompt when falling
		this.hideItemPrompts(); // Hide item prompts when falling
	}

	checkForNearbyItems() {
		const player = gameContext.players.currentPlayer;
		if (!player) return;

		// Hide existing item prompts first
		this.hideItemPrompts();

		// Check for nearby placed items (bombs, teleport stations)
		const nearbyPositions = getSurroundingRadius(player.position, 1);

		for (const position of nearbyPositions) {
			const cell = gameContext.serverState.world.grid[position.x]?.[position.y];
			if (!cell || !cell.items) continue;

			for (const item of cell.items) {
				if (item.name === 'remote_charge') {
					this.showBombPrompt(position);
				} else if (item.name === 'teleport_station') {
					this.showTeleportPrompt(position);
				}
			}
		}
	}

	showBombPrompt(position) {
		const player = gameContext.players.currentPlayer;
		const detonatorKey = `detonator_${position.x}_${position.y}`;

		// Only show prompt if player has the detonator and we don't already have a button
		if (player.items[detonatorKey] > 0 && !this.bombButton) {
			const pixelPos = gridToPxPosition(position);

			this.bombButton = this.scene.add.text(pixelPos.x - 33, pixelPos.y - 80, '[detonate]');
			this.bombButton.preFX.addShadow(0, 0, 0.06, 0.75, 0xff4444, 4, 0.8);
			this.bombButton.setInteractive({ cursor: 'pointer' });

			this.bombButton.on('pointerover', () => {
				gameContext.cursor.visible = false;
				this.bombButton.setTint(0xff4444);
			});
			this.bombButton.on('pointerout', () => {
				this.bombButton.setTint(0xffffff);
			});
			this.bombButton.on('pointerdown', () => {
				useItem({ item: detonatorKey });
				this.hideItemPrompts();
			});

			gameContext.sounds.alert.play({ volume: gameContext.volume.alerts });
		}
	}

	showTeleportPrompt(position) {
		const player = gameContext.players.currentPlayer;
		const teleporterKey = `activated_teleporter_${position.x}_${position.y}`;

		// Only show prompt if player has the teleporter remote and we don't already have a button
		if (player.items[teleporterKey] > 0 && !this.teleportButton) {
			const pixelPos = gridToPxPosition(position);

			this.teleportButton = this.scene.add.text(pixelPos.x - 33, pixelPos.y - 80, '[teleport]');
			this.teleportButton.preFX.addShadow(0, 0, 0.06, 0.75, 0x44ff44, 4, 0.8);
			this.teleportButton.setInteractive({ cursor: 'pointer' });

			this.teleportButton.on('pointerover', () => {
				gameContext.cursor.visible = false;
				this.teleportButton.setTint(0x44ff44);
			});
			this.teleportButton.on('pointerout', () => {
				this.teleportButton.setTint(0xffffff);
			});
			this.teleportButton.on('pointerdown', () => {
				useItem({ item: teleporterKey });
				this.hideItemPrompts();
			});

			gameContext.sounds.alert.play({ volume: gameContext.volume.alerts });
		}
	}

	hideItemPrompts() {
		if (this.bombButton) {
			this.bombButton.destroy();
			this.bombButton = null;
		}
		if (this.teleportButton) {
			this.teleportButton.destroy();
			this.teleportButton = null;
		}
	}

	destroy() {
		// Clean up trade-related objects
		this.hideTradePrompt();
		this.hideItemPrompts();
		super.destroy();
	}
}
