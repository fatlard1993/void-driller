import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

let Card;
let cardEdge;

beforeAll(async () => {
	({ Card, cardEdge } = await import('./Card'));
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('Card', () => {
	it('wears the cut-corner frame', () => {
		const card = new Card({ header: 'Borebit L2' });

		expect(card.elem.getAttribute('data-augmented-ui')).toContain('border');
	});

	it('edges its frame in its accent', () => {
		const card = new Card({ header: 'Borebit L2', accent: cardEdge.available });

		expect(card.elem.style.getPropertyValue('--card-accent')).toBe(String(cardEdge.available));

		card.options.accent = false;

		expect(card.elem.style.getPropertyValue('--card-accent')).toBe('');
	});

	it("says it can't be taken through aria-disabled, and presses nothing", () => {
		const onPointerPress = mock();
		const card = new Card({ header: 'Borebit L2', disabled: true, onPointerPress, appendTo: document.body });

		card.elem.click();

		expect(card.elem.getAttribute('aria-disabled')).toBe('true');
		expect(onPointerPress).not.toHaveBeenCalled();
	});

	it('presses by keyboard when it presses at all', () => {
		const onPointerPress = mock();
		const card = new Card({ header: 'Tritanium', onPointerPress, appendTo: document.body });

		card.elem.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

		expect(card.elem.tabIndex).toBe(0);
		expect(card.elem.getAttribute('role')).toBe('button');
		expect(onPointerPress).toHaveBeenCalled();
	});
});
