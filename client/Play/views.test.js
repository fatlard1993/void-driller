import { describe, expect, it } from 'bun:test';

import { consoleView, spacecoView } from './views';

describe('views', () => {
	it('names a tab by its id, whatever its case', () => {
		expect(consoleView('Cargo')).toBe('cargo');
		expect(spacecoView('Sell')).toBe('sell');
	});

	it('opens the tab that took in a page an older build named', () => {
		expect(consoleView('help_Docs')).toBe('help');
		expect(consoleView('help_Briefing')).toBe('briefing');
		expect(consoleView('status_Rig')).toBe('status');
		expect(consoleView('status_Items')).toBe('collection');
		expect(spacecoView('upgrade_Vehicles')).toBe('upgrade');
		expect(spacecoView('shop_Player')).toBe('shop');
		expect(spacecoView('status_Minerals')).toBe('status');
		expect(spacecoView('status_Achievements')).toBe('achievements');
	});

	it('names no tab for a page that never was, or nothing saved', () => {
		expect(spacecoView('status_Vehicles')).toBeUndefined();
		expect(consoleView(null)).toBeUndefined();
	});
});
