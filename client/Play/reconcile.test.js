import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

// Phaser needs a real canvas; the decisions under test are about the fetched state, not the drawing
mock.module('phaser', () => {
	const Phaser = new Proxy(class {}, { get: (target, key) => (key in target ? target[key] : Phaser) });

	return { default: Phaser };
});

globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

// One answer, or a queue of answers served in turn (the last one repeats)
let served;
let fetches = 0;
let onFetch = () => {};
// The app's api as it is, with getGame answering from the queue below
const api = await import('../api');
mock.module('../api', () => ({
	...api,
	getGame: async () => {
		fetches++;
		onFetch(fetches);
		await new Promise(resolve => setTimeout(resolve, 0));
		if (!Array.isArray(served)) return served;
		return served.length > 1 ? served.shift() : served[0];
	},
}));

let gameContext;
let refetchGame;
let patience;

beforeAll(async () => {
	({ default: gameContext } = await import('../shared/gameContext'));
	({ refetchGame, patience } = await import('./reconcile'));
	patience.wait = 0;
	patience.tries = 4;
});

const notFound = { status: 'error', response: { status: 404 } };
const world = (name = 'L1') => ({ name, grid: [], spaceco: { position: { x: 1, y: 1 }, health: 9 }, transports: {} });

const arrange = ({ watch = false, playerId = 'me', here = 'L1' } = {}) => {
	window.location.hash = '#/play/g1';
	localStorage.setItem('g1', 'me');
	Object.assign(gameContext, {
		gameId: 'g1',
		playerId: watch ? null : playerId,
		isWatchMode: watch,
		game: {},
		serverState: { world: world(here), players: [] },
		sceneLayers: {},
	});
	gameContext.players.clear();
	gameContext.scene = {
		rebuilt: null,
		rebuildWorld(state) {
			this.rebuilt = state;
		},
	};
	fetches = 0;
	onFetch = () => {};
};

afterEach(() => {
	gameContext.isWatchMode = false;
	gameContext.scene = null;
});

describe('refetchGame', () => {
	it('sends a player whose contract is gone to the hub and forgets their id, after the retries', async () => {
		arrange();
		served = notFound;

		await refetchGame();

		expect(window.location.hash).toBe('#/hub');
		expect(localStorage.getItem('g1')).toBeNull();
		expect(fetches).toBe(4);
	});

	it('waits out the window where a restarted server has not loaded its games yet', async () => {
		arrange();
		const players = [{ id: 'me', name: 'Ada', position: { x: 2, y: 2 } }];
		served = [notFound, notFound, { status: 'success', body: { world: world('L2'), players } }];

		await refetchGame();

		expect(window.location.hash).toBe('#/play/g1');
		expect(localStorage.getItem('g1')).toBe('me');
		expect(fetches).toBe(3);
		expect(gameContext.scene.rebuilt.players).toBe(players);
	});

	it('drops an answer that arrives after the player has left the game', async () => {
		arrange();
		served = [notFound, notFound, notFound];
		onFetch = count => {
			if (count === 2) gameContext.game = null;
		};

		await refetchGame();

		expect(window.location.hash).toBe('#/play/g1');
		expect(localStorage.getItem('g1')).toBe('me');
		expect(fetches).toBe(2);
	});

	it('drops an answer for a game the view has since moved away from', async () => {
		arrange();
		served = { status: 'success', body: { world: world('L2'), players: [{ id: 'me', position: { x: 0, y: 0 } }] } };
		onFetch = () => {
			gameContext.gameId = 'g2';
		};

		await refetchGame();

		expect(gameContext.scene.rebuilt).toBeNull();
		expect(window.location.hash).toBe('#/play/g1');
	});

	it('runs overlapping asks one after another, with the latest last', async () => {
		arrange();
		served = { status: 'success', body: { world: world('L2'), players: [{ id: 'me', position: { x: 0, y: 0 } }] } };
		const starts = [];
		onFetch = count => starts.push(count);

		await Promise.all([refetchGame(), refetchGame(), refetchGame()]);

		// three asks while one is in flight collapse to that one plus one more after it
		expect(fetches).toBe(2);
		expect(starts).toEqual([1, 2]);
	});

	it('sends a player the game no longer holds to the hub', async () => {
		arrange();
		served = { status: 'success', body: { world: world(), players: [{ id: 'someone-else' }] } };

		await refetchGame();

		expect(window.location.hash).toBe('#/hub');
	});

	it('keeps a watcher on a game with no player of theirs, and rebuilds when the asteroid changed', async () => {
		arrange({ watch: true, here: 'L1' });
		const players = [{ id: 'p1', name: 'Ada', position: { x: 2, y: 2 } }];
		served = { status: 'success', body: { world: world('L2'), players } };

		await refetchGame();

		expect(window.location.hash).toBe('#/play/g1');
		expect(localStorage.getItem('g1')).toBe('me');
		expect(gameContext.scene.rebuilt.world.name).toBe('L2');
		expect(gameContext.scene.rebuilt.players).toBe(players);
	});

	it('leaves a watcher too when the game itself is gone, without touching stored ids', async () => {
		arrange({ watch: true });
		served = notFound;

		await refetchGame();

		expect(window.location.hash).toBe('#/hub');
		expect(localStorage.getItem('g1')).toBe('me');
	});
});
