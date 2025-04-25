import { styled, throttle, debounce, convertRange, randInt } from 'vanilla-bean-components';
import Phaser from 'phaser';

import {
	getSurroundingRadius,
	getImmediateSurrounds,
	gridToPxPosition,
	hasFooting,
	pxToGridPosition,
} from '../../utils';
import { move as movePlayer } from '../api';
import socket, { onMessage } from '../socket';
import gameContext from './gameContext';
import GameScene from './GameScene';
import { Drill, Lava, Gas } from './GameObjects';
import ConsoleDialog from './ConsoleDialog';

export default class Game extends (styled.Component`
	background-image: url('img/background.svg');
	height: 100%;
`) {
	constructor(options = {}) {
		super({ ...options, autoRender: false });

		gameContext.game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: this.elem,
			width: window.innerWidth,
			height: window.innerHeight - 78,
			scene: GameScene,
			transparent: true,
		});

		gameContext.game.events.once('ready', () => {
			gameContext.scene = gameContext.game.scene.scenes[0];

			setTimeout(() => this.render(), 300);
		});
	}

	render() {
		super.render();

		if (!localStorage.getItem('console_defaultMenu')) new ConsoleDialog();

		const socketCleanup = onMessage(data => {
			if (data.id === gameContext.gameId) {
				if (data.update === 'playerMove') {
					let player = gameContext.players.get(data.player.id);

					if (!player?.sprite) {
						const sprite = new Drill(
							gameContext.scene,
							data.player.position.x,
							data.player.position.y,
							data.player.orientation,
						);

						gameContext.players.set(data.player.id, { ...player, ...data.player, sprite });
						gameContext.sceneLayers.players.add(sprite);
					} else gameContext.players.set(data.player.id, { ...player, ...data.player });

					player = gameContext.players.get(data.player.id);

					const gridConfig = gameContext.serverState.world.grid[player.position.x][player.position.y];

					if (gridConfig.ground.sprite?.scene) gridConfig.ground.sprite.dig();

					if (gridConfig.items.length) {
						gridConfig.items.forEach(({ sprite }) => {
							if (sprite.scene) sprite[player.id === gameContext.playerId ? 'collect' : 'destroy']();
						});
					}

					player.sprite.move(player.position, 500, player.orientation);

					gameContext.serverState.world.grid[player.position.x][player.position.y].ground = {};
					gameContext.serverState.world.grid[player.position.x][player.position.y].items = [];
				} else if (data.update === 'addPlayer') {
					const sprite = new Drill(
						gameContext.scene,
						data.newPlayer.position.x,
						data.newPlayer.position.y,
						data.newPlayer.orientation,
					);

					gameContext.players.set(data.newPlayer.id, { ...data.newPlayer, sprite });
					gameContext.sceneLayers.players.add(sprite);
				} else if (data.update === 'removePlayer') {
					const player = gameContext.players.get(data.id);

					player.sprite.destroy();

					gameContext.players.delete(data.id);
				} else if (data.update === 'dissipateGas') {
					data.addedGas.forEach(gas => {
						const sprite = new Gas(gameContext.scene, gas.x, gas.y, gas.name.split('_')[0], 'fill');

						gameContext.serverState.world.grid[gas.x][gas.y].hazards = gameContext.serverState.world.grid[gas.x][
							gas.y
						].hazards.filter(hazard => {
							if (hazard.name.endsWith('monster')) {
								gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });

								hazard.sprite.destroy();

								return false;
							} else return true;
						});

						gameContext.serverState.world.grid[gas.x][gas.y].hazards.push({ name: gas.name, sprite });
						gameContext.sceneLayers.hazards.add(sprite);
					});

					data.removedGas.forEach(gas => {
						const updatedHazards = [];

						gameContext.serverState.world.grid[gas.x][gas.y].hazards.forEach(hazard => {
							if (hazard.name?.endsWith('gas')) hazard.sprite.dissipate();
							else updatedHazards.push(hazard);
						});

						gameContext.serverState.world.grid[gas.x][gas.y].hazards = updatedHazards;
					});
				} else if (data.update === 'spillLava') {
					data.addedLava.forEach(lava => {
						const sprite = new Lava(gameContext.scene, lava.x, lava.y, 'fill');

						gameContext.serverState.world.grid[lava.x][lava.y].hazards = gameContext.serverState.world.grid[lava.x][
							lava.y
						].hazards.filter(hazard => {
							if (hazard.name.endsWith('monster')) {
								gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });

								hazard.sprite.destroy();

								return false;
							} else return true;
						});

						gameContext.serverState.world.grid[lava.x][lava.y].hazards.push({ name: 'lava', sprite });
						gameContext.sceneLayers.hazards.add(sprite);
					});

					data.removedLava.forEach(lava => {
						const updatedHazards = [];

						gameContext.serverState.world.grid[lava.x][lava.y].hazards.forEach(hazard => {
							if (hazard.name === 'lava') hazard.sprite.dissipate();
							else updatedHazards.push(hazard);
						});

						gameContext.serverState.world.grid[lava.x][lava.y].hazards = updatedHazards;
					});
				} else if (data.update === 'wakeChomper') {
					const chomper = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
						hazard => hazard.name === data.name,
					);

					if (!chomper) return;

					chomper.sprite.awake();

					chomper.sprite.move(data.move, 500, data.orientation);

					gameContext.serverState.world.grid[data.position.x][data.position.y].hazards =
						gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.filter(
							hazard => hazard.name !== data.name,
						);

					gameContext.serverState.world.grid[data.move.x][data.move.y].hazards.push(chomper);
				} else if (data.update === 'sleepChomper') {
					const chomper = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
						hazard => hazard.name === data.name,
					);

					if (!chomper) return;

					chomper.sprite.sleep();
				} else if (data.update === 'hurtPlayers') {
					data.players.forEach(player => {
						gameContext.players.update(player.id, _ => ({ ..._, health: player.health }));

						if (player.id === gameContext.playerId) {
							const { sprite } = gameContext.players.get(player.id);

							sprite.updateStatusBars();

							gameContext.scene.sound.play('hurt', {
								volume: convertRange(data.damage, [0, 3], [0, gameContext.volume.effects]),
							});
						}
					});
				} else if (data.update === 'spacecoSell') {
					console.log('spacecoSell', data);
					gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

					[...Array(randInt(2, Math.min(100, Math.max(3, data.gain))))].forEach((_, index) =>
						setTimeout(
							() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }),
							index * randInt(40, 70),
						),
					);

					gameContext.spaceco.dialog.options.view = 'success';
				} else if (data.update === 'spacecoRefuel') {
					console.log('spacecoRefuel', data);
					gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

					[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
						setTimeout(
							() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }),
							index * randInt(40, 70),
						),
					);

					gameContext.serverState.world.spaceco.hull = data.spacecoHull;

					gameContext.spaceco.dialog.options.view = 'success';
				} else if (data.update === 'spacecoRepair') {
					console.log('spacecoRepair', data);
					gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

					[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
						setTimeout(
							() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }),
							index * randInt(40, 70),
						),
					);

					[...Array(randInt(2, Math.min(100, Math.max(3, data.purchasedRepairs))))].forEach((_, index) =>
						setTimeout(
							() => gameContext.sounds.heal.play({ volume: gameContext.volume.effects }),
							index * randInt(40, 70),
						),
					);

					gameContext.spaceco.dialog.options.view = 'success';
				} else if (data.update === 'spacecoBuyItem') {
					console.log('spacecoBuyItem', data);
					gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

					[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
						setTimeout(
							() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }),
							index * randInt(40, 70),
						),
					);
				} else if (data.update === 'spacecoBuyUpgrade') {
					console.log('spacecoBuyUpgrade', data);
					gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

					[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
						setTimeout(
							() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }),
							index * randInt(40, 70),
						),
					);

					gameContext.spaceco.dialog.options.view = 'success';
				} else if (data.update === 'updatePlayer') {
					console.log('sync player', data);
					gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));
				} else if (data.update === 'triggerEffect') {
					const player = gameContext.players.get(data.playerId);

					const delta = {
						x: data.position.x - player.position.x,
						y: data.position.y - player.position.y,
					};

					if (data.effect === 'explosion') {
						gameContext.scene.cameras.main.shake(
							1000,
							convertRange(Math.abs(delta.x) + Math.abs(delta.y), [0, 20], [0.01, 0]),
						);
						gameContext.scene.cameras.main.flash(600);
						gameContext.scene.sound.play('explode', { volume: gameContext.volume.effects });

						getSurroundingRadius(data.position, 3).forEach(({ x, y }) => {
							const gridConfig = gameContext.serverState.world.grid[x][y];
							if (gridConfig.ground.sprite?.scene) gridConfig.ground.sprite.dig();
						});
					} else if (data.effect === 'freeze') {
						gameContext.scene.cameras.main.shake(
							1000,
							convertRange(Math.abs(delta.x) + Math.abs(delta.y), [0, 20], [0.01, 0]),
						);
						gameContext.scene.cameras.main.flash(600);
						gameContext.scene.sound.play('explode', { volume: gameContext.volume.effects });

						getSurroundingRadius(data.position, 3).forEach(({ x, y }) => {
							gameContext.serverState.world.grid[x][y].hazards.forEach(({ name }) => {
								if (name === 'lava') gameContext.serverState.world.grid[x][y].ground.type = 'white';
							});
						});
					} else if (data.effect === 'teleport') {
						player.sprite.teleport(
							data.position,
							Math.min(3000, Math.max(1000, Math.abs(delta.x) + Math.abs(delta.y) * 50)),
						);
					}
				}
			}
		});

		this.addCleanup('socketCleanup', () => socketCleanup());

		window.addEventListener(
			'resize',
			debounce(() => {
				gameContext.game.scale.resize(window.innerWidth, window.innerHeight - 78);
			}),
		);

		const path = [];
		const move = [];
		gameContext.cursor = gameContext.scene.add.rectangle(0, 0, 64, 64, 0xff0000);
		gameContext.cursor.alpha = 0.5;
		gameContext.cursor.visible = false;
		gameContext.sceneLayers.interfaces.add(gameContext.cursor);

		const submitMove = () => {
			if (move.length === 0) return;

			path.forEach((rectangle, index) => {
				rectangle.scene.tweens.add({
					targets: rectangle,
					duration: 400,
					delay: index * 400,
					alpha: 0,
					onComplete: () => rectangle.destroy(),
				});
			});

			movePlayer({ gameId: gameContext.serverState.id, playerId: gameContext.playerId, path: move });

			move.length = 0;
			path.length = 0;

			gameContext.scene.sound.play('path_accept', { volume: gameContext.volume.interfaces });

			gameContext.cursor.visible = false;
		};

		gameContext.scene.input.on('pointerdown', pointer => {
			const gridPosition = pxToGridPosition({ x: pointer.worldX, y: pointer.worldY });
			const gridSnappedPxPosition = gridToPxPosition(gridPosition);

			gameContext.cursor.x = gridSnappedPxPosition.x;
			gameContext.cursor.y = gridSnappedPxPosition.y;

			const player = gameContext.players.get(gameContext.playerId);
			const delta = {
				x: Math.abs(gridPosition.x - player.position.x),
				y: Math.abs(gridPosition.y - player.position.y),
			};

			// if (delta.x > 2 || delta.y > 2) {
			// 	console.log('Far click -- Effect Test');

			// 	triggerEffect({
			// 		gameId: gameContext.serverState.id,
			// 		playerId,
			// 		effect: 'teleport',
			// 		position: gridPosition,
			// 	});

			// 	return;
			// }

			if (delta.x > 1 || delta.y > 1 || (delta.x === 0 && delta.y === 0)) return;

			if (!hasFooting(gridPosition, gameContext.serverState.world.grid)) return;

			path.push(gameContext.scene.add.rectangle(gridSnappedPxPosition.x, gridSnappedPxPosition.y, 64, 64, 0x00ff00));
			path[path.length - 1].alpha = 0.8;

			move.push(gridPosition);
		});

		gameContext.scene.input.on(
			'pointermove',
			throttle((pointer, gameObjects) => {
				if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
					window.location.reload();
				}

				if (gameObjects.some(one => one === gameContext.spaceco.tradeButton)) return;

				const player = gameContext.players.get(gameContext.playerId);

				if (!player) return console.log('missing player', gameContext.players);

				const gridPosition = pxToGridPosition({ x: pointer.worldX, y: pointer.worldY });
				const gridSnappedPxPosition = gridToPxPosition(gridPosition);

				const lastMove = move[move.length - 1] || player.position;
				const delta = {
					x: Math.abs(gridPosition.x - lastMove.x),
					y: Math.abs(gridPosition.y - lastMove.y),
				};

				gameContext.cursor.x = gridSnappedPxPosition.x;
				gameContext.cursor.y = gridSnappedPxPosition.y;
				gameContext.cursor.visible = true;
				gameContext.cursor.fillColor = 0xff0000;

				if (gridPosition.x === player.position.x && gridPosition.y === player.position.y) {
					// console.log('move rejected: player position', { gridPosition, delta });
					return;
				}

				if (delta.x > 1 || delta.y > 1 || (delta.x === 0 && delta.y === 0)) {
					// console.log('move rejected: not a move', { gridPosition, delta, lastMove });
					return;
				}

				if (move.some(step => step.x === gridPosition.x && step.y === gridPosition.y)) {
					// console.log('move rejected: already used');
					return;
				}

				const surrounds = getImmediateSurrounds(
					gridPosition,
					['left', 'right', 'bottom'],
					gameContext.serverState.world.grid,
				);

				if (
					!hasFooting(gridPosition, gameContext.serverState.world.grid, [
						...(move.some(step => step.x === surrounds.left.x && step.y === surrounds.left.y) ? [] : ['left']),
						...(move.some(step => step.x === surrounds.right.x && step.y === surrounds.right.y) ? [] : ['right']),
						...(move.some(step => step.x === surrounds.bottom.x && step.y === surrounds.bottom.y) ? [] : ['bottom']),
					])
				) {
					// console.log('move rejected: no footing');
					return;
				}

				gameContext.cursor.fillColor = 0x00ff00;

				// console.log('move OK', { gridPosition, delta, lastMove });

				if (pointer.isDown && move.length < 10) {
					path.push(
						gameContext.scene.add.rectangle(gridSnappedPxPosition.x, gridSnappedPxPosition.y, 64, 64, 0x00ff00),
					);
					path[path.length - 1].alpha = 0.8;

					move.push(gridPosition);

					gameContext.scene.sound.play('path_select', { volume: gameContext.volume.interfaces });
				}
			}, 30),
		);

		gameContext.scene.input.on('pointerup', () => submitMove());

		gameContext.scene.input.on('gameout', () => {
			gameContext.cursor.visible = false;

			submitMove();
		});
	}
}
