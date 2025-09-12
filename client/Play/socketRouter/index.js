import gameContext from '../../shared/gameContext';
import { socketLog } from '../../../utils/logger.js';

import player from './player';
import spaceco from './spaceco';
import world from './world';

// Validation helper functions
const validateMessage = data => {
	// Basic structure validation
	if (!data || typeof data !== 'object') {
		socketLog(1)('Invalid socket message: not an object', { data });
		return false;
	}

	// Required fields
	if (!data.id || !data.update) {
		socketLog(1)('Invalid socket message: missing required fields (id, update)', { data });
		return false;
	}

	// Game ID validation
	if (data.id !== gameContext.gameId) {
		return false; // Not for this game, silently ignore
	}

	return true;
};

const validatePlayerMessage = data => {
	// Player-specific message validation
	if (data.playerId && typeof data.playerId !== 'string') {
		socketLog(1)('Invalid player message: playerId must be string', { data, playerId: data.playerId });
		return false;
	}

	// Validate position updates
	if (data.player?.position) {
		const pos = data.player.position;
		if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
			socketLog(1)('Invalid player message: invalid position data', { data, position: data.player?.position });
			return false;
		}
	}

	// Validate numeric stats
	if (data.player) {
		const numericFields = ['health', 'fuel', 'cargo', 'credits'];
		for (const field of numericFields) {
			if (data.player[field] !== undefined) {
				if (typeof data.player[field] !== 'number' || !Number.isFinite(data.player[field])) {
					socketLog(1)(`Invalid player message: ${field} must be finite number`, {
						data,
						field,
						value: data.player[field],
					});
					return false;
				}
			}
		}
	}

	return true;
};

const validateWorldMessage = data => {
	// World-specific message validation
	if (data.position) {
		const pos = data.position;
		if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
			socketLog(1)('Invalid world message: invalid position data', { data, position: data.position });
			return false;
		}
	}

	return true;
};

export default data => {
	if (!validateMessage(data)) return;

	// Apply specific validation based on message type
	const playerUpdates = [
		'playerMove',
		'addPlayer',
		'removePlayer',
		'hurtPlayers',
		'useItem',
		'playerFall',
		'updatePlayer',
		'achievement',
		'playerCantMove',
		'playerMovementComplete',
		'playerMovementInterrupted',
		'playerMovementError',
	];
	const worldUpdates = [
		'dissipateGas',
		'spillLava',
		'alien_wake',
		'alien_sleep',
		'alien_attack',
		'alien_message',
		'alien_move',
		'alien_spawn',
		'explodeBomb',
		'explodeImplosion',
		'groundEffect',
	];

	if (playerUpdates.includes(data.update) && !validatePlayerMessage(data)) return;
	if (worldUpdates.includes(data.update) && !validateWorldMessage(data)) return;
	// SpaceCo updates use basic validation exclusively

	if (player(data)) return;
	if (spaceco(data)) return;
	if (world(data)) return;
};
