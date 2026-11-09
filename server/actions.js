import { refuse } from '@fatlard1993/web-game-framework';

import { drills, engines, items, parts, vehicles } from '../constants';
import { gameLog } from '../utils/logger.js';

// What arrived as an action's data, as an object to read fields from: anything else reads as no fields
const fields = data => (data && typeof data === 'object' && !Array.isArray(data) ? data : {});

// A game method's { success: false, error } is the player's refusal
const answered = result => {
	if (result?.success === false) refuse(result.error || 'SpaceCo declined the request.');

	return result;
};

const upgrades = { vehicles, drills, engines, parts };

const isCell = step => Number.isInteger(step?.x) && Number.isInteger(step?.y);

// An item SpaceCo knows by that name (not one an object has by default, like toString)
const itemNamed = item => {
	if (typeof item !== 'string' || !Object.hasOwn(items, item)) refuse('Invalid item specified.');

	return item;
};

// A cell named by its whole-number x and y
const cell = data => {
	const { x, y } = fields(data);

	if (!isCell({ x, y })) refuse('Position coordinates (x, y) are required.');

	return { x, y };
};

const quantity = (count = 1) => {
	if (!Number.isInteger(count) || count < 1 || count > 100) refuse('Invalid quantity specified.');

	return count;
};

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

	spacecoSell(player) {
		answered(this.spacecoSell(player.id));
	},

	spacecoSellItem(player, data) {
		const { item, count } = fields(data);

		answered(this.spacecoSellItem(player.id, itemNamed(item), quantity(count)));
	},

	spacecoRefuel(player, data) {
		const { amount } = fields(data);

		if (!Number.isFinite(amount) || amount <= 0) refuse('Invalid amount specified.');

		answered(this.spacecoRefuel(player.id, amount));
	},

	spacecoRepair(player, data) {
		const { amount, type } = fields(data);

		if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) refuse('Invalid repair amount specified.');
		if (type !== 'player' && type !== 'outpost') refuse('Invalid repair type specified.');

		answered(this.spacecoRepair(player.id, amount, type));
	},

	spacecoResupply(player) {
		answered(this.spacecoResupply(player.id));
	},

	spacecoBuyItem(player, data) {
		const { item, count } = fields(data);

		answered(this.spacecoBuyItem(player.id, itemNamed(item), quantity(count)));
	},

	spacecoBuyUpgrade(player, data) {
		const { upgrade, type } = fields(data);

		if (!Object.hasOwn(upgrades, type)) refuse('Invalid upgrade category specified.');
		if (typeof upgrade !== 'string' || !Object.hasOwn(upgrades[type], upgrade)) {
			refuse('Requested upgrade not recognized by SpaceCo systems.');
		}

		answered(this.spacecoBuyUpgrade(player.id, upgrade, type));
	},

	spacecoBuyTransport(player, data) {
		const { world } = fields(data);

		// A destination this asteroid has a route to, by its own name
		if (typeof world !== 'string' || !Object.hasOwn(this.world.transports ?? {}, world)) {
			refuse('Invalid world selection for transport request.');
		}

		answered(this.spacecoBuyTransport(player.id, world));
	},

	spacecoRescue(player) {
		answered(this.spacecoRescue(player.id));
	},

	useItem(player, data) {
		const { item } = fields(data);

		if (typeof item !== 'string') refuse('Item not in inventory');

		answered(this.useItem(player.id, item));
	},

	disarmBomb(player, data) {
		answered(this.disarmBomb(player.id, cell(data)));
	},

	deactivateTeleporter(player, data) {
		answered(this.deactivateTeleporter(player.id, cell(data)));
	},

	// The dialog opens for both drillers on the tradeSessionStarted broadcast
	initiateTrade(player, data) {
		const { targetPlayerId } = fields(data);

		if (typeof targetPlayerId !== 'string') refuse('Target player ID required.');

		answered(this.initiateTrade(player.id, targetPlayerId));
	},

	updateTradeOffer(player, data) {
		const { tradeId, offer } = fields(data);

		if (typeof tradeId !== 'string') refuse('Trade not found or expired');
		if (!offer || typeof offer !== 'object') refuse('Offer required.');

		answered(this.updateTradeOffer(player.id, tradeId, offer));
	},

	acceptTrade(player, data) {
		const { tradeId } = fields(data);

		if (typeof tradeId !== 'string') refuse('Trade not found or expired');

		answered(this.acceptTrade(player.id, tradeId));
	},

	cancelTrade(player, data) {
		const { tradeId } = fields(data);

		if (typeof tradeId !== 'string') refuse('Trade not found or expired');

		answered(this.cancelTrade(player.id, tradeId));
	},
};

export { answered, fields };
