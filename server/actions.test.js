import { describe, expect, test } from 'bun:test';

import { setVerbosity } from '../utils/logger.js';
import Game from './Game.js';

setVerbosity(1);

const quiet = { info() {}, warning() {}, warn() {}, error() {}, debug() {} };

// A game on L1 whose server keeps what it broadcasts and how often it publishes
const outfit = () => {
	const sent = [];
	const published = [];
	const server = {
		games: {},
		logger: quiet,
		socketBroadcast: data => sent.push(data),
		publish: game => published.push(game.id),
	};
	const game = new Game({ server, logger: quiet, worldName: 'L1: Training Shallows' });

	return { game, sent, published };
};

const atOutpost = (game, name = 'Driller') => {
	const { id } = game.addPlayer(name);

	game.players.update(id, _ => ({ ..._, position: { ...game.world.spaceco.position } }));

	return id;
};

describe('actions', () => {
	test('an action no driller can take, or from someone not in the game, is refused', () => {
		const { game } = outfit();
		const id = atOutpost(game);

		expect(game.act(id, 'teleportAnywhere', {})).toEqual({ ok: false, error: 'No such action: teleportAnywhere' });
		expect(game.act('stranger', 'move', { path: [] }).ok).toBe(false);
		expect(game.act(id, 'toString').ok).toBe(false);
	});

	test('move refuses a malformed path and a rig already moving, and publishes a path it takes', () => {
		const { game, published } = outfit();
		const id = atOutpost(game);
		const { position } = game.players.get(id);

		for (const data of [undefined, null, 'down', { path: 'down' }, { path: [{ x: 'a', y: 1 }] }, { path: [null] }])
			expect(game.act(id, 'move', data)).toEqual({ ok: false, error: 'Path must be a list of cells.' });

		game.players.update(id, _ => ({ ..._, moving: true }));
		expect(game.act(id, 'move', { path: [{ x: position.x + 1, y: position.y }] }).error).toMatch(/mid-tunnel/);

		game.players.update(id, _ => ({ ..._, moving: false }));
		expect(game.act(id, 'move', { path: [{ x: position.x + 1, y: position.y }] })).toEqual({ ok: true });
		expect(published.length).toBeGreaterThan(0);
		game.dispose();
	});

	test("SpaceCo's sales and services refuse malformed requests and run for the page's own driller", () => {
		const { game } = outfit();
		const id = atOutpost(game);
		const other = atOutpost(game, 'Other');

		expect(game.act(id, 'spacecoSellItem', { item: 'toString' }).error).toBe('Invalid item specified.');
		expect(game.act(id, 'spacecoSellItem', { item: 'oil', count: 0 }).error).toBe('Invalid quantity specified.');
		expect(game.act(id, 'spacecoSellItem', { item: 'oil', count: 1.5 }).error).toBe('Invalid quantity specified.');
		expect(game.act(id, 'spacecoRefuel', { amount: 'lots' }).error).toBe('Invalid amount specified.');
		expect(game.act(id, 'spacecoRefuel', { amount: Infinity }).error).toBe('Invalid amount specified.');
		expect(game.act(id, 'spacecoRepair', { type: 'everything' }).error).toBe('Invalid repair type specified.');
		expect(game.act(id, 'spacecoRepair', { type: 'player', amount: -1 }).error).toBe('Invalid repair amount specified.');

		// What the game refuses comes back as the refusal, with its reason
		expect(game.act(id, 'spacecoSell').error).toBeString();
		expect(game.act(id, 'spacecoRepair', { type: 'player' }).error).toMatch(/perfect condition/);

		// A sale is the seller's: the other driller's credits don't move
		game.players.update(id, _ => ({ ..._, items: { ..._.items, oil: 2 } }));
		const credits = game.players.get(other).credits;

		expect(game.act(id, 'spacecoSellItem', { item: 'oil', count: 2 })).toEqual({ ok: true });
		expect(game.players.get(id).items.oil ?? 0).toBe(0);
		expect(game.players.get(other).credits).toBe(credits);

		game.players.update(id, _ => ({ ..._, fuel: 1, credits: 1000 }));
		expect(game.act(id, 'spacecoRefuel', { amount: 50 })).toEqual({ ok: true });
		expect(game.players.get(id).fuel).toBeGreaterThan(1);
	});

	test('SpaceCo purchases refuse what SpaceCo has no such thing as, and charge the page\'s own driller', () => {
		const { game } = outfit();
		const id = atOutpost(game);

		expect(game.act(id, 'spacecoBuyItem', { item: '__proto__' }).error).toBe('Invalid item specified.');
		expect(game.act(id, 'spacecoBuyItem', { item: 'oil', count: 101 }).error).toBe('Invalid quantity specified.');
		expect(game.act(id, 'spacecoBuyUpgrade', { type: 'constructor', upgrade: 'x' }).error).toMatch(/category/);
		expect(game.act(id, 'spacecoBuyUpgrade', { type: 'drills', upgrade: 'constructor' }).error).toMatch(/recognized/);
		expect(game.act(id, 'spacecoBuyTransport', { world: 'toString' }).error).toMatch(/Invalid world/);
		expect(game.act(id, 'spacecoBuyTransport', {}).error).toMatch(/Invalid world/);

		// Not enough credits: the game's own reason
		game.players.update(id, _ => ({ ..._, credits: 0 }));
		const [stocked] = Object.entries(game.world.spaceco.shop).find(([, stock]) => stock > 0);

		expect(game.act(id, 'spacecoBuyItem', { item: stocked }).error).toBeString();

		game.players.update(id, _ => ({ ..._, credits: 100000 }));
		const held = game.players.get(id).items[stocked] ?? 0;

		expect(game.act(id, 'spacecoBuyItem', { item: stocked })).toEqual({ ok: true });
		expect(game.players.get(id).items[stocked]).toBe(held + 1);
	});

	test("items, rescue, charges and beacons refuse malformed requests and act for the page's own driller", () => {
		const { game } = outfit();
		const id = atOutpost(game);

		expect(game.act(id, 'useItem', { item: 42 }).error).toBe('Item not in inventory');
		expect(game.act(id, 'useItem', { item: 'toString' }).error).toBe('Item not in inventory');
		expect(game.act(id, 'disarmBomb', { x: '3' }).error).toMatch(/coordinates/);
		expect(game.act(id, 'deactivateTeleporter', null).error).toMatch(/coordinates/);
		expect(game.act(id, 'disarmBomb', { x: 9999, y: 9999 }).error).toBe('No such position');
		expect(game.act(id, 'spacecoRescue').error).toBeString();

		// A charge set down is disarmed, and every detonator for it goes
		const { x, y } = game.players.get(id).position;

		game.world.grid[x][y].items.push({ name: 'remote_charge', placed: true });
		game.players.update(id, _ => ({ ..._, items: { ..._.items, [`detonator_${x}_${y}`]: 1 } }));
		expect(game.act(id, 'disarmBomb', { x, y })).toEqual({ ok: true });
		expect(game.world.grid[x][y].items.some(item => item.name === 'remote_charge')).toBe(false);
		expect(game.players.get(id).items[`detonator_${x}_${y}`]).toBeUndefined();

		game.players.update(id, _ => ({ ..._, items: { ..._.items, oil: 1 }, fuel: 1 }));
		expect(game.act(id, 'useItem', { item: 'oil' })).toEqual({ ok: true });
	});

	test('a trade is between the two drillers in it, and an offer of what no one holds is refused', () => {
		const { game } = outfit();
		const one = atOutpost(game, 'One');
		const two = atOutpost(game, 'Two');
		const three = atOutpost(game, 'Three');

		expect(game.act(one, 'initiateTrade', {}).error).toMatch(/Target player/);
		expect(game.act(one, 'initiateTrade', { targetPlayerId: one }).error).toMatch(/yourself/);
		expect(game.act(one, 'initiateTrade', { targetPlayerId: two })).toEqual({ ok: true });

		const [{ id: tradeId }] = game.activeTrades.values();

		expect(game.act(one, 'updateTradeOffer', { tradeId, offer: 'everything' }).error).toBe('Offer required.');
		expect(game.act(one, 'updateTradeOffer', { tradeId, offer: { items: { toString: 1 } } }).error).toMatch(
			/Insufficient toString/,
		);
		expect(
			game.act(one, 'updateTradeOffer', { tradeId, offer: JSON.parse('{"items":{"__proto__":1}}') }).error,
		).toMatch(/Insufficient __proto__/);
		expect(game.act(three, 'acceptTrade', { tradeId }).error).toMatch(/not part of this trade/);
		expect(game.act(three, 'cancelTrade', { tradeId }).ok).toBe(false);

		game.players.update(one, _ => ({ ..._, credits: 50 }));
		const before = game.players.get(two).credits;

		expect(game.act(one, 'updateTradeOffer', { tradeId, offer: { credits: 20 } })).toEqual({ ok: true });
		expect(game.act(one, 'acceptTrade', { tradeId })).toEqual({ ok: true });
		expect(game.act(two, 'acceptTrade', { tradeId })).toEqual({ ok: true });
		// Twenty went across (a first trade's achievement pays both the same on top)
		const oneGained = game.players.get(one).credits - 50;
		const twoGained = game.players.get(two).credits - before;

		expect(twoGained - oneGained).toBe(40);
		expect(game.players.get(one).stats.tradesCompleted).toBe(1);
		expect(game.activeTrades.size).toBe(0);
	});

	test("repairPosition puts back only the page's own rig, and only when it's lost; a save with one lost loads it put back", () => {
		const { game, sent } = outfit();
		const id = atOutpost(game, 'Lost');
		const other = atOutpost(game, 'Fine');
		const { position } = game.players.get(other);

		game.players.update(id, _ => ({ ..._, position: { x: null, y: undefined } }));
		expect(game.act(other, 'repairPosition')).toEqual({ ok: true });
		expect(game.players.get(other).position).toEqual(position);
		expect(game.players.get(id).position.x).toBeNull();

		expect(game.act(id, 'repairPosition')).toEqual({ ok: true });
		expect(Number.isInteger(game.players.get(id).position.x)).toBe(true);
		expect(sent.at(-1)).toMatchObject({ update: 'updatePlayer', playerId: id });

		game.players.update(id, _ => ({ ..._, position: null }));
		const back = new Game({
			server: { games: {}, logger: quiet, socketBroadcast() {} },
			logger: quiet,
			saveState: JSON.parse(JSON.stringify(game.toSaveState())),
		});

		expect(Number.isInteger(back.players.get(id).position.y)).toBe(true);
	});
});
