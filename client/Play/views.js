/**
 * The console's and SpaceCo's tabs, one row each, and the views older builds named (saved as a default menu, or sent
 * by the event router) that now open one of them
 */
export const consoleTabs = [
	{ id: 'cargo', label: 'Cargo' },
	{ id: 'items', label: 'Items' },
	{ id: 'status', label: 'Status' },
	{ id: 'achievements', label: 'Achievements' },
	{ id: 'collection', label: 'Collection' },
	{ id: 'settings', label: 'Settings' },
	{ id: 'help', label: 'Help' },
	{ id: 'briefing', label: 'Briefing' },
];

export const spacecoTabs = [
	{ id: 'sell', label: 'Sell' },
	{ id: 'refuel', label: 'Refuel' },
	{ id: 'repair', label: 'Repair' },
	{ id: 'upgrade', label: 'Upgrade' },
	{ id: 'shop', label: 'Shop' },
	{ id: 'transport', label: 'Transport' },
	{ id: 'status', label: 'Status' },
	{ id: 'achievements', label: 'Achievements' },
];

const consoleAliases = {
	status_current: 'status',
	status_rig: 'status',
	status_achievements: 'achievements',
	status_minerals: 'collection',
	status_items: 'collection',
	help_docs: 'help',
	help_briefing: 'briefing',
};

const spacecoAliases = {
	upgrade_current: 'upgrade',
	upgrade_vehicles: 'upgrade',
	upgrade_drills: 'upgrade',
	upgrade_engines: 'upgrade',
	upgrade_parts: 'upgrade',
	shop_spaceco: 'shop',
	shop_player: 'shop',
	status_current: 'status',
	status_minerals: 'status',
	status_achievements: 'achievements',
};

const viewIn = (tabs, aliases) => value => {
	const name = String(value ?? '').toLowerCase();
	const id = aliases[name] ?? name;

	return tabs.some(tab => tab.id === id) ? id : undefined;
};

/** @type {(value: string) => string|undefined} The console tab a view opens, if any */
export const consoleView = viewIn(consoleTabs, consoleAliases);

/** @type {(value: string) => string|undefined} The SpaceCo tab a view opens, if any */
export const spacecoView = viewIn(spacecoTabs, spacecoAliases);
