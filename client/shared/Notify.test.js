import { afterEach, beforeAll, describe, expect, it } from 'bun:test';

let gameContext;
let Notify;

beforeAll(async () => {
	({ default: gameContext } = await import('./gameContext'));
	({ default: Notify } = await import('./Notify'));
});

afterEach(() => {
	gameContext.openDialog = null;
	document.body.innerHTML = '';
});

describe('Notify', () => {
	it('lands somewhere over the game', () => {
		const notify = new Notify({ content: 'Out of fuel', timeout: 0 });

		expect(notify.elem.classList.contains('stacked')).toBe(false);
	});

	it('stacks in the corner over a dialog, off its header', () => {
		gameContext.openDialog = {};

		const notify = new Notify({ content: 'Trade session started with Grace', timeout: 0 });

		expect(notify.elem.classList.contains('stacked')).toBe(true);
	});

	it("shortens info and success toasts to the player's auto-dismiss setting", () => {
		gameContext.notifySettings = { ...gameContext.notifySettings, autoDismissTimeout: 1234 };

		expect(new Notify({ content: 'Sold', intent: 'success' }).options.timeout).toBe(1234);
		expect(new Notify({ content: 'Docked', intent: 'info' }).options.timeout).toBe(1234);
	});

	it('leaves a warning or danger toast up until pressed', () => {
		gameContext.notifySettings = { ...gameContext.notifySettings, autoDismissTimeout: 1234 };

		expect(new Notify({ content: 'Failed to load', intent: 'danger' }).options.timeout).toBe(0);
		expect(new Notify({ content: 'Low fuel', intent: 'warning' }).options.timeout).toBe(0);
	});

	it('keeps a timeout given to it', () => {
		expect(new Notify({ content: 'Low fuel', intent: 'warning', timeout: 30000 }).options.timeout).toBe(30000);
	});
});
