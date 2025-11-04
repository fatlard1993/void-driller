// ./client/Play/GameObjects/Player.js
import { convertRange, theme } from 'vanilla-bean-components';
import Phaser from 'phaser';

import { gridToPxPosition, getSurroundingRadius } from '../../../utils';
import gameContext from '../../shared/gameContext';
import TradeDialog from '../TradeDialog';
import { disarmBomb, deactivateTeleporter, initiateTrade } from '../../api';
import Notify from '../../shared/Notify';
import { Drill } from './Drill';

export class Player extends Drill {
	constructor(scene, x, y, orientation, vehicle, drill, name) {
		super(scene, x, y, orientation, vehicle, drill, name);

		this.healthBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.healthBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);

		this.showStatusBars(false);
		this.updateStatusBars({ position: { x, y } });

		this.tradePromptVisible = false;
		this.tradeButton = null;
		this.nearbyPlayersLastCheck = [];

		gameContext.sceneLayers.interfaces.add(this.healthBarFrame);
		gameContext.sceneLayers.interfaces.add(this.healthBar);

		this.move({ x, y }, 0, orientation);

		scene.cameras.main.startFollow(this);
	}

	showStatusBars(show = true) {
		if (this.nameTag) this.nameTag.visible = false;
		if (this.nameTagShadow) this.nameTagShadow.visible = false;

		this.healthBarFrame.visible = show;
		this.healthBar.visible = show;
	}

	updateStatusBars({ position, speed = 0 } = {}) {
		const player = gameContext.players.currentPlayer;

		if (player) {
			this.healthBar.width = convertRange(player.health, [0, player.maxHealth], [1, 100]);
		}

		this.showStatusBars(!!player);

		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			if (this.healthBar.visible) {
				this.scene.tweens.add({ targets: this.healthBar, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarFrame, duration: speed, x: x, y: y - 40 });
			} else {
				this.healthBar.x = x;
				this.healthBar.y = y - 40;

				this.healthBarFrame.x = x;
				this.healthBarFrame.y = y - 40;
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

		// Check if there's a pending trade invitation with a nearby player
		const pendingTrade = gameContext.pendingTradeInvitation;
		const hasPendingTradeWithNearby = nearbyPlayers.some(
			player => pendingTrade && (pendingTrade.player1Id === player.id || pendingTrade.player2Id === player.id),
		);

		// Show or hide trade prompt based on nearby players OR pending trade
		if ((hasNearbyPlayers || hasPendingTradeWithNearby) && !this.tradePromptVisible) {
			this.showTradePrompt(nearbyPlayers[0]);
		} else if (!hasNearbyPlayers && !hasPendingTradeWithNearby && this.tradePromptVisible) {
			this.hideTradePrompt();
		}

		// Update cached nearby players
		this.nearbyPlayersLastCheck = nearbyPlayers;
	}

	showTradePrompt(targetPlayer) {
		if (this.tradePromptVisible || !targetPlayer) return;

		// Clean up any existing trade button
		this.hideTradePrompt();

		this.tradeButton = this.scene.add.text(0, 0, 'Trade', {
			fontSize: '12px',
			fontFamily: 'monospace',
			fill: '#ffffff',
			backgroundColor: 'hsl(209, 55%, 45%)',
			padding: { x: 8, y: 4 },
		});

		this.tradeButton.setInteractive({ cursor: 'pointer' });

		this.tradeButton.on('pointerover', () => {
			if (gameContext.cursor) gameContext.cursor.visible = false;
			// Simulate button hover effect with slight position shift
			this.tradeButton.y = this.tradeButton.y - 1;
		});

		this.tradeButton.on('pointerout', () => {
			// Reset button position
			this.tradeButton.y = this.tradeButton.y + 1;
		});

		this.tradeButton.on('pointerdown', async () => {
			if (!gameContext.openDialog?.elem?.open) {
				// Check if there's a pending trade invitation with this player
				const pendingTrade = gameContext.pendingTradeInvitation;
				if (
					pendingTrade &&
					(pendingTrade.player1Id === targetPlayer.id || pendingTrade.player2Id === targetPlayer.id)
				) {
					// Join the existing trade session
					gameContext.openDialog = new TradeDialog({
						otherPlayer: targetPlayer,
						tradeSession: pendingTrade,
					});

					// Clear the pending invitation
					gameContext.pendingTradeInvitation = null;
				} else {
					// Start a new trade session
					try {
						const result = await initiateTrade({ targetPlayerId: targetPlayer.id });
						// Dialog will open automatically via socket event for initiator
						console.log('Trade initiated:', result);
					} catch (error) {
						console.error('Trade initiation error:', error);
						// If error is "already have active trade", try to cancel and retry
						if (error.message?.includes('already have an active trade')) {
							new Notify({
								type: 'warning',
								content: 'Previous trade still active. Please close it first.',
							});
						} else {
							new Notify({
								type: 'error',
								content: error.message || 'Failed to start trade',
							});
						}
					}
				}
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
		if (this.bombButton) return;

		const pixelPos = gridToPxPosition(position);

		this.bombButton = this.scene.add.text(pixelPos.x - 33, pixelPos.y - 80, 'Disarm', {
			fontSize: '12px',
			fontFamily: 'monospace',
			fill: '#ffffff',
			backgroundColor: 'hsl(209, 55%, 45%)',
			padding: { x: 8, y: 4 },
		});

		this.bombButton.setInteractive({ cursor: 'pointer' });

		this.bombButton.on('pointerover', () => {
			gameContext.cursor.visible = false;
			this.bombButton.y = this.bombButton.y - 1;
		});
		this.bombButton.on('pointerout', () => {
			this.bombButton.y = this.bombButton.y + 1;
		});
		this.bombButton.on('pointerdown', () => {
			disarmBomb({ x: position.x, y: position.y });
			this.hideItemPrompts();
		});

		gameContext.sounds.alert.play({ volume: gameContext.volume.alerts });
	}

	showTeleportPrompt(position) {
		if (this.teleportButton) return;

		const pixelPos = gridToPxPosition(position);

		this.teleportButton = this.scene.add.text(pixelPos.x - 33, pixelPos.y - 80, 'Deactivate', {
			fontSize: '12px',
			fontFamily: 'monospace',
			fill: '#ffffff',
			backgroundColor: 'hsl(209, 55%, 45%)',
			padding: { x: 8, y: 4 },
		});

		this.teleportButton.setInteractive({ cursor: 'pointer' });

		this.teleportButton.on('pointerover', () => {
			gameContext.cursor.visible = false;
			this.teleportButton.y = this.teleportButton.y - 1;
		});
		this.teleportButton.on('pointerout', () => {
			this.teleportButton.y = this.teleportButton.y + 1;
		});
		this.teleportButton.on('pointerdown', () => {
			deactivateTeleporter({ x: position.x, y: position.y });
			this.hideItemPrompts();
		});

		gameContext.sounds.alert.play({ volume: gameContext.volume.alerts });
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
