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
	gameContext.playerId = 'me';
	gameContext.players.clear();
	gameContext.players.set('me', {
		id: 'me',
		hull: {},
		items: {},
		fuel: 1,
		maxFuel: 1,
		health: 1,
		maxHealth: 1,
		credits: 0,
	});
});

describe('SpacecoDialog', () => {
	it('opens at the tab a view names, in one row of tabs', async () => {
		const dialog = new SpacecoDialog({ view: 'Status' });
		await new Promise(resolve => setTimeout(resolve));

		expect(dialog.options.view).toBe('status');
		expect(dialog.elem.querySelectorAll('[role="tablist"]').length).toBe(1);
		expect(dialog.elem.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Status');
	});

	it('opens the tab that took in a page an older build named', async () => {
		const dialog = new SpacecoDialog({ view: 'shop_Player' });
		await new Promise(resolve => setTimeout(resolve));

		expect(dialog.options.view).toBe('shop');
	});

	it('moves along its tabs by arrow key, past those with nothing behind them, keeping the keyboard on the row', async () => {
		const dialog = new SpacecoDialog({ view: 'sell' });
		await new Promise(resolve => setTimeout(resolve));

		const selected = () => dialog.elem.querySelector('[role="tab"][aria-selected="true"]');

		selected().focus();
		selected().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

		expect(dialog.options.view).toBe('status');
		expect(document.activeElement).toBe(selected());
	});

	it('leaves a tab with nothing behind it disabled, but not the one showing', async () => {
		const dialog = new SpacecoDialog({ view: 'sell' });
		await new Promise(resolve => setTimeout(resolve));

		const tab = id => dialog.elem.querySelector(`[role="tab"][data-tab="${id}"]`);

		expect(tab('sell').disabled).toBe(false);
		expect(tab('upgrade').disabled).toBe(true);
	});

	it('opens at Sell when the saved default menu has no page', async () => {
		localStorage.setItem('console_defaultSpacecoMenu', 'status_Vehicles');
		const dialog = new SpacecoDialog();
		await new Promise(resolve => setTimeout(resolve));

		expect(dialog.options.view).toBe('sell');
	});

	it('says how to get minerals when there are none to sell, and offers the collection', async () => {
		const dialog = new SpacecoDialog({ view: 'Sell' });
		await new Promise(resolve => setTimeout(resolve));

		const empty = dialog.elem.querySelector('.vbc-empty-state, .EmptyState');

		expect(empty.textContent).toContain('No minerals to sell');
		expect(empty.querySelector('button').textContent).toBe('Show collection');
	});
});
