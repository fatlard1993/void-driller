import { getSurroundingRadius } from '../utils';
import { gameLog } from '../utils/logger.js';

export const explode = ({ game, position, radius, playerId = null }) => {
	gameLog.info('Explosion triggered', { position, radius, playerId });

	const playersToFall = [];

	// First pass: trigger chain reactions before destruction
	const chainReactions = [];
	getSurroundingRadius(position, radius).forEach(({ x, y }) => {
		if (game.world.grid[x]?.[y]) {
			game.world.grid[x][y].items.forEach(item => {
				// Fuel items and explosive items that chain react
				const isFuel = ['oil', 'battery', 'super_oxygen_liquid_nitrogen'].includes(item.name);
				const isExplosive = ['timed_charge', 'remote_charge'].includes(item.name);
				const isImplosive = ['gravity_charge', 'void_implosion'].includes(item.name);

				if ((isFuel || isExplosive || isImplosive) && !(x === position.x && y === position.y)) {
					chainReactions.push({ x, y, item: item.name });
				}
			});
		}
	});

	// Second pass: destroy everything
	getSurroundingRadius(position, radius).forEach(({ x, y }) => {
		if (game.world.grid[x]?.[y]) {
			game.world.grid[x][y] = { ground: {}, items: [], hazards: [] };
		}

		if (game.world.spaceco.position.x === x && game.world.spaceco.position.y === y) {
			game.world.spaceco.health = Math.max(0, game.world.spaceco.health - 1);
		}

		game.players.forEach(player => {
			if (player.position.x === x && player.position.y === y) playersToFall.push(player.id);
		});
	});

	game.broadcast('explodeBomb', { radius, position });

	game.spacecoFall();

	playersToFall.forEach(playerId => game.playerFall(playerId));

	// Check for additional players who lost wheel support due to explosion
	game.checkForPlayerFalls();

	// Trigger chain reactions with delay for visual effect
	chainReactions.forEach(({ x, y, item }) => {
		setTimeout(() => {
			// Only explode if the position still exists and is valid
			if (game.world.grid[x]?.[y]) {
				if (item === 'gravity_charge') {
					// Chain reactions award to original triggering player
					game.implode({
						position: { x, y },
						radius: 4,
						playerId: playerId, // Pass through original player
						implosionType: 'gravity',
					});
				} else if (item === 'void_implosion') {
					game.implode({
						position: { x, y },
						radius: 6,
						playerId: playerId, // Pass through original player
						implosionType: 'void',
					});
				} else {
					// Standard explosion for fuel items and explosive charges
					explode({ game, position: { x, y }, radius: 3, playerId });
				}
			}
		}, 200);
	});
};

export const implode = ({ game, position, radius, playerId, implosionType = 'gravity' }) => {
	gameLog.info('Implosion triggered', { position, radius, implosionType, playerId });

	const collectedMinerals = {};
	const collectedItems = {};
	const playersToFall = [];

	getSurroundingRadius(position, radius).forEach(({ x, y }) => {
		if (game.world.grid[x]?.[y]) {
			const cell = game.world.grid[x][y];

			// Collect minerals from ground
			if (cell.ground?.type) {
				const mineralType = cell.ground.type;
				collectedMinerals[mineralType] = (collectedMinerals[mineralType] || 0) + 1;
			}

			// Collect pure minerals and items
			cell.items.forEach(item => {
				if (item.name.startsWith('mineral_')) {
					const mineralType = item.name.replace('mineral_', '');
					const pureKey = `mineral_${mineralType}`;
					collectedMinerals[pureKey] = (collectedMinerals[pureKey] || 0) + 1;
				} else if (!item.name.includes('charge') && !item.name.includes('implosion')) {
					collectedItems[item.name] = (collectedItems[item.name] || 0) + 1;
				}
			});

			// Handle chain reactions
			cell.items.forEach(item => {
				// Fuel items and explosive items that chain react
				const isFuel = ['oil', 'battery', 'super_oxygen_liquid_nitrogen'].includes(item.name);
				const isExplosive = ['timed_charge', 'remote_charge'].includes(item.name);
				const isImplosive = ['gravity_charge', 'void_implosion'].includes(item.name);

				if ((isFuel || isExplosive || isImplosive) && !(x === position.x && y === position.y)) {
					setTimeout(() => {
						if (item.name === 'gravity_charge') {
							implode({ game, position: { x, y }, radius: 4, playerId, implosionType: 'gravity' });
						} else if (item.name === 'void_implosion') {
							implode({ game, position: { x, y }, radius: 6, playerId, implosionType: 'void' });
						} else {
							// Standard explosion for fuel and explosive items
							explode({ game, position: { x, y }, radius: 3, playerId });
						}
					}, 200);
				}
			});

			game.world.grid[x][y] = { ground: {}, items: [], hazards: [] };
		}

		if (game.world.spaceco.position.x === x && game.world.spaceco.position.y === y) {
			game.world.spaceco.health = Math.max(0, game.world.spaceco.health - 2);
		}

		game.players.forEach(player => {
			if (player.position.x === x && player.position.y === y) playersToFall.push(player.id);
		});
	});

	// Award collected materials to the player
	const player = game.players.get(playerId);
	if (player && (Object.keys(collectedMinerals).length > 0 || Object.keys(collectedItems).length > 0)) {
		const updatedHull = { ...player.hull };
		const updatedItems = { ...player.items };

		Object.entries(collectedMinerals).forEach(([mineralType, count]) => {
			updatedHull[mineralType] = (updatedHull[mineralType] || 0) + count;
		});

		Object.entries(collectedItems).forEach(([itemType, count]) => {
			updatedItems[itemType] = (updatedItems[itemType] || 0) + count;
		});

		game.players.update(playerId, _ => ({
			..._,
			hull: updatedHull,
			items: updatedItems,
		}));

		game.updatePlayerCargo(playerId);
	}

	game.broadcast('explodeImplosion', {
		radius,
		position,
		implosionType,
		playerId,
		collectedMinerals,
		collectedItems,
	});

	game.spacecoFall();
	playersToFall.forEach(playerId => game.playerFall(playerId));

	// Check for additional players who lost wheel support due to implosion
	game.checkForPlayerFalls();
};
