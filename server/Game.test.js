import { describe, expect, test } from 'bun:test';

import { playerAchievements, spacecoAchievements } from '../constants/index.js';
import { setVerbosity } from '../utils/logger.js';
import Game from './Game.js';

// The game logs every step at the dev verbosity; the tests read their own assertions
setVerbosity(1);

const quiet = { info() {}, warning() {}, warn() {}, error() {}, debug() {} };

// A game on L1 with one player standing on the outpost, every broadcast kept
const outfit = (saveState = {}) => {
	const sent = [];
	const server = { games: {}, url: 'http://test', logger: quiet, socketBroadcast: data => sent.push(data) };
	const game = new Game({ server, logger: quiet, worldName: 'L1: Training Shallows', saveState });

	return { game, sent };
};

const playerAtOutpost = game => {
	const player = game.addPlayer('Driller');

	game.players.update(player.id, _ => ({ ..._, position: { ...game.world.spaceco.position } }));

	return game.players.get(player.id);
};

describe('Game', () => {
	test('a game restored mid-path starts with every rig stopped', () => {
		const { game: source } = outfit();
		const { id } = source.addPlayer('Stuck');

		source.players.update(id, _ => ({ ..._, moving: true, _movementSessionId: 42 }));

		const { game } = outfit(JSON.parse(JSON.stringify(source.toSaveState())));

		expect(game.players.get(id).moving).toBe(false);
		expect(game.players.get(id)._movementSessionId).toBeNull();
	});

	test('an item is used only when held, and only when it does something by hand', () => {
		const { game } = outfit();
		const { id } = playerAtOutpost(game);

		expect(game.useItem(id, 'repair_nanites').success).toBe(false);
		expect(game.useItem(id, 'detonator_3_3').success).toBe(false);
		expect(game.useItem(id, undefined).success).toBe(false);

		game.players.update(id, _ => ({ ..._, items: { ..._.items, transport_insurance: 1 }, fuel: 1 }));
		expect(game.useItem(id, 'transport_insurance').success).toBe(false);
		expect(game.players.get(id).items.transport_insurance).toBe(1);

		expect(game.useItem(id, 'oil').success).toBe(true);
		expect(game.players.get(id).items.oil).toBe(0);
		expect(game.players.get(id).fuel).toBe(Math.min(game.players.get(id).maxFuel, 1 + 15));
	});

	test('a trade offer is whole and non-negative, and never with oneself', () => {
		const { game } = outfit();
		const { id } = playerAtOutpost(game);
		const player = game.players.get(id);

		expect(game.validateTradeResources(player, { credits: -5 }).valid).toBe(false);
		expect(game.validateTradeResources(player, { items: { oil: 1.5 } }).valid).toBe(false);
		expect(game.validateTradeResources(player, { items: { oil: 2 } }).valid).toBe(false);
		expect(game.validateTradeResources(player, { items: { oil: 1 } }).valid).toBe(true);
		expect(game.initiateTrade(id, id).success).toBe(false);
	});

	test('SpaceCo serves a rig beside the outpost and refuses one away from it', () => {
		const { game } = outfit();
		const { id } = playerAtOutpost(game);

		expect(game.spacecoPatron(id).player.id).toBe(id);

		game.players.update(id, _ => ({ ..._, position: { x: _.position.x + 2, y: _.position.y } }));

		expect(game.spacecoPatron(id).error.error).toMatch(/at the SpaceCo outpost/);
		expect(game.spacecoRefuel(id, 10).success).toBe(false);
	});

	test('a rescue costs the fare, stops the path and lands at the outpost', () => {
		const { game, sent } = outfit();
		const { id } = game.addPlayer('Stranded');
		const { position } = game.world.spaceco;

		game.players.update(id, _ => ({ ..._, position: { x: position.x + 3, y: position.y + 3 }, credits: 0 }));
		expect(game.spacecoRescue(id).success).toBe(false);

		game.players.update(id, _ => ({ ..._, credits: 1000, moving: true, _movementSessionId: 7 }));
		expect(game.spacecoRescue(id).success).toBe(true);

		const rescued = game.players.get(id);

		expect(rescued.position).toEqual(position);
		expect(rescued.moving).toBe(false);
		expect(rescued.credits).toBeLessThan(1000);
		expect(sent.some(({ update }) => update === 'spacecoRescue')).toBe(true);
	});

	test('the exit flush lands the pending save, and a deleted game stops every path and goes quiet', () => {
		const writes = [];
		const sent = [];
		const server = {
			games: {},
			url: 'http://test',
			logger: quiet,
			socketBroadcast: data => sent.push(data),
			database: { collections: { games: { create() {}, set: ({ data }) => writes.push(data) } } },
		};
		const game = new Game({ server, logger: quiet, worldName: 'L1: Training Shallows' });
		const { id } = game.addPlayer('Leaving');

		game.save();
		const before = writes.length;

		game.saveNow();
		expect(writes.length).toBe(before + 1);

		game.players.update(id, _ => ({ ..._, moving: true, _movementSessionId: 1 }));
		game.dispose();

		expect(game.players.get(id).moving).toBe(false);

		const heard = sent.length;

		game.broadcast('playerMove', { player: game.players.get(id) });
		game.save();
		expect(sent.length).toBe(heard);
		expect(writes.length).toBe(before + 1);
	});

	test('a path with a two-cell jump is refused before any step is taken', () => {
		const { game, sent } = outfit();
		const { id } = playerAtOutpost(game);
		const { position } = game.players.get(id);

		game.movePlayer(id, [{ x: position.x + 2, y: position.y }]);

		expect(sent.at(-1).update).toBe('invalidMovement');
		expect(game.players.get(id).position).toEqual(position);
		expect(game.players.get(id).moving).toBe(false);
	});

	test('every achievement trigger names an event the server emits', async () => {
		const source = (
			await Promise.all(['Game.js', 'effects.js'].map(file => Bun.file(`${import.meta.dir}/${file}`).text()))
		).join('\n');
		const emitted = new Set(
			[...source.matchAll(/(?:broadcast|broadcastWithSpacecoState)\(\s*'([A-Za-z_]+)'|update: '([A-Za-z_]+)'/g)].map(
				match => match[1] || match[2],
			),
		);
		emitted.delete('spaceco'); // the carrier whose update field names the event

		const triggers = [...playerAchievements, ...spacecoAchievements].flatMap(({ id, trigger }) =>
			[].concat(trigger.type).map(type => ({ id, type })),
		);
		const dead = triggers.filter(({ type }) => !emitted.has(type));

		expect(dead).toEqual([]);
	});

	test('SpaceCo stocks up once per new head count, not once per join', () => {
		const { game } = outfit();
		const shop = { ...game.world.spaceco.shop };
		const listed = game.world.spaceco.vehicles.length;

		const first = game.addPlayer('One');
		game.addPlayer('Two');
		const third = game.addPlayer('Three');

		Object.entries(shop).forEach(([item, stock]) => {
			if (stock > 0) expect(game.world.spaceco.shop[item]).toBe(stock + 2);
		});
		expect(game.world.spaceco.vehicles.length).toBe(listed + 1);

		// A rejoin at the same head count, and a leave, change nothing
		game.removePlayer(third.id);
		game.addPlayer('Three again');
		game.removePlayer(first.id);

		Object.entries(shop).forEach(([item, stock]) => {
			if (stock > 0) expect(game.world.spaceco.shop[item]).toBe(stock + 2);
		});
		expect(game.world.spaceco.vehicles.length).toBe(listed + 1);
	});
});
