import { capitalize } from '@vanilla-bean/components';

import { engines, items } from '../../constants';

// What placing a charge or a beacon leaves in the inventory, its key carrying the position: detonator_x_y,
// void_detonator_x_y, activated_teleporter_x_y. Each shows as the item it came from, unless its own look is given here.
const placedItems = {
	detonator: { item: 'detonator', state: 'armed', at: 'Armed at' },
	void_detonator: { item: 'void_detonator', state: 'armed', at: 'Armed at' },
	activated_teleporter: {
		item: 'advanced_teleporter',
		name: 'Teleporter (anchored)',
		image: 'teleport_station',
		state: 'anchored',
		at: 'Anchored at',
		summary: 'Beacon placed. Use to return to it.',
		description:
			'Return jump locked to your deployed beacon. Activation transports you to the beacon and recovers the teleporter for redeployment.',
	},
};

/**
 * How an inventory entry shows: its item's name, image and text, and where a placed one is
 * @param {string} key - The inventory key, an item name or a placed item's name_x_y
 * @returns {{ itemKey: string, name: string, image: string, summary: string, description: string, state?: string, where?: string }} How it shows
 */
export const inventoryItem = key => {
	const [, placedKey, x, y] = key.match(/^(\w+?)_(\d+)_(\d+)$/) || [];
	const placed = placedItems[placedKey];
	const itemKey = placed?.item || key;

	return {
		itemKey,
		name: placed?.name || items[itemKey]?.name || capitalize(itemKey.replaceAll('_', ' '), true),
		image: placed?.image || itemKey,
		summary: placed?.summary || items[itemKey]?.summary || '',
		description: placed?.description || items[itemKey]?.description || 'No description available.',
		state: placed?.state,
		where: placed && `${placed.at} ${x}, ${y}`,
	};
};

const fuelItems = ['oil', 'battery', 'super_oxygen_liquid_nitrogen'];

/**
 * Why an inventory entry cannot be used by hand right now, or null when it can
 * @param {string} key - The inventory key
 * @param {object} player - The player holding it
 * @returns {string|null} The reason shown on a disabled Use button
 */
export const itemUseBlocker = (key, player) => {
	const { itemKey } = inventoryItem(key);

	if (items[itemKey]?.passive) return 'Not used by hand';

	if (fuelItems.includes(itemKey)) {
		if (engines[player.configuration.engine].fuelType !== itemKey) return 'Incompatible fuel type';
		if (player.fuel >= player.maxFuel) return 'Fuel tank full';
	}

	if (itemKey === 'repair_nanites' && player.health >= player.maxHealth) return 'Health already full';

	return null;
};
