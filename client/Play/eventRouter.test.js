import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

// Phaser needs a real canvas; the handlers under test are state transitions over gameContext
mock.module('phaser', () => {
	const Phaser = new Proxy(class {}, { get: (target, key) => (key in target ? target[key] : Phaser) });

	return { default: Phaser };
});

globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

// Sprites that remember how they were made and what they were told
class Stub {
	constructor(scene, x, y, ...rest) {
		this.scene = scene;
		this.position = { x, y };
		this.made = rest;
		this.calls = [];
		for (const method of [
			'move',
			'teleport',
			'fall',
			'awake',
			'sleep',
			'attack',
			'rest',
			'destroy',
			'collect',
			'dig',
		]) {
			this[method] = (...args) => this.calls.push([method, ...args]);
		}
	}
}
mock.module('./GameObjects', () => ({ Drill: Stub, Gas: Stub, Ground: Stub, Item: Stub, Lava: Stub, Mineral: Stub }));
mock.module('./GameObjects/aliens', () => ({ createAlien: (scene, x, y, name) => new Stub(scene, x, y, name) }));

let gameContext;
let setupEventRouter;
let router;

beforeAll(async () => {
	({ default: gameContext } = await import('../shared/gameContext'));
	({ setupEventRouter } = await import('./eventRouter'));
});

const cell = (hazards = [], items = []) => ({ ground: {}, items, hazards });
const layer = () => ({
	added: [],
	add(sprite) {
		this.added.push(sprite);
	},
});

// A 3x3 world, the viewer being 'me', with every sprite a Stub
const arrange = () => {
	router?.destroy();
	Object.assign(gameContext, {
		gameId: 'g1',
		playerId: 'me',
		isWatchMode: false,
		game: {},
		scene: { sound: { play() {} }, cameras: { main: { shake() {}, flash() {} } }, tweens: { add() {} } },
		sceneLayers: { ground: layer(), hazards: layer(), items: layer(), players: layer(), interfaces: layer() },
		spaceco: Object.assign(new Stub(null, 1, 0), { updateStatusBars() {}, checkForNearbyPlayer() {}, hidePrompt() {} }),
		statusBarHUD: null,
		openDialog: null,
		sounds: {},
		serverState: {
			players: [],
			world: {
				name: 'L1',
				grid: [0, 1, 2].map(() => [0, 1, 2].map(() => cell())),
				spaceco: { position: { x: 1, y: 0 }, health: 9, stats: {}, hull: {}, shop: {} },
			},
		},
	});
	gameContext.players.clear();
	router = setupEventRouter();
};

const player = (id, extra = {}) => {
	const sprite = new Stub(gameContext.scene, 1, 1);
	const record = {
		id,
		name: id,
		position: { x: 1, y: 1 },
		orientation: 'right',
		configuration: { vehicle: 'T1', drill: 'T1', engine: 'T1' },
		health: 10,
		maxHealth: 10,
		fuel: 10,
		maxFuel: 10,
		cargo: 0,
		maxCargo: 10,
		credits: 0,
		xp: 0,
		items: {},
		hull: {},
		stats: { tilesMoved: 7 },
		achievements: {},
		sprite,
		...extra,
	};
	gameContext.players.set(id, record);

	return record;
};

// Every message carries the game id and its event name, as the socket's would
const send = (event, data) => router.emit(event, { id: 'g1', update: event, ...data });

afterEach(() => router?.destroy());

describe('addPlayer', () => {
	it('draws a joining rig with its name, for everyone but the joiner', async () => {
		arrange();

		await send('addPlayer', { newPlayer: { ...player('ada'), id: 'ada', sprite: undefined } });
		await send('addPlayer', { newPlayer: { ...player('me'), sprite: undefined } });

		const ada = gameContext.players.get('ada');
		expect(ada.sprite).toBeInstanceOf(Stub);
		expect(ada.sprite.made.at(-1)).toBe('ada');
		expect(gameContext.players.get('me').sprite.made).toEqual([]);
	});
});

describe('achievement', () => {
	it("applies the earner's new state and keeps what the event does not carry", async () => {
		arrange();
		player('ada');

		await send('achievement', {
			playerId: 'ada',
			achievement: { id: 'first', name: 'First', awards: [] },
			player: { achievements: { first: true }, xp: 75, credits: 30, items: {}, fuel: 10, health: 10 },
		});

		const ada = gameContext.players.get('ada');
		expect(ada.achievements).toEqual({ first: true });
		expect(ada.xp).toBe(75);
		expect(ada.credits).toBe(30);
		expect(ada.stats).toEqual({ tilesMoved: 7 });
	});
});
