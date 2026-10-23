import { beforeAll, describe, expect, it, mock } from 'bun:test';

// Phaser needs a real canvas to load; the scene's placement is plain arithmetic over the camera
mock.module('phaser', () => {
	const Phaser = new Proxy(class {}, { get: (target, key) => (key in target ? target[key] : Phaser) });

	return { default: Phaser };
});

// Importing the client connects its socket; this one stays closed
globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

let gameContext;
let WatchScene;

beforeAll(async () => {
	({ default: gameContext } = await import('../shared/gameContext'));
	({ default: WatchScene } = await import('./WatchScene'));
});

// A 390 wide phone view: the canvas sits below a 75px toolbar, the camera zoomed out on a world wider than the view
const scene = ({ spriteX, spriteY }) => {
	gameContext.players = new Map([['p1', { sprite: { x: spriteX, y: spriteY } }]]);

	return {
		cameras: { main: { width: 390, height: 769, zoom: 0.1, midPoint: { x: 3200, y: 3200 } } },
		game: { canvas: { getBoundingClientRect: () => ({ left: 0, top: 75, right: 390, bottom: 844, width: 390 }) } },
	};
};

const position = (spriteAt, angle) => {
	const random = Math.random;
	Math.random = () => angle;

	try {
		return WatchScene.prototype.getNotificationPositionAroundPlayer.call(scene(spriteAt), 'p1');
	} finally {
		Math.random = random;
	}
};

describe('WatchScene achievement position', () => {
	it('lands beside the drill on screen, below the toolbar', () => {
		const { x, y } = position({ spriteX: 3200, spriteY: 3200 }, 0);

		expect(x).toBe(195 + 96);
		expect(y).toBe(75 + 384.5);
	});

	it('stays on the canvas when the drill is at its edge', () => {
		for (const angle of [0, 0.25, 0.5, 0.75]) {
			const { x, y } = position({ spriteX: 1250, spriteY: -600 }, angle);

			expect(x).toBeGreaterThanOrEqual(12);
			expect(x).toBeLessThanOrEqual(378);
			expect(y).toBeGreaterThanOrEqual(87);
			expect(y).toBeLessThanOrEqual(832);
		}
	});
});
