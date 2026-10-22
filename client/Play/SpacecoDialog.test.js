import { beforeAll, describe, expect, it } from 'bun:test';

// Importing the client connects its socket; this one stays closed
globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

let gameContext;
let SpacecoDialog;

beforeAll(async () => {
	({ default: gameContext } = await import('../shared/gameContext'));
	({ default: SpacecoDialog } = await import('./SpacecoDialog'));

	gameContext.serverState = {
		world: {
			spaceco: {
				health: 9,
				position: { x: 3, y: 1 },
				stats: {},
				hull: {},
				shop: {},
				vehicles: [],
				drills: [],
				engines: [],
				parts: [],
			},
			transportChoices: [],
		},
	};
	gameContext.players = new Map();
	gameContext.players.currentPlayer = { hull: {}, items: {}, fuel: 1, maxFuel: 1, health: 1, maxHealth: 1, credits: 0 };
});

describe('SpacecoDialog', () => {
	it('opens a menu at its first page', async () => {
		const dialog = new SpacecoDialog({ view: 'Status' });
		await new Promise(resolve => setTimeout(resolve));

		expect(dialog.options.view).toBe('status_Current');
		expect(dialog.elem.querySelector('.menuBody .selected-menu')?.textContent).toBe('Current');
	});

	it('opens at Sell when the saved default menu has no page', async () => {
		localStorage.setItem('console_defaultSpacecoMenu', 'status_Vehicles');
		const dialog = new SpacecoDialog();
		await new Promise(resolve => setTimeout(resolve));

		expect(dialog.options.view).toBe('Sell');
	});
});
