import { beforeAll, describe, expect, it } from 'bun:test';

import { drills, engines, parts } from '../../constants';
import { setVerbosity } from '../../utils/logger.js';

// Importing the client connects its socket; this one stays closed
globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

setVerbosity(1);

// No canvas in this DOM: a transport card simply has no asteroid preview
HTMLCanvasElement.prototype.getContext = () => null;

const quiet = { info() {}, warning() {}, warn() {}, error() {}, debug() {} };

let gameContext;
let SpacecoDialog;
let Game;

beforeAll(async () => {
	({ default: gameContext } = await import('../shared/gameContext'));
	({ default: SpacecoDialog } = await import('./SpacecoDialog'));
	({ default: Game } = await import('../../server/Game.js'));
});

// A server game with one rig beside the outpost, and a client context that sees exactly what the server sends
const outfit = patch => {
	const server = { games: {}, url: 'http://test', logger: quiet, socketBroadcast() {} };
	const game = new Game({ server, logger: quiet, worldName: 'L1: Training Shallows' });
	const { id } = game.addPlayer('Buyer');

	game.world.spaceco.xp = 12345;
	game.players.update(id, _ => ({ ..._, position: { ...game.world.spaceco.position }, credits: 100000, ...patch }));
	game.updatePlayerConfiguration(id);

	const player = game.players.get(id);
	gameContext.serverState = JSON.parse(JSON.stringify(game.toClient()));
	gameContext.playerId = id;
	gameContext.players.clear();
	gameContext.players.set(id, JSON.parse(JSON.stringify(player)));

	return { game, id, player };
};

const render = async view => {
	const dialog = new SpacecoDialog({ view });
	await new Promise(resolve => setTimeout(resolve));
	return dialog.elem;
};

const amountIn = element => Number(element.querySelector('.amount').textContent.replaceAll(',', ''));
const cardNamed = (root, name) =>
	[...root.querySelectorAll('.card-header')].find(header => header.textContent.includes(name)).parentElement;

describe('SpaceCo previews against the server', () => {
	it('quotes a repair at what the server charges', async () => {
		const { game, id, player } = outfit({ health: 1 });
		const root = await render('repair');
		const button = [...root.querySelectorAll('button')].find(b => b.textContent.includes('Repair fully'));

		const quoted = amountIn(button);
		expect(game.spacecoRepair(id, undefined, 'player').success).toBe(true);

		expect(quoted).toBe(player.credits - game.players.get(id).credits);
	});

	it('quotes a transport at the scaled fare the server charges', async () => {
		const { game, id, player } = outfit();
		game.world.spaceco.hull.white = 1000;
		gameContext.serverState.world.spaceco.hull.white = 1000;
		const root = await render('transport');
		const card = cardNamed(root, 'L2: Surface Prospects');

		const quoted = amountIn(card.querySelector('.card-footer'));
		expect(card.getAttribute('aria-disabled')).toBeNull();
		expect(game.spacecoBuyTransport(id, 'L2: Surface Prospects').success).toBe(true);

		expect(quoted).toBe(player.credits - game.players.get(id).credits);
	});

	it('locks a transport on its Galactic Market Share requirement, not on a hull entry named xp', async () => {
		outfit();
		const root = await render('transport');
		const gated = Object.values(gameContext.serverState.world.transports).find(({ requirements }) =>
			requirements?.some(([key]) => key === 'xp'),
		);
		const name = Object.keys(gameContext.serverState.world.transports).find(
			key => gameContext.serverState.world.transports[key] === gated,
		);

		expect(gated).toBeDefined();
		expect(cardNamed(root, name).getAttribute('aria-disabled')).toBe('true');
		expect(cardNamed(root, name).textContent).toContain('Galactic Market Share');
	});

	it('offers a drill when the engine and the part together meet its torque', async () => {
		// A drill whose torque bar an engine alone misses and a part closes
		const fit = Object.entries(drills).flatMap(([drillId, drill]) => {
			const required = drill.requirements?.find(([key]) => key === 'torque')?.[1];
			if (!required) return [];

			return Object.entries(engines).flatMap(([engineId, engine]) =>
				Object.entries(parts)
					.filter(([, { torque = 0 }]) => engine.torque < required && engine.torque + torque >= required)
					.map(([partId]) => ({ drillId, drill, engineId, partId })),
			);
		})[0];

		expect(fit).toBeDefined();
		const { drillId, drill, engineId, partId } = fit;

		const { game, id } = outfit({ configuration: { vehicle: 'T1', drill: 'T1', engine: engineId, part: partId } });
		game.world.spaceco.drills.push(drillId);
		gameContext.serverState.world.spaceco.drills.push(drillId);
		gameContext.players.set(id, JSON.parse(JSON.stringify(game.players.get(id))));

		const root = await render('upgrade_Drills');

		expect(cardNamed(root, drill.name).getAttribute('aria-disabled')).toBeNull();
		expect(game.spacecoBuyUpgrade(id, drillId, 'drills').success).toBe(true);
	});
});
