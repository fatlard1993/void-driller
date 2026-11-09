import { requestMatch } from '@vanilla-bean/components/app';
import { serverLog, gameLog, playerLog } from '../../utils/logger.js';

// A game method's answer as a response: a refusal carries its reason
const respond = result =>
	result?.success === false
		? Response.json({ message: result.error }, { status: 400 })
		: Response.json({}, { status: 200 });

const parseRequestBody = async request => {
	try {
		return { body: await request.json(), error: null };
	} catch (parseError) {
		serverLog.warning('JSON parse error in parseRequestBody', {
			error: parseError.message,
			url: request.url,
			method: request.method,
		});
		return {
			body: null,
			error: Response.json({ message: 'Invalid request format' }, { status: 400 }),
		};
	}
};

const validateGameMatch = ({ gameId, playerId }, { games }, request) => {
	const game = games[gameId];

	if (!game) {
		serverLog.warning('Security: Invalid game access attempt', {
			gameId,
			playerId,
			userAgent: request.headers.get('User-Agent'),
			ip: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || 'unknown',
		});
		return {
			error: Response.json({ message: 'Invalid route: no active contract found for this asteroid.' }, { status: 404 }),
		};
	}

	if (!playerId || !games[gameId]?.players?.has(playerId)) {
		serverLog.warning('Security: Invalid player credentials', {
			gameId,
			playerId,
			gameExists: !!game,
			playerExists: !!playerId,
			playerInGame: playerId ? games[gameId]?.players?.has(playerId) : false,
			userAgent: request.headers.get('User-Agent'),
			ip: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || 'unknown',
		});
		return {
			error: Response.json({ message: 'Driller not found. Your credentials may have expired.' }, { status: 404 }),
		};
	}

	return { game, gameId, playerId };
};

