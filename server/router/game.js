import requestMatch from '../../byod-web-game/server/requestMatch';
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

	match = requestMatch('POST', '/games/:gameId/:playerId/move', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { path } = body;
		if (!Array.isArray(path)) {
			serverLog.warning('Validation: Invalid movement path format', {
				gameId,
				playerId,
				pathType: typeof path,
				pathValue: path,
				userAgent: request.headers.get('User-Agent'),
			});
			return Response.json({ message: 'Path must be an array' }, { status: 400 });
		}

		// Use atomic check-and-set to prevent race conditions
		const game = server.games[gameId];
		const player = game.players.get(playerId);

		if (!player) {
			return Response.json({ message: 'Player not found' }, { status: 404 });
		}

		// Try to atomically set moving state to prevent concurrent movements
		if (player.moving) {
			return Response.json(
				{ message: `SpaceCo regulations prohibit abrupt rerouting mid-tunnel. Wait until you've stopped.` },
				{ status: 400 },
			);
		}

		// Set moving state immediately to prevent race conditions
		game.players.update(playerId, current => ({ ...current, moving: true }));

		try {
			game.movePlayer(playerId, path);
		} catch (moveError) {
			// Reset moving state if movement fails
			game.players.update(playerId, current => ({ ...current, moving: false }));
			gameLog.error('Movement error', { playerId, gameId, error: moveError.message });
			return Response.json({ message: 'Movement failed. Please try again.' }, { status: 500 });
		}

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/sellitem', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { item, count = 1 } = body;

		// Validate request body
		if (!item || typeof item !== 'string') {
			return Response.json({ message: 'Invalid item specified' }, { status: 400 });
		}

		if (!Number.isInteger(count) || count < 1 || count > 100) {
			return Response.json({ message: 'Invalid quantity specified' }, { status: 400 });
		}

		const result = server.games[gameId].spacecoSellItem(playerId, item, count);

		if (!result.success) {
			const errorMessages = {
				'Player not found': 'Contractor credentials invalid',
				'Invalid item': 'Item not recognized by SpaceCo systems',
				'Insufficient items': 'Insufficient items in inventory',
			};

			const message = errorMessages[result.error] || 'Transaction failed';
			return Response.json({ message }, { status: 400 });
		}

		return Response.json({ success: true }, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/sell', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		server.games[gameId].spacecoSell(playerId);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/refuel', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { amount } = body;
		if (typeof amount !== 'number' || amount <= 0) {
			serverLog.warning('Validation: Invalid refuel amount', {
				gameId,
				playerId,
				amount,
				amountType: typeof amount,
			});
			return Response.json({ message: 'Invalid amount specified' }, { status: 400 });
		}

		server.games[gameId].spacecoRefuel(playerId, amount);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/repair', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { amount, type } = body;
		if (typeof amount !== 'number' || amount <= 0) {
			return Response.json({ message: 'Invalid repair amount specified' }, { status: 400 });
		}
		if (!type || (type !== 'player' && type !== 'outpost')) {
			return Response.json({ message: 'Invalid repair type specified' }, { status: 400 });
		}
		try {
			const result = server.games[gameId].spacecoRepair(playerId, amount, type);

			if (result && !result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({}, { status: 200 });
		} catch (repairError) {
			gameLog.error('Repair error', { playerId, gameId, error: repairError.message });
			return Response.json({ message: 'Repair system malfunction. Please try again.' }, { status: 500 });
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/item', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { item, count = 1 } = body;

		// Validate request body
		if (!item || typeof item !== 'string') {
			return Response.json({ message: 'Invalid item specified' }, { status: 400 });
		}

		if (!Number.isInteger(count) || count < 1 || count > 100) {
			return Response.json({ message: 'Invalid quantity specified' }, { status: 400 });
		}

		try {
			const result = server.games[gameId].spacecoBuyItem(playerId, item, count);

			if (!result.success) {
				const errorMessages = {
					'Player not found': 'Contractor credentials invalid',
					'Invalid item': 'Requested item not recognized by SpaceCo systems',
					'Item not available': 'Item temporarily out of stock at this outpost',
					'Insufficient stock': 'Insufficient inventory remaining',
					'Insufficient credits': 'Insufficient funds for this transaction',
					'Insufficient inventory space': 'Inventory slots full - upgrade storage capacity or use items',
				};

				const message = errorMessages[result.error] || 'Transaction failed';
				const statusCode = result.error === 'Insufficient credits' ? 402 : 400;

				return Response.json({ message }, { status: statusCode });
			}

			return Response.json({ success: true }, { status: 200 });
		} catch (buyError) {
			gameLog.error('Buy item error', { playerId, gameId, item, count, error: buyError.message });
			return Response.json({ message: 'Purchase system malfunction. Please try again.' }, { status: 500 });
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/upgrade', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { upgrade, type } = body;

		const result = server.games[gameId].spacecoBuyUpgrade(playerId, upgrade, type);

		if (result && !result.success) {
			return Response.json({ message: result.error }, { status: 400 });
		}

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/rescue', request);
	if (match) {
		const { game, gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const player = game.players.get(playerId);

		const rescueCost = 50 + game.world.spaceco.xp / 1000;

		// Log the rescue operation for audit purposes
		playerLog.info('Player rescued by SpaceCo', {
			playerId,
			gameId,
			cost: rescueCost,
			playerCredits: player.credits,
			rescuePosition: game.world.spaceco.position,
			emergencyTeleportsTotal: player.stats.emergencyTeleports + 1,
		});

		const updates = {
			position: game.world.spaceco.position,
			stats: {
				...player.stats,
				emergencyTeleports: player.stats.emergencyTeleports + 1,
			},
			credits: player.credits - rescueCost,
		};
		game.players.update(playerId, _ => ({ ..._, ...updates }));
		game.broadcast('useItem', { playerId, updates, item: 'spaceco_teleporter' });
		game.broadcast('spacecoRescue', { playerId });

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/spaceco/transport', request);
	if (match) {
		const { game, gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { world } = body;

		// Validate world exists
		if (!world || typeof world !== 'string') {
			serverLog.warning('Validation: Invalid world selection', {
				gameId,
				playerId,
				world,
				worldType: typeof world,
			});
			return Response.json({ message: 'Invalid world selection for transport request.' }, { status: 400 });
		}
		const player = game.players.get(playerId);
		const targetWorld = Object.keys(game.world.transports).find(w => w === world);

		if (!targetWorld) {
			return Response.json({ message: 'Requested destination not available from current asteroid.' }, { status: 400 });
		}

		const transportCost = Math.floor(game.world.transports[world].price * (1.0 + game.world.spaceco.xp / 200000));

		if (player.credits < transportCost) {
			return Response.json(
				{ message: `Insufficient credits for transport. Required: ${transportCost}, Available: ${player.credits}` },
				{ status: 400 },
			);
		}

		// Check requirements
		const requirementsMet = game.world.transports[world].requirements.every(([requirementType, amount]) => {
			if (requirementType === 'xp') {
				return game.world.spaceco.xp >= amount;
			} else {
				return (game.world.spaceco.hull[requirementType] || 0) >= amount;
			}
		});

		if (!requirementsMet) {
			return Response.json({ message: 'Transport requirements not met for selected destination.' }, { status: 400 });
		}

		try {
			server.games[gameId].spacecoBuyTransport(playerId, world);
			return Response.json({}, { status: 200 });
		} catch (transportError) {
			gameLog.error('Transport error', { playerId, gameId, error: transportError.message });
			return Response.json({ message: 'Transport system malfunction. Please try again.' }, { status: 500 });
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/useItem', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { item } = body;

		if (item === 'spaceco_teleport_station') {
			const validation = server.games[gameId].validateSpacecoTeleportStation(playerId);
			if (!validation.success) {
				return Response.json({ message: validation.error }, { status: 400 });
			}
		}

		server.games[gameId].useItem(playerId, item);

		return Response.json({}, { status: 200 });
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/trade', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { targetPlayerId, offer, request: tradeRequest } = body;

		// Validate request body
		if (!targetPlayerId || !offer || !tradeRequest) {
			return Response.json({ message: 'Invalid trade parameters' }, { status: 400 });
		}

		// Validate trade structure
		const validateTradeItems = items => {
			if (
				!items.credits &&
				(!items.items || Object.keys(items.items).length === 0) &&
				(!items.minerals || Object.keys(items.minerals).length === 0)
			) {
				return false;
			}
			return true;
		};

		if (!validateTradeItems(offer) && !validateTradeItems(tradeRequest)) {
			return Response.json({ message: 'Trade must include at least one item from each party' }, { status: 400 });
		}

		try {
			const result = server.games[gameId].initiateTrade(playerId, targetPlayerId, offer, tradeRequest);

			if (!result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({ tradeId: result.tradeId }, { status: 200 });
		} catch (tradeError) {
			gameLog.error('Trade initiation error', { playerId, gameId, error: tradeError.message });
			return Response.json({ message: 'Trade system error. Please try again.' }, { status: 500 });
		}
	}

	match = requestMatch('POST', '/games/:gameId/:playerId/trade/:tradeId/respond', request);
	if (match) {
		const { gameId, playerId, tradeId, error } = {
			...validateGameMatch(match, server, request),
			tradeId: match.tradeId,
		};

		if (error) return error;

		const { body, error: parseError } = await parseRequestBody(request);
		if (parseError) return parseError;

		const { accept } = body;

		if (typeof accept !== 'boolean') {
			return Response.json({ message: 'Invalid response - must specify accept as true or false' }, { status: 400 });
		}

		try {
			const result = server.games[gameId].respondToTrade(playerId, tradeId, accept);

			if (!result.success) {
				return Response.json({ message: result.error }, { status: 400 });
			}

			return Response.json({ success: true }, { status: 200 });
		} catch (tradeError) {
			gameLog.error('Trade response error', { playerId, gameId, error: tradeError.message });
			return Response.json({ message: 'Trade system error. Please try again.' }, { status: 500 });
		}
	}

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

	match = requestMatch('POST', '/games/:gameId/:playerId/fix-movement', request);
	if (match) {
		const { gameId, playerId, error } = validateGameMatch(match, server, request);

		if (error) return error;

		try {
			const game = server.games[gameId];
			const player = game.players.get(playerId);

			if (!player) {
				return Response.json({ message: 'Player not found' }, { status: 404 });
			}

			// Clear movement state and timeout
			if (player._movementTimeout) {
				clearTimeout(player._movementTimeout);
			}

			game.players.update(playerId, current => ({
				...current,
				moving: false,
				_movementTimeout: null,
				_lastMoveTime: null,
			}));

			playerLog.info('Fixed stuck movement state', { playerId });

			// Broadcast the fix to all clients
			game.broadcast('updatePlayer', {
				playerId,
				updates: { moving: false },
			});

			return Response.json(
				{
					success: true,
					message: 'Movement state fixed successfully',
				},
				{ status: 200 },
			);
		} catch (fixError) {
			gameLog.error('Movement fix error', { playerId, error: fixError.message });
			return Response.json(
				{
					message: 'Movement fix system error. Please try again.',
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
			server.games[gameId].disarmBomb(playerId, { x, y });
			return Response.json({}, { status: 200 });
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
			server.games[gameId].deactivateTeleporter(playerId, { x, y });
			return Response.json({}, { status: 200 });
		} catch (deactivateError) {
			gameLog.error('Teleporter deactivate error', { playerId, gameId, position: { x, y }, error: deactivateError.message });
			return Response.json({ message: 'Teleporter deactivate system error. Please try again.' }, { status: 500 });
		}
	}
};

export default _game;
