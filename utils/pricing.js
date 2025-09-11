/**
 * Shared pricing utilities for client and server consistency
 */

/**
 * Calculate scaled transport costs based on SpaceCo XP
 * @param {number} basePrice - Base transport price
 * @param {number} spacecoXp - Current SpaceCo experience points
 * @returns {number} Scaled transport cost
 */
export function getScaledTransportCost(basePrice, spacecoXp) {
	const scalingFactor = 1.0 + spacecoXp / 200000; // Up to 1.5x at 100k XP
	return Math.floor(basePrice * scalingFactor);
}

/**
 * Calculate scaled item prices based on SpaceCo XP
 * @param {number} basePrice - Base item price
 * @param {number} spacecoXp - Current SpaceCo experience points
 * @returns {number} Scaled item price
 */
export function getScaledItemPrice(basePrice, spacecoXp) {
	const scalingFactor = 1.0 + spacecoXp / 100000; // Up to 2x at 100k XP
	return Math.floor(basePrice * scalingFactor);
}

/**
 * Calculate scaled service costs (fuel, repair, rescue) based on SpaceCo XP
 * @param {number} spacecoXp - Current SpaceCo experience points
 * @returns {object} Object containing all scaled service costs
 */
export function getScaledServiceCosts(spacecoXp) {
	return {
		repairCostPerHealthPoint: 1.3 + spacecoXp / 10000, // 1.3 → 6.3 at 50k XP
		spacecoRepairCostPerHealthPoint: 10 + spacecoXp / 5000, // 10 → 20 at 50k XP
		rescueCost: 50 + spacecoXp / 1000, // 50 → 100 at 50k XP
		fuelPricePerUnit: {
			oil: 2.0 + spacecoXp / 25000, // 2 → 4 at 50k XP
			battery: 3.2 + spacecoXp / 15625, // 3.2 → 6.4 at 50k XP
			super_oxygen_liquid_nitrogen: 5.0 + spacecoXp / 10000, // 5 → 10 at 50k XP
		},
	};
}