/**
 * Generic socket message validation utilities for multiplayer games
 */
import { socketLog } from '../../utils/logger.js';

/**
 * Validates basic socket message structure
 * @param {object} data - The socket message data
 * @param {string} gameId - Expected game ID
 * @returns {boolean} Whether the message is valid
 */
export const validateMessage = (data, gameId) => {
	// Basic structure validation
	if (!data || typeof data !== 'object') {
		socketLog(2)('Invalid socket message: not an object', { data });
		return false;
	}

	// Required fields
	if (!data.id || !data.update) {
		socketLog(2)('Invalid socket message: missing required fields', {
			data,
			hasId: !!data.id,
			hasUpdate: !!data.update,
		});
		return false;
	}

	// Game ID validation
	if (data.id !== gameId) {
		return false; // Not for this game, silently ignore
	}

	return true;
};

/**
 * Validates player-specific socket messages
 * @param {object} data - The socket message data
 * @returns {boolean} Whether the player message is valid
 */
export const validatePlayerMessage = data => {
	// Player-specific message validation
	if (data.playerId && typeof data.playerId !== 'string') {
		socketLog(2)('Invalid player message: playerId must be string', {
			data,
			playerId: data.playerId,
			type: typeof data.playerId,
		});
		return false;
	}

	// Validate position updates if present
	if (data.player?.position) {
		const pos = data.player.position;
		if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
			socketLog(2)('Invalid player message: invalid position data', { data, position: data.player?.position });
			return false;
		}
	}

	// Validate numeric stats if present
	if (data.player) {
		const numericFields = ['health', 'fuel', 'cargo', 'credits'];
		for (const field of numericFields) {
			if (data.player[field] !== undefined) {
				if (typeof data.player[field] !== 'number' || !Number.isFinite(data.player[field])) {
					socketLog(2)(`Invalid player message: ${field} must be finite number`, {
						data,
						field,
						value: data.player[field],
						type: typeof data.player[field],
					});
					return false;
				}
			}
		}
	}

	return true;
};

/**
 * Validates position data in socket messages
 * @param {object} data - The socket message data
 * @returns {boolean} Whether the position data is valid
 */
export const validatePositionMessage = data => {
	if (data.position) {
		const pos = data.position;
		if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
			socketLog(2)('Invalid message: invalid position data', { data, position: data.position });
			return false;
		}
	}
	return true;
};

/**
 * Creates a message validator function bound to a specific game ID
 * @param {string} gameId - The game ID to check against
 * @returns {Function} Validator function
 */
export const createMessageValidator = gameId => {
	return data => validateMessage(data, gameId);
};
