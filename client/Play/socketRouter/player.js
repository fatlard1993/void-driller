import { convertRange, randInt } from 'vanilla-bean-components';
import gameContext from '../../shared/gameContext';
import { destroyGround } from '../effects';
import { Drill, Item } from '../GameObjects';

export default data => {
	if (data.update === 'playerMove') {
		let player = gameContext.players.get(data.player.id);

		if (!player?.sprite) {
			const sprite = new Drill(
				gameContext.scene,
				data.player.position.x,
				data.player.position.y,
				data.player.orientation,
				gameContext.serverState.world.vehicles[data.player.configuration.vehicle].spriteIndex,
				gameContext.serverState.world.drills[data.player.configuration.drill].spriteIndex,
			);

			gameContext.players.set(data.player.id, { ...player, ...data.player, sprite });
			gameContext.sceneLayers.players.add(sprite);
		} else gameContext.players.set(data.player.id, { ...player, ...data.player });

		player = gameContext.players.get(data.player.id);

		const gridConfig = gameContext.serverState.world.grid[player.position.x][player.position.y];

		destroyGround(player.position);

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
			gameContext.serverState.world.vehicles[data.newPlayer.configuration.vehicle].spriteIndex,
			gameContext.serverState.world.drills[data.newPlayer.configuration.drill].spriteIndex,
		);

		gameContext.players.set(data.newPlayer.id, { ...data.newPlayer, sprite });
		gameContext.sceneLayers.players.add(sprite);
	} else if (data.update === 'removePlayer') {
		const player = gameContext.players.get(data.id);

		player.sprite.destroy();

		gameContext.players.delete(data.id);
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
	} else if (data.update === 'useItem') {
		console.log('useItem', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		if (data.item === 'spaceco_teleporter' || data.item.startsWith('activated_teleporter')) {
			gameContext.players.get(data.playerId).sprite.teleport(data.updates.position, 1000);

			if (data.item.startsWith('activated_teleporter')) {
				gameContext.serverState.world.grid[data.stationPosition.x][data.stationPosition.y].items =
					gameContext.serverState.world.grid[data.stationPosition.x][data.stationPosition.y].items.filter(item => {
						if (item.name !== 'teleport_station') return true;

						if (item.sprite?.scene) item.sprite.destroy();
					});
			}
		} else if (data.item === 'repair_nanites') {
			[...Array(randInt(2, 40))].forEach((_, index) =>
				setTimeout(() => gameContext.sounds.heal.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
			);
			const player = gameContext.players.get(data.playerId);

			player.sprite.move(player.position, 0, player.orientation);
		} else if (data.item === 'advanced_teleporter') {
			const sprite = new Item(gameContext.scene, data.stationPosition.x, data.stationPosition.y, 'teleport_station');

			gameContext.serverState.world.grid[data.stationPosition.x][data.stationPosition.y].items.push({
				name: 'teleport_station',
				sprite,
			});
		} else if (data.item === 'timed_charge' || data.item === 'remote_charge') {
			const sprite = new Item(gameContext.scene, data.bombPosition.x, data.bombPosition.y, data.item);

			gameContext.serverState.world.grid[data.bombPosition.x][data.bombPosition.y].items.push({
				name: data.item,
				sprite,
			});
		} else {
			console.warn(`unknown item ${data.item}`);
		}
	} else if (data.update === 'playerFall') {
		console.log('playerFall', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		gameContext.players.get(data.playerId).sprite.fall(data.updates.position);
	} else if (data.update === 'updatePlayer') {
		console.log('sync player', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));
	}

	return false;
};
