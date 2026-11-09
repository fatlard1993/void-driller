import { requestMatch } from '@vanilla-bean/components/app';
import { serverLog, gameLog, playerLog } from '../../utils/logger.js';

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

};

export default _game;
