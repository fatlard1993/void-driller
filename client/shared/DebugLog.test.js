import { afterEach, beforeAll, describe, expect, it } from 'bun:test';

// Importing the game's context connects its socket; this one stays closed
globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

let gameContext;
let DebugLog;

beforeAll(async () => {
	({ default: gameContext } = await import('./gameContext'));
	({ default: DebugLog } = await import('./DebugLog'));
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('DebugLog', () => {
	it('writes each entry as text, in its kind', () => {
		gameContext.debugVisible = true;
		const log = new DebugLog({ appendTo: document.body });

		log.addLog('<b>not bold</b>', 'error');

		const entry = log.elem.querySelector('.log-error');

		expect(entry.textContent).toContain('<b>not bold</b>');
		expect(entry.querySelector('b')).toBeNull();
	});

	it('clears with a Button', () => {
		gameContext.debugVisible = true;
		const log = new DebugLog({ appendTo: document.body });

		log.addLog('one');
		[...log.elem.querySelectorAll('button')].find(button => button.textContent === 'Clear').click();

		expect(log.elem.querySelector('.debug-content').children.length).toBe(0);
	});
});
