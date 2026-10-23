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
});
