import { refuse } from '@fatlard1993/web-game-framework';

import { gameLog } from '../utils/logger.js';

// What arrived as an action's data, as an object to read fields from: anything else reads as no fields
const fields = data => (data && typeof data === 'object' && !Array.isArray(data) ? data : {});

// A game method's { success: false, error } is the player's refusal
const answered = result => {
	if (result?.success === false) refuse(result.error || 'SpaceCo declined the request.');

	return result;
};

const isCell = step => Number.isInteger(step?.x) && Number.isInteger(step?.y);

/**
 * What a driller does, from their page: act('move', { path }) and the rest. Each runs with `this` the game and `player`
 * the page's own (the framework binds it, a message can't name another); refuse() answers the page with why, and
 * every page is sent its view after.
 */
export default {
	move(player, data) {
		const { path } = fields(data);

		if (!Array.isArray(path) || !path.every(isCell)) refuse('Path must be a list of cells.');
		if (player.moving) refuse(`SpaceCo regulations prohibit abrupt rerouting mid-tunnel. Wait until you've stopped.`);

		// Moving from here on, so a second path sent before the first step lands is refused above
		this.players.update(player.id, current => ({ ...current, moving: true }));

		try {
			this.movePlayer(player.id, path);
		} catch (error) {
			this.players.update(player.id, current => ({ ...current, moving: false }));
			gameLog.error('Movement error', { playerId: player.id, gameId: this.id, error: error.message });
			refuse('Movement failed. Please try again.');
		}
	},
};

export { answered, fields };
