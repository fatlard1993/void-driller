// What changed between the game as this client last saw it and the game as the server has it now: plain data in, plain
// data out, so the reconcile that redraws the scene has nothing to decide

const names = list => (list || []).map(item => item.name).sort();
const hazardKeys = list => (list || []).map(hazard => `${hazard.type}:${hazard.name || ''}`).sort();
const same = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Cells whose ground, items or hazards differ
 * @param {Array} local - The grid this client holds
 * @param {Array} server - The grid the server sent
 * @returns {Array<{ x: number, y: number, ground?: string|null, items?: Array, hazards?: Array }>} Per changed cell:
 *   `ground` is the new type (null when dug away), `items` and `hazards` the server's lists, each only when changed
 */
export const gridChanges = (local, server) => {
	const changes = [];

	server.forEach((column, x) =>
		column.forEach((cell, y) => {
			const mine = local[x]?.[y];
			if (!mine) return;

			const change = { x, y };
			const before = mine.ground?.type || null;
			const after = cell.ground?.type || null;

			if (before !== after) change.ground = after;
			if (!same(names(mine.items), names(cell.items))) change.items = cell.items || [];
			if (!same(hazardKeys(mine.hazards), hazardKeys(cell.hazards))) change.hazards = cell.hazards || [];

			if (Object.keys(change).length > 2) changes.push(change);
		}),
	);

	return changes;
};

/**
 * Who left, who arrived, and whose state to take as the server has it
 * @param {Map} local - The players this client holds, by id
 * @param {Array} server - The players the server sent
 * @returns {{ gone: string[], added: Array, updated: Array }} Ids no longer present, new players, players to update
 */
export const playerChanges = (local, server) => ({
	gone: [...local.keys()].filter(id => !server.some(player => player.id === id)),
	added: server.filter(player => !local.has(player.id)),
	updated: server.filter(player => local.has(player.id)),
});
