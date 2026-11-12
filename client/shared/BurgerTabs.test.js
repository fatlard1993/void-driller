import { afterEach, describe, expect, it, mock } from 'bun:test';

import BurgerTabs, { Tab } from './BurgerTabs';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('Tab', () => {
	it('marks the selected tab with aria-selected and leaves it in reach of the keyboard', () => {
		const tab = Tab({ appendTo: document.body, content: 'Cargo', selected: true });

		expect(tab.elem.getAttribute('aria-selected')).toBe('true');
		expect(tab.elem.disabled).toBe(false);
		expect(tab.elem.getAttribute('aria-disabled')).toBeNull();
	});

	it('does nothing when the selected tab is pressed', () => {
		const onPointerPress = mock();
		const tab = Tab({ appendTo: document.body, content: 'Cargo', selected: true, onPointerPress });

		tab.elem.click();

		expect(onPointerPress).not.toHaveBeenCalled();
	});

	it('an empty tab is still disabled', () => {
		const tab = Tab({ appendTo: document.body, content: 'Cargo', disabled: true });

		expect(tab.elem.disabled).toBe(true);
	});
});

describe('BurgerTabs', () => {
	it('shows the selected tab beside the menu, selected and not disabled', () => {
		new BurgerTabs({ appendTo: document.body, tabs: ['Cargo', 'Shop'], selectedTab: 'Cargo', onTabClick: () => {} });

		const selected = document.querySelector('[aria-selected="true"]');

		expect(selected.textContent).toBe('Cargo');
		expect(selected.disabled).toBe(false);
	});

	it('says whether the hamburger is showing the rest through aria-expanded alone, with its glyph as its icon', () => {
		new BurgerTabs({ appendTo: document.body, tabs: ['Cargo', 'Shop'], selectedTab: 'Cargo', onTabClick: () => {} });

		const hamburger = () => document.querySelector('[aria-label="All tabs"]');

		expect(hamburger().getAttribute('aria-expanded')).toBe('false');
		expect(hamburger().classList.contains('fa-bars')).toBe(true);

		hamburger().click();

		expect(hamburger().getAttribute('aria-expanded')).toBe('true');
		expect(hamburger().style.backgroundColor).toBe('');
	});
});
