import { getSurroundingRadius } from '../utils';

export const explode = ({ game, position, radius }) => {
	console.log('explode', { position, radius });
	const playersToFall = [];

	[position, ...getSurroundingRadius(position, radius)].forEach(({ x, y }) => {
		if (game.world.grid[x]?.[y]) game.world.grid[x][y] = { ground: {}, items: [], hazards: [] };

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
};
