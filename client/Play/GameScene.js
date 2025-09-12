import Phaser from 'phaser';

import { rand } from '../../utils';
import gameContext from '../shared/gameContext';
import { drills, vehicles } from '../../constants';
import { gameLog, clientLog } from '../../utils/logger.js';
import { repairPlayerPosition } from '../api';
import { Ground, Item, Mineral, Spaceco, Drill, Lava, Gas, Player } from './GameObjects';
import { createAlien } from './GameObjects/aliens';
import BriefingDialog from './BriefingDialog';

const sounds = [
	'achievement',
	'achievement_close',
	'alert0',
	'alert',
	'alert2',
	'blip',
	'close',
	'coin',
	'comm_err',
	'console_open',
	'dig',
	'explode',
	'heal',
	'hurt_chomper',
	'hurt',
	'melee_attack',
	'path_select',
	'path_accept',
	'pickup',
	'powerup',
	'repair',
	'scan',
	'teleport',
	'music/chip1',
	'music/chip2',
	'music/chip3',
	'music/chip4',
	'music/chip5',
];

export default class GameScene extends Phaser.Scene {
	createLoadingUI() {
		// Create custom loading container that mimics ConsoleContainer appearance
		const gameParent = document.querySelector('.game-container') || document.body;

		// Create the main container with ConsoleContainer styling
		this.loadingContainer = document.createElement('div');
		this.loadingContainer.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			z-index: 9999;
			background: black;
			border: 3px solid #7dd3fc;
			width: clamp(90vw, 80vw, 600px);
			border-radius: 6px;
			padding: 20px;
			box-sizing: border-box;
		`;

		// Create the console text element
		const consoleText = document.createElement('pre');
		consoleText.textContent = `SPACECO MINING RIG - SYSTEM BOOT\n\nInitializing mining systems...\nLoading asset database: 0%\n\n`;
		consoleText.style.cssText = `
			font-family: 'FontWithASyntaxHighlighter', monospace;
			color: white;
			font-size: 18px;
			white-space: pre-wrap;
			margin: 0 0 16px 0;
			padding: 0;
		`;

		// Create responsive loading bar container
		const loadingBarContainer = document.createElement('div');
		loadingBarContainer.style.cssText = `
			width: 100%;
			height: 20px;
			background: rgba(255,255,255,0.1);
			border: 1px solid #7dd3fc;
			border-radius: 3px;
			overflow: hidden;
			position: relative;
		`;

		// Create the loading bar fill
		const loadingBarFill = document.createElement('div');
		loadingBarFill.style.cssText = `
			height: 100%;
			background: linear-gradient(90deg, #7dd3fc, #38bdf8);
			width: 0%;
			transition: width 0.3s ease;
			border-radius: 2px;
		`;

		// Create percentage text overlay
		const percentText = document.createElement('div');
		percentText.textContent = '0%';
		percentText.style.cssText = `
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: white;
			font-family: 'FontWithASyntaxHighlighter', monospace;
			font-size: 12px;
			font-weight: bold;
			text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
			z-index: 1;
		`;

		// Assemble the loading UI
		loadingBarContainer.appendChild(loadingBarFill);
		loadingBarContainer.appendChild(percentText);
		this.loadingContainer.appendChild(consoleText);
		this.loadingContainer.appendChild(loadingBarContainer);
		gameParent.appendChild(this.loadingContainer);

		// Store references for updates
		this.loadingConsoleText = consoleText;
		this.loadingBarFill = loadingBarFill;
		this.loadingPercentText = percentText;

		this.loadingStatus = 'Loading asset database: 0%';
	}

	updateLoadingProgress(percent, status = '') {
		if (this.loadingConsoleText && this.loadingBarFill && this.loadingPercentText) {
			const statusText = status || `Loading asset database: ${percent}%`;

			// Update console text
			this.loadingConsoleText.textContent = `SPACECO MINING RIG - SYSTEM BOOT\n\nInitializing mining systems...\n${statusText}\n`;

			// Update visual loading bar
			this.loadingBarFill.style.width = `${percent}%`;
			this.loadingPercentText.textContent = `${percent}%`;
		}
	}

	hideLoadingUI() {
		if (this.loadingContainer) {
			this.loadingContainer.remove();
			this.loadingContainer = null;
			this.loadingConsoleText = null;
			this.loadingBarFill = null;
			this.loadingPercentText = null;
		}
	}

	getAssetConfig(key) {
		// Asset configuration lookup for retries and conversions
		const configs = {
			drills: { url: 'img/drills.png', config: { frameWidth: 30, frameHeight: 56 } },
			spaceco: { url: 'img/spaceco.png', config: { frameWidth: 192, frameHeight: 192 } },
			engines: { url: 'img/engines.png', config: { frameWidth: 128, frameHeight: 128 } },
			explosion: { url: 'img/explosion.png', config: { frameWidth: 64, frameHeight: 64 } },
			vehicles: { url: 'img/vehicles.png', config: { frameWidth: 64, frameHeight: 64 } },
			teleport: { url: 'img/teleport.png', config: { frameWidth: 64, frameHeight: 64 } },
			items: { url: 'img/items.png', config: { frameWidth: 64, frameHeight: 64 } },
			aliens: { url: 'img/aliens.png', config: { frameWidth: 64, frameHeight: 64 } },
			fogs: { url: 'img/fogs.png', config: { frameWidth: 64, frameHeight: 64 } },
			ground: { url: 'img/ground.png', config: { frameWidth: 64, frameHeight: 64 } },
			lava: { url: 'img/lava.png', config: { frameWidth: 64, frameHeight: 64 } },
			crack: { url: 'img/crack.png', config: { frameWidth: 64, frameHeight: 64 } },
			icons: { url: 'img/icons.png', config: { frameWidth: 32, frameHeight: 32 } },
			minerals: { url: 'img/minerals.png', config: { frameWidth: 32, frameHeight: 32 } },
		};
		return key ? configs[key] : configs;
	}

	preload() {
		setTimeout(() => {
			if (window.debugLog) window.debugLog('Preload started');
		}, 50);

		// Create loading UI for all devices
		this.createLoadingUI();

		// Add load progress tracking
		this.load.on('progress', value => {
			const percent = Math.round(value * 100);
			this.updateLoadingProgress(percent);
			setTimeout(() => {
				if (window.debugLog) window.debugLog('Loading: ' + percent + '%');
			}, 50);
		});

		this.load.on('loaderror', file => {
			setTimeout(() => {
				if (window.debugLog) {
					window.debugLog('ERROR loading: ' + file.key);
					window.debugLog('File src: ' + file.src);
					window.debugLog('File type: ' + file.type);
				}
			}, 50);

			// Retry any failed asset - everything is critical for mobile experience
			if (file.type === 'spritesheet') {
				setTimeout(() => {
					if (window.debugLog) window.debugLog('Retrying: ' + file.key);

					// Re-add the same asset with _retry suffix
					const assetConfig = this.getAssetConfig(file.key);
					if (assetConfig) {
						this.load.spritesheet(file.key + '_retry', assetConfig.url, assetConfig.config);
						this.load.start();
					}
				}, 2000); // Longer delay for mobile
			}
		});

		// Continue loading even if some files fail
		this.load.on('filecomplete', key => {
			setTimeout(() => {
				if (window.debugLog) window.debugLog('Loaded: ' + key);
			}, 50);
		});

		this.load.on('complete', () => {
			this.updateLoadingProgress(100, 'Asset database loaded - Initializing world...');

			setTimeout(() => {
				if (window.debugLog) {
					window.debugLog('Assets loaded');

					// Check if critical assets actually loaded
					const criticalAssets = ['items', 'vehicles', 'drills', 'spaceco'];
					criticalAssets.forEach(asset => {
						const exists = this.textures.exists(asset);
						window.debugLog(`${asset}: ${exists ? 'OK' : 'MISSING'}`);
						if (!exists && this.textures.exists(`${asset}_retry`)) {
							window.debugLog(`Using ${asset}_retry instead`);
							// Create alias from retry version
							const retryTexture = this.textures.get(`${asset}_retry`);
							this.textures.addSpriteSheet(asset, retryTexture.source[0].image, {
								frameWidth: 64,
								frameHeight: 64,
							});
						}
					});
				}
			}, 50);
		});
		// Try a different approach for mobile - load as images first
		try {
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

			if (window.debugLog) {
				window.debugLog('Loading all assets for ' + (isMobile ? 'mobile' : 'desktop'));
				window.debugLog('Using renderer: ' + (this.game.renderer.type === 2 ? 'WebGL' : 'Canvas'));
			}

			if (isMobile) {
				// Mobile: Load as regular images first, convert to spritesheets later
				this.load.maxParallelDownloads = 1; // Very conservative for mobile
				this.load.timeout = 45000; // Longer timeout

				if (window.debugLog) window.debugLog('Mobile: Loading images first');

				// Load as images, not spritesheets
				this.load.image('drills_img', 'img/drills.png');
				this.load.image('spaceco_img', 'img/spaceco.png');
				this.load.image('engines_img', 'img/engines.png');
				this.load.image('explosion_img', 'img/explosion.png');
				this.load.image('vehicles_img', 'img/vehicles.png');
				this.load.image('teleport_img', 'img/teleport.png');
				this.load.image('items_img', 'img/items.png');
				this.load.image('aliens_img', 'img/aliens.png');
				this.load.image('fogs_img', 'img/fogs.png');
				this.load.image('ground_img', 'img/ground.png');
				this.load.image('lava_img', 'img/lava.png');
				this.load.image('crack_img', 'img/crack.png');
				this.load.image('icons_img', 'img/icons.png');
				this.load.image('minerals_img', 'img/minerals.png');

				// Set up callback to convert images to spritesheets after load
				this.load.on(
					'complete',
					() => {
						this.updateLoadingProgress(100, 'Converting images to spritesheets...');
						if (window.debugLog) window.debugLog('Mobile: Converting images to spritesheets');

						// Convert loaded images to spritesheets
						const configs = this.getAssetConfig();
						Object.keys(configs).forEach(key => {
							const imgKey = key + '_img';
							if (this.textures.exists(imgKey)) {
								const texture = this.textures.get(imgKey);
								this.textures.addSpriteSheet(key, texture.source[0].image, configs[key].config);
								if (window.debugLog) window.debugLog(`Created spritesheet: ${key}`);
							} else {
								if (window.debugLog) window.debugLog(`Missing image for: ${key}`);
							}
						});

						// Show final status
						setTimeout(() => {
							this.updateLoadingProgress(100, 'Spritesheet conversion complete - Starting game...');
						}, 500);
					},
					{ once: true },
				);
			} else {
				// Desktop: Normal spritesheet loading
				this.load.spritesheet('drills', 'img/drills.png', { frameWidth: 30, frameHeight: 56 });
				this.load.spritesheet('spaceco', 'img/spaceco.png', { frameWidth: 192, frameHeight: 192 });
				this.load.spritesheet('engines', 'img/engines.png', { frameWidth: 128, frameHeight: 128 });
				this.load.spritesheet('explosion', 'img/explosion.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('vehicles', 'img/vehicles.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('teleport', 'img/teleport.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('items', 'img/items.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('aliens', 'img/aliens.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('fogs', 'img/fogs.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('ground', 'img/ground.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('lava', 'img/lava.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('crack', 'img/crack.png', { frameWidth: 64, frameHeight: 64 });
				this.load.spritesheet('icons', 'img/icons.png', { frameWidth: 32, frameHeight: 32 });
				this.load.spritesheet('minerals', 'img/minerals.png', { frameWidth: 32, frameHeight: 32 });
			}

			// Load all audio for both mobile and desktop
			sounds.forEach(sound => this.load.audio(sound, `audio/${sound}.wav`));

			if (window.debugLog) window.debugLog('All assets queued');
		} catch (error) {
			if (window.debugLog) window.debugLog('Asset setup error: ' + error.message);
		}

		['ground', 'effects', 'hazards', 'items', 'players', 'interfaces'].forEach(name => {
			gameContext.sceneLayers[name] = this.add.layer();
		});

		// Camera setup with user-configurable zoom
		// Remove camera background color to show page background (stars)
		this.cameras.main.setBackgroundColor('rgba(0,0,0,0)'); // Transparent background

		// Use saved scale setting, with auto-detect fallback for first-time users
		let initialScale = gameContext.scale;

		// If no saved scale preference, auto-detect based on screen size
		if (initialScale === 1.0 && !localStorage.getItem('scale')) {
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;
			const isSmallScreen = screenWidth < 1024 || screenHeight < 768;
			initialScale = isSmallScreen ? 0.6 : 1.0;

			// Save the auto-detected scale as user preference
			gameContext.scale = initialScale;
			localStorage.setItem('scale', JSON.stringify(initialScale));
		}

		this.cameras.main.setZoom(initialScale);
		if (window.debugLog) window.debugLog(`Camera zoom set to ${initialScale}`);
	}

	create() {
		if (window.debugLog) window.debugLog('Scene create() started');

		try {
			sounds.forEach(sound => {
				gameContext.sounds[sound] = this.sound.add(sound);
			});

			gameContext.serverState.world.grid.forEach((layer, x) => {
				layer.forEach((gridConfig = { ground: {}, items: [], hazards: [] }, y) => {
					if (gridConfig.ground.type) {
						gameContext.serverState.world.grid[x][y].ground.sprite = new Ground(this, x, y, gridConfig.ground.type);
						gameContext.sceneLayers.ground.add(gameContext.serverState.world.grid[x][y].ground.sprite);
					}

					if (gridConfig.hazards.length) {
						gridConfig.hazards.forEach((hazard, z) => {
							if (!hazard?.type) return;

							let sprite;

							if (hazard.type === 'lava') {
								sprite = new Lava(this, x, y, 'full');
							} else if (hazard.type === 'gas') {
								sprite = new Gas(this, x, y, 'full');
							} else if (hazard.type === 'alien') {
								// Use the alien factory instead of the old class mapping
								sprite = createAlien(this, x, y, hazard.name, hazard.orientation || 'right');

								if (!sprite) {
									gameLog.warn(`Failed to create alien`, { alienName: hazard.name, position: { x, y } });
									return;
								}
							}

							if (sprite) {
								gameContext.serverState.world.grid[x][y].hazards[z].sprite = sprite;
								gameContext.sceneLayers.hazards.add(sprite);
							}
						});
					}

					if (gridConfig.items.length) {
						gridConfig.items.forEach((item, z) => {
							if (!item?.name) return;

							let sprite;
							const positions = [
								{ x: 1.1, y: 1.1 },
								{ x: -0.2, y: -0.2 },
								{ x: 1.1, y: -0.2 },
								{ x: -0.2, y: 1.1 },
								{ x: 0, y: 0 },
							];

							if (item.name.startsWith('mineral_')) {
								sprite = new Mineral(this, x, y, item.name.split('_')[1], {
									x: rand(positions[z].x - 0.1, positions[z].x + 0.1),
								});
							} else sprite = new Item(this, x, y, item.name);

							gameContext.serverState.world.grid[x][y].items[z].sprite = sprite;
							gameContext.sceneLayers.items.add(sprite);
						});
					}
				});
			});

			gameContext.spaceco = new Spaceco(
				this,
				gameContext.serverState.world.spaceco.position.x,
				gameContext.serverState.world.spaceco.position.y,
				gameContext.serverState.world.spaceco.variant,
			);

			gameContext.sceneLayers.hazards.add(gameContext.spaceco);

			gameContext.serverState.players.forEach(player => {
				// Validate player data before creating sprites
				if (
					!player ||
					!player.position ||
					typeof player.position.x !== 'number' ||
					typeof player.position.y !== 'number' ||
					player.position.x === null ||
					player.position.y === null ||
					!Number.isFinite(player.position.x) ||
					!Number.isFinite(player.position.y)
				) {
					clientLog.warn('Player has corrupted position data, requesting server repair', {
						id: player?.id,
						name: player?.name,
						position: player?.position,
					});

					// Request server to repair this player's position
					if (player?.id) {
						clientLog.info('Requesting position repair for player', { playerId: player.id });
						repairPlayerPosition(player.id).catch(error => {
							clientLog.error('Failed to repair player position', { error: error.message, playerId: player.id });
							// Fallback: reload the page
							setTimeout(() => {
								window.location.reload();
							}, 2000);
						});
					}
					return;
				}

				if (!player.configuration || !player.name) {
					clientLog(1)('Skipping player with incomplete configuration', {
						playerId: player?.id,
						hasConfig: !!player.configuration,
						hasName: !!player.name,
					});
					return;
				}

				if (gameContext.playerId === player.id) {
					const sprite = new Player(
						this,
						player.position.x,
						player.position.y,
						player.orientation,
						vehicles[player.configuration.vehicle].spriteIndex,
						drills[player.configuration.drill].spriteIndex,
						player.name,
					);

					gameContext.players.set(player.id, { ...player, sprite });

					sprite.move(player.position, 0, player.orientation);
				} else {
					const sprite = new Drill(
						this,
						player.position.x,
						player.position.y,
						player.orientation,
						vehicles[player.configuration.vehicle].spriteIndex,
						drills[player.configuration.drill].spriteIndex,
						player.name,
					);

					gameContext.players.set(player.id, { ...player, sprite });
				}
			});

			// Hide loading UI and show completion
			setTimeout(() => {
				this.updateLoadingProgress(100, 'Mining rig systems online - Welcome to the void!');
				setTimeout(() => {
					this.hideLoadingUI();

					// Show briefing dialog after loading completes
					setTimeout(() => {
						if (!gameContext.briefings[gameContext.serverState.world.name]) {
							gameContext.openDialog = new BriefingDialog();
						}
					}, 500);
				}, 1000);

				if (window.debugLog) {
					window.debugLog('Scene create() completed');
					window.debugLog('Camera bounds: ' + this.cameras.main.width + 'x' + this.cameras.main.height);

					// Count objects in the scene
					let groundCount = 0,
						itemCount = 0,
						hazardCount = 0;
					gameContext.serverState.world.grid.forEach(layer => {
						layer.forEach(gridConfig => {
							if (gridConfig?.ground?.type) groundCount++;
							if (gridConfig?.items?.length) itemCount += gridConfig.items.length;
							if (gridConfig?.hazards?.length) hazardCount += gridConfig.hazards.length;
						});
					});

					window.debugLog('Ground tiles: ' + groundCount);
					window.debugLog('Items: ' + itemCount);
					window.debugLog('Hazards: ' + hazardCount);
					window.debugLog('Players: ' + gameContext.players.size);
					window.debugLog('SpaceCo: ' + !!gameContext.spaceco);

					// Check layer visibility
					Object.keys(gameContext.sceneLayers).forEach(layerName => {
						const layer = gameContext.sceneLayers[layerName];
						window.debugLog(`Layer ${layerName}: visible=${layer.visible}, children=${layer.list.length}`);
					});

					// Camera debug info
					const cam = this.cameras.main;
					window.debugLog(`Camera: x=${cam.scrollX}, y=${cam.scrollY}, zoom=${cam.zoom}`);
					window.debugLog(`Camera follow: ${!!cam._follow}`);
					window.debugLog(`Camera bounds: ${cam.useBounds ? 'set' : 'none'}`);

					// Current player debug
					const currentPlayer = gameContext.players.get(gameContext.playerId);
					if (currentPlayer) {
						window.debugLog(`Player pos: ${currentPlayer.position.x},${currentPlayer.position.y}`);
						window.debugLog(`Player sprite: ${!!currentPlayer.sprite}`);
						if (currentPlayer.sprite) {
							window.debugLog(`Sprite pos: ${currentPlayer.sprite.x},${currentPlayer.sprite.y}`);
							window.debugLog(`Sprite visible: ${currentPlayer.sprite.visible}`);
						}
					}
				}
			}, 100);
		} catch (error) {
			if (window.debugLog) window.debugLog('Create error: ' + error.message);
		}
	}
}
