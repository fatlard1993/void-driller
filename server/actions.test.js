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
});
