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
let applyView;

beforeAll(async () => {
	({ default: gameContext } = await import('../shared/gameContext'));
	({ refetchGame, applyView } = await import('./reconcile'));
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
	gameContext.spaceco = null;
});

describe('refetchGame', () => {
	// The server answers about games only once its saved games are loaded (gamesLoaded): a 404 is a game that's gone
	it('sends a player whose contract is gone to the hub and forgets their id, on the first answer', async () => {
		arrange();
		served = notFound;

		await refetchGame();

		expect(window.location.hash).toBe('#/hub');
		expect(localStorage.getItem('g1')).toBeNull();
		expect(fetches).toBe(1);
	});

	it('drops an answer that arrives after the player has left the game', async () => {
		arrange();
		served = notFound;
		onFetch = () => {
			gameContext.game = null;
		};

		await refetchGame();

		expect(window.location.hash).toBe('#/play/g1');
		expect(localStorage.getItem('g1')).toBe('me');
		expect(fetches).toBe(1);
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

describe('applyView', () => {
	const view = (overrides = {}) => ({
		id: 'g1',
		players: [{ id: 'me', name: 'Ada', position: { x: 2, y: 2 } }],
		world: { name: 'L1', spaceco: { position: { x: 1, y: 1 }, health: 7 }, transports: { L2: {} } },
		trades: [],
		...overrides,
	});

	it('is the state the scene draws from until it is drawn, and leaves the grid alone', () => {
		arrange();
		const { grid } = gameContext.serverState.world;

		applyView(view());

		expect(gameContext.serverState.players[0].name).toBe('Ada');
		expect(gameContext.serverState.world.spaceco.health).toBe(7);
		expect(gameContext.serverState.world.transports).toEqual({ L2: {} });
		expect(gameContext.serverState.world.grid).toBe(grid);
		expect(fetches).toBe(0);
	});

	it('ignores a view of another game', () => {
		arrange();

		applyView(view({ id: 'g2', players: [] }));

		expect(window.location.hash).toBe('#/play/g1');
		expect(gameContext.serverState.players).toEqual([]);
	});

	it('sends a player the view no longer holds to the hub', () => {
		arrange();

		applyView(view({ players: [{ id: 'someone-else', position: { x: 0, y: 0 } }] }));

		expect(window.location.hash).toBe('#/hub');
		expect(localStorage.getItem('g1')).toBeNull();
	});

	it('lets a player on their way out (aborting) go without telling them their contract closed', () => {
		arrange();
		gameContext.exiting = true;

		applyView(view({ players: [] }));

		expect(window.location.hash).toBe('#/play/g1');
		expect(localStorage.getItem('g1')).toBe('me');
		gameContext.exiting = false;
	});

	it('leaves a view of the asteroid a heard transport is taking it to for the transition to draw', () => {
		arrange();
		gameContext.arrivingAt = 'L2';

		applyView(view({ world: { name: 'L2', spaceco: {}, transports: {} } }));

		expect(fetches).toBe(0);
		expect(gameContext.scene.rebuilt).toBeNull();
		gameContext.arrivingAt = undefined;
	});

	it('fetches the whole game for a view of another asteroid', async () => {
		arrange();
		const players = [{ id: 'me', position: { x: 0, y: 0 } }];
		served = { status: 'success', body: { world: world('L2'), players } };

		applyView(view({ world: { name: 'L2', spaceco: {}, transports: {} } }));
		await refetchGame();

		expect(fetches).toBeGreaterThan(0);
		expect(gameContext.scene.rebuilt.world.name).toBe('L2');
	});
});
