import Phaser from 'phaser';

import { rand } from '../../utils';
import { Ground, Item, Mineral, Spaceco, Drill, Chomper, Lava, Gas } from './GameObjects';
import gameContext from './gameContext';
import { Player } from './GameObjects/Player';

const sounds = [
	'dig',
	'hurt',
	'heal',
	'hurt_chomper',
	'pickup',
	'console_open',
	'alert',
	'alert2',
	'blip',
	'path_select',
	'path_accept',
	'coin',
	'explode',
	'music/chip1',
	'music/chip2',
	'music/chip3',
	'music/chip4',
	'music/chip5',
];

export default class GameScene extends Phaser.Scene {
	preload() {
		this.load.spritesheet('drills', 'img/drills.png', { frameWidth: 30, frameHeight: 56 });
		this.load.spritesheet('spaceco', 'img/spaceco.png', { frameWidth: 192, frameHeight: 192 });
		this.load.spritesheet('engines', 'img/engines.png', { frameWidth: 128, frameHeight: 128 });

		this.load.spritesheet('vehicles', 'img/vehicles.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('teleport', 'img/teleport.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('items', 'img/items.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('monsters', 'img/monsters.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('fogs', 'img/fogs.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('ground', 'img/ground.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('lava', 'img/lava.png', { frameWidth: 64, frameHeight: 64 });
		this.load.spritesheet('crack', 'img/crack.png', { frameWidth: 64, frameHeight: 64 });

		this.load.spritesheet('icons', 'img/icons.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('minerals', 'img/minerals.png', { frameWidth: 32, frameHeight: 32 });

		sounds.forEach(sound => this.load.audio(sound, `audio/${sound}.wav`));

		['ground', 'hazards', 'items', 'players', 'interfaces'].forEach(name => {
			gameContext.sceneLayers[name] = this.add.layer();
		});
	}

	create() {
		sounds.forEach(sound => {
			gameContext.sounds[sound] = this.sound.add(sound);
		});

		gameContext.serverState.world.grid.forEach((layer, x) => {
			layer.forEach((gridConfig, y) => {
				if (gridConfig.ground.type) {
					gameContext.serverState.world.grid[x][y].ground.sprite = new Ground(this, x, y, gridConfig.ground.type);
					gameContext.sceneLayers.ground.add(gameContext.serverState.world.grid[x][y].ground.sprite);
				}

				if (gridConfig.hazards.length) {
					gridConfig.hazards.forEach((hazard, z) => {
						if (!hazard?.name) return;

						let sprite;

						if (hazard.name === 'lava') sprite = new Lava(this, x, y, 'full');
						else if (hazard.name.endsWith('monster')) {
							sprite = new Chomper(this, x, y, hazard.name.split('_')[0]);
						} else if (hazard.name.endsWith('gas')) {
							sprite = new Gas(this, x, y, hazard.name.split('_')[0], 'full');
						}

						gameContext.serverState.world.grid[x][y].hazards[z].sprite = sprite;
						gameContext.sceneLayers.hazards.add(sprite);
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
		);

		gameContext.sceneLayers.hazards.add(gameContext.spaceco);

		gameContext.serverState.players.forEach(player => {
			if (gameContext.playerId === player.id) {
				console.log('player', player)
				const sprite = new Player(
					this,
					player.position.x,
					player.position.y,
					player.orientation,
					gameContext.serverState.world.vehicles[player.configuration.vehicle].spriteIndex,
					gameContext.serverState.world.drills[player.configuration.drill].spriteIndex,
				);

				gameContext.players.set(player.id, { ...player, sprite });
			} else {
				const sprite = new Drill(
					this,
					player.position.x,
					player.position.y,
					player.orientation,
					gameContext.serverState.world.vehicles[player.configuration.vehicle].spriteIndex,
					gameContext.serverState.world.drills[player.configuration.drill].spriteIndex,
				);

				gameContext.players.set(player.id, { ...player, sprite });
			}
		});
	}
}
