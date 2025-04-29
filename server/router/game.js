import requestMatch from '../utils/requestMatch';
import Game, { games } from '../Game';
import { socketBroadcast } from '../server';
import gamesDatabase from '../database/games';

const _game = async request => {
	let match;

	match = requestMatch('GET', '/games', request);
	if (match) return Response.json(Object.values(games).map(game => game.toClient()));

	match = requestMatch('GET', '/games/:gameId', request);
	if (match) {
		const game = games[match.gameId];

		if (!game) return Response.json({ message: `Could not find game "${match.gameId}"` }, { status: 404 });

		return Response.json(game.toClient());
	}

	match = requestMatch('POST', '/games', request);
	if (match) {
		const game = new Game(await request.json());

		games[game.id] = game;

		socketBroadcast({ update: 'newGame', game });

		return Response.json(game, { status: 201 });
	}

	match = requestMatch('POST', '/games/:gameId/join', request);
	if (match) {
		const body = await request.json();
		const { gameId } = match;
		const { playerId, name } = body;
		const game = games[gameId];

		console.log('Join Game', {
			gameId,
			playerId,
			name,
			existingPlayer: game.players.get(playerId),
		});

		if (playerId && game.players.has(playerId)) {
			return Response.json(game.players.get(playerId), { status: 200 });
		}

		const newPlayer = game.addPlayer(name);

		return Response.json(newPlayer, { status: 201 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/exit', request);
	if (match) {
		const { gameId, playerId } = match;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		return Response.json(games[gameId].removePlayer(playerId), { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/move', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { path } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		if(games[gameId].players.get(playerId).moving) {
			return Response.json({ message: `Player "${playerId}" is already moving` }, { status: 400 });
		}

		games[gameId].movePlayer(playerId, path);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/sell', request);
	if (match) {
		const { gameId, playerId } = match;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].spacecoSell(playerId);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/refuel', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { amount } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].spacecoRefuel(playerId, amount);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/repair', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { amount } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].spacecoRepair(playerId, amount);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/item', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { item } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].spacecoBuyItem(playerId, item);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/upgrade', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { upgrade } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].spacecoBuyUpgrade(playerId, upgrade);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/triggerEffect', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { effect, position } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].triggerEffect(playerId, effect, position);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/useItem', request);
	if (match) {
		const body = await request.json();
		const { gameId, playerId } = match;
		const { item } = body;

		if (!playerId || !games[gameId]?.players?.has(playerId)) {
			return Response.json({ message: `Could not find player "${playerId}"` }, { status: 404 });
		}

		games[gameId].useItem(playerId, item);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('DELETE', '/games/:id', request);
	if (match) {
		const { id } = match;

		if (!games[id] && !gamesDatabase.read({ id: id })) {
			return Response.json({ message: `Could not find game "${id}"` }, { status: 404 });
		}

		delete games[id];

		gamesDatabase.delete(id);

		socketBroadcast({ update: 'removedGame', id });

		return new Response(null, { status: 204 });
	}
};

export default _game;
