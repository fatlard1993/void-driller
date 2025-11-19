import Phaser from 'phaser';

import gameContext from '../shared/gameContext';
import { Ground, Item, Spaceco, Drill, Lava, Gas } from '../Play/GameObjects';
import { createAlien } from '../Play/GameObjects/aliens';
import { vehicles, drills } from '../../constants';
import Notify from '../shared/Notify';
import QRCode from '../shared/QRCode';

export default class WatchScene extends Phaser.Scene {
	constructor() {
		super({ key: 'WatchScene' });
		this.playerLabels = new Map(); // Store player name labels
	}

	preload() {
		// Load essential spritesheets
		this.load.spritesheet('drills', 'img/drills.png', { frameWidth: 30, frameHeight: 56 });
		this.load.spritesheet('spaceco', 'img/spaceco.png', { frameWidth: 192, frameHeight: 192 });
		this.load.spritesheet('engines', 'img/engines.png', { frameWidth: 128, frameHeight: 128 });
		this.load.spritesheet('vehicles', 'img/vehicles.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('items', 'img/items.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('aliens', 'img/aliens.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('fogs', 'img/fogs.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('ground', 'img/ground.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('lava', 'img/lava.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('crack', 'img/crack.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('explosion', 'img/explosion.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('teleport', 'img/teleport.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('minerals', 'img/minerals.png', { frameWidth: 32, frameHeight: 32 });
		this.load.image('transport', 'img/transport.png');
	}

	create() {
		console.log('[WatchScene] Create called');
		console.log('[WatchScene] gameContext.serverState:', gameContext.serverState);

		// Create layers for rendering organization
		gameContext.sceneLayers = {
			ground: this.add.layer(),
			effects: this.add.layer(),
			hazards: this.add.layer(),
			items: this.add.layer(),
			players: this.add.layer(),
			interfaces: this.add.layer(),
		};

		// Access world data from serverState.world
		const { world } = gameContext.serverState;
		const { grid, width, depth, spaceco } = world;

		console.log('[WatchScene] World dimensions:', { width, depth });
		console.log('[WatchScene] Grid exists:', !!grid);

		// Calculate zoom to fit entire map
		const mapWidth = width * 64;
		const mapHeight = depth * 64;
		const scaleX = this.cameras.main.width / mapWidth;
		const scaleY = this.cameras.main.height / mapHeight;
		const zoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding

		// Set camera to show full map
		this.cameras.main.setZoom(zoom);
		this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);

		// Build the world grid (matching GameScene.js pattern)
		grid.forEach((layer, x) => {
			layer.forEach((gridConfig = { ground: {}, items: [], hazards: [] }, y) => {
				// Render ground
				if (gridConfig.ground?.type) {
					try {
						const ground = new Ground(this, x, y, gridConfig.ground.type);
						gameContext.sceneLayers.ground.add(ground);
						grid[x][y].ground.sprite = ground;
					} catch (error) {
						console.error(`[WatchScene] Error creating ground at (${x},${y}):`, error);
					}
				}

				// Render hazards (lava, gas, aliens)
				if (gridConfig.hazards?.length) {
					gridConfig.hazards.forEach((hazard, z) => {
						if (!hazard?.type) return;

						let sprite;

						if (hazard.type === 'lava') {
							sprite = new Lava(this, x, y, 'full');
						} else if (hazard.type === 'gas') {
							sprite = new Gas(this, x, y, 'full');
						} else if (hazard.type === 'alien') {
							sprite = createAlien(this, x, y, hazard.name, hazard.orientation || 'right');
						}

						if (sprite) {
							grid[x][y].hazards[z].sprite = sprite;
							gameContext.sceneLayers.hazards.add(sprite);
						}
					});
				}

				// Render items
				if (gridConfig.items?.length) {
					gridConfig.items.forEach((item, z) => {
						if (!item?.name) return;

						// Skip mineral items - they use a different sprite class (Mineral) not Item
						if (item.name.startsWith('mineral_')) return;

						try {
							const sprite = new Item(this, x, y, item.name);

							if (sprite) {
								grid[x][y].items[z].sprite = sprite;
								gameContext.sceneLayers.items.add(sprite);
							}
						} catch (error) {
							console.warn(`[WatchScene] Error creating item "${item.name}" at (${x},${y}):`, error.message);
						}
					});
				}
			});
		});

		// Render SpaceCo
		if (spaceco) {
			const spacecoSprite = new Spaceco(
				this,
				spaceco.position.x,
				spaceco.position.y,
				spaceco.variant
			);
			gameContext.sceneLayers.hazards.add(spacecoSprite);
			spaceco.sprite = spacecoSprite;
		}

		// Render all players
		gameContext.players = new Map();
		gameContext.serverState.players.forEach((player) => {
			this.addPlayer(player);
		});

		// Setup UI overlay for alerts
		this.setupAlertOverlay();

		// Start periodic transport ship fly-by with join QR code
		this.startTransportFlyBy();
	}

	addPlayer(player) {
		const drill = new Drill(
			this,
			player.position.x,
			player.position.y,
			player.orientation,
			vehicles[player.configuration.vehicle].spriteIndex,
			drills[player.configuration.drill].spriteIndex,
			player.name
		);

		gameContext.sceneLayers.players.add(drill);
		gameContext.players.set(player.id, { ...player, sprite: drill });
		player.sprite = drill;

		// Add player name label
		this.addPlayerLabel(player);
	}

	addPlayerLabel(player) {
		const x = player.position.x * 64 + 32;
		const y = player.position.y * 64 + 32;

		// Create text label with player name
		const label = this.add.text(x, y - 50, player.name, {
			fontSize: '16px',
			fontFamily: 'Arial',
			color: '#ffffff',
			backgroundColor: '#000000',
			padding: { x: 6, y: 4 },
			stroke: '#000000',
			strokeThickness: 2,
		});
		label.setOrigin(0.5, 1);
		label.setDepth(1000);

		gameContext.sceneLayers.interfaces.add(label);
		this.playerLabels.set(player.id, label);
	}

	updatePlayerLabel(playerId, position) {
		const label = this.playerLabels.get(playerId);
		if (label) {
			label.setPosition(position.x * 64 + 32, position.y * 64 + 32 - 50);
		}
	}

	// Calculate position around player drill in a circle
	getNotificationPositionAroundPlayer(playerId) {
		const playerData = gameContext.players.get(playerId);
		if (!playerData?.sprite) return null;

		const sprite = playerData.sprite;

		// Get sprite world position
		const worldX = sprite.x;
		const worldY = sprite.y;

		// Convert world position to screen position using camera
		const camera = this.cameras.main;
		const screenX = (worldX - camera.scrollX) * camera.zoom + camera.width / 2;
		const screenY = (worldY - camera.scrollY) * camera.zoom + camera.height / 2;

		// Random angle around the player (in radians)
		const angle = Math.random() * Math.PI * 2;

		// Distance from player (adjusted for zoom level)
		const distance = 150 / camera.zoom;

		// Calculate final position
		const x = screenX + Math.cos(angle) * distance;
		const y = screenY + Math.sin(angle) * distance;

		return { x, y };
	}

	showAchievementNotification(playerId, achievement) {
		const player = gameContext.serverState.players.find((p) => p.id === playerId);
		if (!player) return;

		const position = this.getNotificationPositionAroundPlayer(playerId);

		// Use shared Notify component positioned around the player
		new Notify({
			type: 'success',
			content: `🏆 ${player.name}\n${achievement.name}`,
			timeout: 5000,
			...(position && { x: position.x, y: position.y }),
		});
	}

	setupAlertOverlay() {
		// No longer needed - using shared Notify component
	}

	showAlert(message, type = 'info', playerId = null) {
		const position = playerId ? this.getNotificationPositionAroundPlayer(playerId) : null;

		// Use shared Notify component
		new Notify({
			type: type,
			content: message,
			timeout: 3000,
			...(position && { x: position.x, y: position.y }),
		});
	}

	startWorldTransition(newWorldState) {
		console.log('[WatchScene] Starting world transition:', newWorldState);

		// Create transport ship sprite using screen coordinates (bigger for Watch mode)
		const screenWidth = this.cameras.main.width;
		const screenHeight = this.cameras.main.height;
		const ship = this.add.image(-400, screenHeight / 2, 'transport');
		ship.setDepth(10000);
		ship.setScale(1.5); // Much bigger ship for Watch mode visibility
		ship.setAlpha(0);
		ship.setScrollFactor(0);

		// Fade in the ship (matching Play mode: 1000ms)
		this.tweens.add({
			targets: ship,
			alpha: 1,
			duration: 1000,
			ease: 'Power2',
		});

		// Animate ship flying across screen (matching Play mode: 3s delay + 17s duration)
		this.tweens.add({
			targets: ship,
			x: screenWidth + 400,
			delay: 3000,
			duration: 17000,
			ease: 'Sine.easeInOut',
			onComplete: () => {
				clearInterval(bobInterval);
				ship.destroy();
			},
		});

		// Add sine wave bobbing motion (matching Play mode)
		let time = 0;
		const bobInterval = setInterval(() => {
			if (!ship || !ship.active) {
				clearInterval(bobInterval);
				return;
			}
			time += 0.03;
			const baseY = screenHeight / 2;
			ship.y = baseY + Math.sin(time) * 40;
		}, 16);

		// Fade out current world (matching Play mode: 1000ms delay + 2800ms duration)
		const fadeDelay = 1000;
		const fadeDuration = 2800;

		Object.values(gameContext.sceneLayers).forEach((layer) => {
			this.tweens.add({
				targets: layer,
				alpha: 0,
				delay: fadeDelay,
				duration: fadeDuration,
				ease: 'Power2',
			});
		});

		// Rebuild the world after fade completes (matching Play mode timing)
		setTimeout(() => {
			this.rebuildWorld(newWorldState);
		}, fadeDelay + fadeDuration);
	}

	rebuildWorld(newWorldState) {
		console.log('[WatchScene] Rebuilding world with new state:', newWorldState);
		console.log('[WatchScene] newWorldState keys:', Object.keys(newWorldState));

		// Update server state - newWorldState might be the full state or just the world
		// Check if it has a 'world' property or if it IS the world
		if (newWorldState.world) {
			// Full game state
			gameContext.serverState = newWorldState;
		} else if (newWorldState.grid) {
			// Just the world data - wrap it
			gameContext.serverState.world = newWorldState;
		} else {
			console.error('[WatchScene] Invalid newWorldState structure:', newWorldState);
			return;
		}

		// Clear existing layers
		Object.values(gameContext.sceneLayers).forEach((layer) => {
			layer.removeAll(true);
		});

		// Clear player labels
		this.playerLabels.forEach((label) => label.destroy());
		this.playerLabels.clear();

		// Clear players
		gameContext.players.clear();

		// Rebuild the world (same logic as create())
		const { world } = gameContext.serverState;

		if (!world) {
			console.error('[WatchScene] No world data after processing newWorldState');
			return;
		}

		const { grid, width, depth, spaceco } = world;

		// Recalculate zoom for new map size
		const mapWidth = width * 64;
		const mapHeight = depth * 64;
		const scaleX = this.cameras.main.width / mapWidth;
		const scaleY = this.cameras.main.height / mapHeight;
		const zoom = Math.min(scaleX, scaleY) * 0.9;

		this.cameras.main.setZoom(zoom);
		this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);

		// Build the world grid
		grid.forEach((layer, x) => {
			layer.forEach((gridConfig = { ground: {}, items: [], hazards: [] }, y) => {
				if (gridConfig.ground?.type) {
					try {
						const ground = new Ground(this, x, y, gridConfig.ground.type);
						gameContext.sceneLayers.ground.add(ground);
						grid[x][y].ground.sprite = ground;
					} catch (error) {
						console.error(`[WatchScene] Error creating ground at (${x},${y}):`, error);
					}
				}

				if (gridConfig.hazards?.length) {
					gridConfig.hazards.forEach((hazard, z) => {
						if (!hazard?.type) return;

						let sprite;
						if (hazard.type === 'lava') {
							sprite = new Lava(this, x, y, 'full');
						} else if (hazard.type === 'gas') {
							sprite = new Gas(this, x, y, 'full');
						} else if (hazard.type === 'alien') {
							sprite = createAlien(this, x, y, hazard.name, hazard.orientation || 'right');
						}

						if (sprite) {
							grid[x][y].hazards[z].sprite = sprite;
							gameContext.sceneLayers.hazards.add(sprite);
						}
					});
				}

				if (gridConfig.items?.length) {
					gridConfig.items.forEach((item, z) => {
						if (!item?.name) return;
						if (item.name.startsWith('mineral_')) return;

						try {
							const sprite = new Item(this, x, y, item.name);
							if (sprite) {
								grid[x][y].items[z].sprite = sprite;
								gameContext.sceneLayers.items.add(sprite);
							}
						} catch (error) {
							console.warn(`[WatchScene] Error creating item "${item.name}" at (${x},${y}):`, error.message);
						}
					});
				}
			});
		});

		// Render SpaceCo
		if (spaceco) {
			const spacecoSprite = new Spaceco(this, spaceco.position.x, spaceco.position.y, spaceco.variant);
			gameContext.sceneLayers.hazards.add(spacecoSprite);
			spaceco.sprite = spacecoSprite;
		}

		// Render all players
		gameContext.serverState.players.forEach((player) => {
			this.addPlayer(player);
		});

		// Set layers to alpha 0 initially
		Object.values(gameContext.sceneLayers).forEach((layer) => {
			layer.alpha = 0;
		});
	}

	fadeInWorld() {
		console.log('[WatchScene] Fading in new world');

		// Fade in all scene layers
		const fadeInDuration = 1200;
		Object.values(gameContext.sceneLayers).forEach((layer) => {
			this.tweens.add({
				targets: layer,
				alpha: 1,
				duration: fadeInDuration,
				ease: 'Power2',
			});
		});
	}

	startTransportFlyBy() {
		// Run fly-by immediately, then once per minute
		this.runTransportFlyBy();

		this.flyByTimer = this.time.addEvent({
			delay: 60000, // 60 seconds
			callback: () => this.runTransportFlyBy(),
			loop: true,
		});
	}

	runTransportFlyBy() {
		const screenWidth = this.cameras.main.width;
		const screenHeight = this.cameras.main.height;

		// QR code dimensions (just the code, no text)
		const qrSize = 200;
		const qrCenterY = screenHeight / 2; // Move to middle of screen instead of top third
		const qrTopY = qrCenterY - (qrSize / 2);

		// Ship positioned directly above QR code - make it bigger!
		const shipScale = 1.5;
		const shipWidth = 256 * shipScale;
		const shipHeight = 256 * shipScale;
		// Position ship so its bottom edge overlaps QR top edge (no visible gap)
		const shipBaseY = qrTopY - shipHeight + 120; // +80px overlap to eliminate gap

		// Create transport ship as DOM element (not Phaser) for perfect sync
		const shipWrapper = document.createElement('div');
		shipWrapper.style.cssText = `
			position: fixed;
			left: -300px;
			top: ${shipBaseY}px;
			width: ${shipWidth}px;
			height: ${shipHeight}px;
			z-index: 10000;
			opacity: 1;
		`;

		const shipImg = document.createElement('img');
		shipImg.src = 'img/transport.png';
		shipImg.style.cssText = `
			width: 100%;
			height: 100%;
			object-fit: contain;
		`;

		shipWrapper.appendChild(shipImg);
		document.body.appendChild(shipWrapper);

		// Create DOM-based QR code container
		const joinUrl = `${window.location.origin}#/join/${gameContext.gameId}`;

		const qrWrapper = document.createElement('div');
		qrWrapper.style.cssText = `
			position: fixed;
			left: -300px;
			top: ${qrTopY}px;
			width: ${qrSize + 20}px;
			height: ${qrSize + 20}px;
			background: white;
			border: 4px solid #000;
			border-radius: 12px;
			padding: 10px;
			box-sizing: border-box;
			z-index: 10001;
			opacity: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		`;

		const qrCode = new QRCode({
			src: joinUrl,
			qrCodeConfig: {
				width: qrSize,
				margin: 0,
			},
		});

		qrWrapper.appendChild(qrCode.elem);
		document.body.appendChild(qrWrapper);

		// Trigger QR code rendering
		qrCode.render();

		// Fade in QR code
		setTimeout(() => {
			qrWrapper.style.opacity = '1';
		}, 100);

		// Animate both ship and QR code across screen
		const startTime = Date.now();
		const duration = 15000;
		const startX = -300;
		const endX = screenWidth + 300;

		console.log('[FlyBy] Starting animation:', { screenWidth, screenHeight, startX, endX, shipBaseY, qrTopY });

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Linear movement from left to right (DOM pixel coordinates)
			const currentX = startX + (endX - startX) * progress;

			// Sin wave for noticeable vertical bobbing (amplitude: 50px, 2 full cycles across screen)
			const sinWaveOffset = Math.sin(progress * Math.PI * 2 * 2) * 50;

			// Move both DOM elements together with sin wave
			// QR code offset to the right of ship center
			const qrOffsetX = 50; // Move QR 100px to the right

			shipWrapper.style.left = `${currentX}px`;
			shipWrapper.style.top = `${shipBaseY + sinWaveOffset}px`;
			qrWrapper.style.left = `${currentX + qrOffsetX}px`;
			qrWrapper.style.top = `${qrTopY + sinWaveOffset}px`;

			// Fade out near the end
			if (progress > 0.93) {
				const fadeProgress = (progress - 0.93) / 0.07;
				shipWrapper.style.opacity = `${1 - fadeProgress}`;
				qrWrapper.style.opacity = `${1 - fadeProgress}`;
			}

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				shipWrapper.remove();
				qrWrapper.remove();
			}
		};

		requestAnimationFrame(animate);
	}

	update() {
		// Update loop for any animations or dynamic updates
	}
}
