import { afterEach, describe, expect, it } from 'bun:test';
import { Elem } from '@vanilla-bean/components';

import { loadDoc } from './loadDoc';

const realFetch = globalThis.fetch;
const settle = () => new Promise(resolve => setTimeout(resolve, 10));

afterEach(() => {
	globalThis.fetch = realFetch;
	document.body.innerHTML = '';
});

describe('loadDoc', () => {
	it('stands a loading EmptyState in while the doc comes, then resolves to it', async () => {
		let answer;
		globalThis.fetch = () => new Promise(resolve => (answer = resolve));
		const pane = new Elem({ appendTo: document.body });

		const doc = loadDoc(pane, 'docs/ok.md', 'help');
		await settle();

		expect(pane.elem.textContent).toBe('');
		expect(pane.elem.children.length).toBe(1);

		answer(new Response('<h1>Help</h1>', { status: 200, headers: { 'Content-Type': 'text/html' } }));

		expect(await doc).toBe('<h1>Help</h1>');
		expect(pane.elem.children.length).toBe(0);
	});

	it('says a failed load failed, with the reason, and tries again when asked', async () => {
		let calls = 0;
		globalThis.fetch = async () =>
			++calls === 1
				? new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
				: new Response('<h1>Briefing</h1>', { status: 200, headers: { 'Content-Type': 'text/html' } });
		const pane = new Elem({ appendTo: document.body });

		const doc = loadDoc(pane, 'docs/missing.md', 'briefing');
		await settle();

		expect(pane.elem.textContent).toContain("Couldn't load the briefing");
		expect(pane.elem.textContent).toContain('Not found');

		pane.elem.querySelector('button').click();

		expect(await doc).toBe('<h1>Briefing</h1>');
		expect(calls).toBe(2);
		expect(pane.elem.textContent).toBe('');
	});
});
