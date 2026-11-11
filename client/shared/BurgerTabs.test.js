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
});
