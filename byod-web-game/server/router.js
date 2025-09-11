import requestMatch from './requestMatch';
import { games } from './GameSaveDatabase';

const validateGameMatch = ({ gameId, playerId, validatePlayer = false }, errorMessages = {}) => {
	const game = games[gameId];

	if (!game) {
		return {
			error: Response.json({ 
				message: errorMessages.gameNotFound || 'Game not found.' 
			}, { status: 404 }),
		};
	}

	if (validatePlayer && (!playerId || !games[gameId]?.players?.has(playerId))) {
		return {
			error: Response.json({ 
				message: errorMessages.playerNotFound || 'Player not found. Your session may have expired.' 
			}, { status: 404 }),
		};
	}

	return { game, gameId, playerId };
};

const router = async (request, server) => {
	let match;

	match = requestMatch('GET', '/games', request);
	if (match) return Response.json(Object.values(games).map(game => game.toClient()));

	match = requestMatch('GET', '/games/:gameId', request);
	if (match) {
		const { game, error } = validateGameMatch(match);

		if (error) return error;

		return Response.json(game.toClient());
	}

	match = requestMatch('POST', '/games', request);
	if (match) {
		const game = new server.Game(await request.json());

		games[game.id] = game;

		server.socketBroadcast({ update: 'newGame', game: game.toClient() });

		return Response.json(game.toClient(), { status: 201 });
	}

	match = requestMatch('POST', '/games/:gameId/join', request);
	if (match) {
		const { game, error } = validateGameMatch(match);

		if (error) return error;

		const body = await request.json();
		const { playerId, name } = body;

		if (playerId && game.players.has(playerId)) {
			return Response.json(game.players.get(playerId), { status: 200 });
		}

		const newPlayer = game.addPlayer(name);

		return Response.json(newPlayer, { status: 201 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/exit', request);
	if (match) {
		const { game, playerId, error } = validateGameMatch({ ...match, validatePlayer: true });

		if (error) return error;

		return Response.json(game.removePlayer(playerId), { status: 200 });
	}

	match = requestMatch('DELETE', '/games/:gameId', request);
	if (match) {
		const { gameId, error } = validateGameMatch(match);

		if (error) return error;

		server.database.collections.games.delete({ id: gameId });
		games[gameId] = undefined;

		server.socketBroadcast({ update: 'removedGame', gameId });

		return new Response(null, { status: 204 });
	}
};

export default router;
