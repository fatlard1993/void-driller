import { randInt } from 'vanilla-bean-components';

import gameContext from '../../shared/gameContext';

export default data => {
	if (data.update === 'spacecoSell') {
		console.log('spacecoSell', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		[...Array(randInt(2, Math.min(100, Math.max(3, data.gain))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		gameContext.spaceco.dialog.options.view = 'success';
	} else if (data.update === 'spacecoRefuel') {
		console.log('spacecoRefuel', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		gameContext.serverState.world.spaceco.hull = data.spacecoHull;

		gameContext.spaceco.dialog.options.view = 'success';
	} else if (data.update === 'spacecoRepair') {
		console.log('spacecoRepair', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		[...Array(randInt(2, Math.min(100, Math.max(3, data.purchasedRepairs))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.heal.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		gameContext.spaceco.dialog.options.view = 'success';

		if (data.type === 'outpost') {
			gameContext.serverState.world.spaceco.health = 9;
			gameContext.spaceco.hurt();
		}
	} else if (data.update === 'spacecoBuyItem') {
		console.log('spacecoBuyItem', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		gameContext.serverState.world.spaceco.items = data.spacecoUpdates.items;

		gameContext.spaceco.dialog.options.view = 'shop';
	} else if (data.update === 'spacecoBuyUpgrade') {
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		gameContext.spaceco.dialog.options.view = 'success';

		gameContext.serverState.world.spaceco[data.type] = data.spacecoUpdates[data.type];
	} else if (data.update === 'spacecoBuyTransport') {
		console.log('spacecoBuyTransport', data);
		gameContext.players.update(data.playerId, _ => ({ ..._, ...data.updates }));

		[...Array(randInt(2, Math.min(100, Math.max(3, data.cost))))].forEach((_, index) =>
			setTimeout(() => gameContext.sounds.coin.play({ volume: gameContext.volume.effects }), index * randInt(40, 70)),
		);

		gameContext.spaceco.dialog.options.view = 'success';

		setTimeout(window.location.reload(), 1500);
	} else if (data.update === 'spacecoFall') {
		console.log('spacecoFall', data);
		gameContext.serverState.world.spaceco.position = data.position;
		gameContext.serverState.world.spaceco.health = data.health;

		gameContext.spaceco.fall(data.position);
	}

	return false;
};