const _game = async (request, server) => {
	let match;

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/rescue', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		return respond(server.games[gameId].spacecoRescue(playerId));
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/useItem', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		return respond(server.games[gameId].useItem(playerId, body.item));
	}

	// Update trade offer (must come before base /trade route)
	match = requestMatch('POST', '/games/:gameId/:playerId/trade/:tradeId/offer', request);
	if (match) {
		const { gameId, playerId, tradeId, error } = {
			...validateGameMatch(match, server, request),
			tradeId: match.tradeId,
		};

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { offer } = body;

		if (!offer) {
			return Response.json({ message: 'Offer required' }, { status: 400 });
		}

		try {
			const result = server.games[gameId].updateTradeOffer(playerId, tradeId, offer);

			if (!result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({ success: true }, { status: 200 });
		} catch (tradeError) {
			gameLog.error('Trade offer update error', { playerId, gameId, tradeId, error: tradeError.message });
			return Response.json({ message: 'Trade system error. Please try again.' }, { status: 500 });
		}
	}

	// Accept trade (must come before base /trade route)
	match = requestMatch('POST', '/games/:gameId/:playerId/trade/:tradeId/accept', request);
	if (match) {
		const { gameId, playerId, tradeId, error } = {
			...validateGameMatch(match, server, request),
			tradeId: match.tradeId,
		};

		if (error) return error;

		try {
			const result = server.games[gameId].acceptTrade(playerId, tradeId);

			if (!result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({ success: true, waitingForOther: result.waitingForOther }, { status: 200 });
		} catch (tradeError) {
			gameLog.error('Trade accept error', { playerId, gameId, tradeId, error: tradeError.message });
			return Response.json({ message: 'Trade system error. Please try again.' }, { status: 500 });
		}
	}

	// Cancel trade (DELETE must come before base /trade route)
	match = requestMatch('DELETE', '/games/:gameId/:playerId/trade/:tradeId', request);
	if (match) {
		const { gameId, playerId, tradeId, error } = {
			...validateGameMatch(match, server, request),
			tradeId: match.tradeId,
		};

		if (error) return error;

		try {
			const result = server.games[gameId].cancelTrade(playerId, tradeId);

			if (!result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({ success: true }, { status: 200 });
		} catch (tradeError) {
			gameLog.error('Trade cancellation error', { playerId, gameId, error: tradeError.message });
			return Response.json({ message: 'Trade system error. Please try again.' }, { status: 500 });
		}
	}

	// Initiate trade session (must come AFTER more specific routes)
	match = requestMatch('POST', '/games/:gameId/:playerId/trade', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { targetPlayerId } = body;

		if (!targetPlayerId) {
			return Response.json({ message: 'Target player ID required' }, { status: 400 });
		}

		try {
			const result = server.games[gameId].initiateTrade(playerId, targetPlayerId);

			if (!result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({ tradeId: result.tradeId }, { status: 200 });
		} catch (tradeError) {
			gameLog.error('Trade initiation error', { playerId, gameId, error: tradeError.message });
			return Response.json({ message: 'Trade system error. Please try again.' }, { status: 500 });
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/repair-position', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		try {
			const game = server.games[gameId];
			const player = game.players.get(playerId);

			if (!player) {
				return Response.json({ message: 'Player not found' }, { status: 404 });
			}

			// Check if player position is actually corrupted
			if (
				!player.position ||
				typeof player.position.x !== 'number' ||
				typeof player.position.y !== 'number' ||
				player.position.x === null ||
				player.position.y === null ||
				!Number.isFinite(player.position.x) ||
				!Number.isFinite(player.position.y)
			) {
				playerLog.info('Repairing corrupted position', { playerId, currentPosition: player.position });

				// Use the same spawn logic as new players
				gameLog.debug('Finding valid spawn position for repair');
				gameLog.debug('Spawn position function check', { exists: typeof game.findValidSpawnPosition });
				gameLog.debug('Game instance check', { constructor: game.constructor.name });
				const repairPosition = game.findValidSpawnPosition();
				gameLog.debug('Repair position result', { repairPosition });

				// Update player position
				game.players.update(playerId, current => ({
					...current,
					position: repairPosition,
					orientation: 'up', // Face towards SpaceCo
				}));

				playerLog.info('Position repaired', { playerId, newPosition: repairPosition });
				gameLog.debug('Position repair context', {
					spacecoPosition: game.world.spaceco.position,
					worldAirGap: game.world.airGap,
				});

				// Broadcast the repair to all clients
				game.broadcast('updatePlayer', {
					playerId,
					updates: {
						position: repairPosition,
						orientation: 'up',
					},
				});

				return Response.json(
					{
						success: true,
						newPosition: repairPosition,
						message: 'Position repaired successfully',
					},
					{ status: 200 },
				);
			} else {
				return Response.json(
					{
						success: true,
						message: 'Position is already valid',
					},
					{ status: 200 },
				);
			}
		} catch (repairError) {
			gameLog.error('Position repair error', { playerId, error: repairError.message });
			return Response.json(
				{
					message: 'Position repair system error. Please try again.',
				},
				{ status: 500 },
			);
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/disarm-bomb', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);
		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { x, y } = body;
		if (x === undefined || y === undefined) {
			return Response.json({ message: 'Position coordinates (x, y) are required' }, { status: 400 });
		}

		try {
			return respond(server.games[gameId].disarmBomb(playerId, { x, y }));
		} catch (disarmError) {
			gameLog.error('Bomb disarm error', { playerId, gameId, position: { x, y }, error: disarmError.message });
			return Response.json({ message: 'Bomb disarm system error. Please try again.' }, { status: 500 });
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/deactivate-teleporter', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);
		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { x, y } = body;
		if (x === undefined || y === undefined) {
			return Response.json({ message: 'Position coordinates (x, y) are required' }, { status: 400 });
		}

		try {
			return respond(server.games[gameId].deactivateTeleporter(playerId, { x, y }));
		} catch (deactivateError) {
			gameLog.error('Teleporter deactivate error', {
				playerId,
				gameId,
				position: { x, y },
				error: deactivateError.message,
			});
			return Response.json({ message: 'Teleporter deactivate system error. Please try again.' }, { status: 500 });
		}
	}
};

export default _game;
