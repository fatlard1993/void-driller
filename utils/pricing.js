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
		repairCostPerHealthPoint: Math.ceil(1.87 + spacecoXp / 10000), // 2 → 7 at 50k XP
		spacecoRepairCostPerHealthPoint: Math.ceil(14.4 + spacecoXp / 5000), // 15 → 25 at 50k XP
		rescueCost: Math.ceil(84.5 + spacecoXp / 1000), // 85 → 135 at 50k XP
		fuelPricePerUnit: {
			oil: Math.ceil(2.1 + spacecoXp / 25000), // 3 → 5 at 50k XP
			battery: Math.ceil(12.4 + spacecoXp / 15625), // 13 → 16 at 50k XP
			super_oxygen_liquid_nitrogen: Math.ceil(19.5 + spacecoXp / 10000), // 20 → 25 at 50k XP
		},
	};
}
