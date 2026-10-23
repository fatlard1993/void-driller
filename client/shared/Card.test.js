import { afterEach, beforeAll, describe, expect, it } from 'bun:test';

let Card;

beforeAll(async () => {
	({ Card } = await import('./Card'));
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('Card', () => {
	it('wears the cut-corner frame', () => {
		const card = new Card({ header: 'Borebit L2' });

		expect(card.elem.getAttribute('data-augmented-ui')).toContain('border');
	});

	it('edges itself by its state', () => {
		const card = new Card({ header: 'Borebit L2', state: 'unavailable' });

		expect(card.elem.classList.contains('state-unavailable')).toBe(true);

		card.options.state = 'available';

		expect(card.elem.classList.contains('state-available')).toBe(true);
		expect(card.elem.classList.contains('state-unavailable')).toBe(false);
	});

	it('has no state edge unless given one', () => {
		const card = new Card({ header: 'Tritanium' });

		expect([...card.elem.classList].some(name => name.startsWith('state-'))).toBe(false);
	});
});
