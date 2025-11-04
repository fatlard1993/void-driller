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
		repairCostPerHealthPoint: 1.87 + spacecoXp / 10000, // 1.87 → 6.87 at 50k XP (+20% from 1.56)
		spacecoRepairCostPerHealthPoint: 14.4 + spacecoXp / 5000, // 14.4 → 24.4 at 50k XP (+20% from 12)
		rescueCost: 84.5 + spacecoXp / 1000, // 84.5 → 134.5 at 50k XP (+30% from 65)
		fuelPricePerUnit: {
			oil: 2.1 + spacecoXp / 25000, // 2.1 → 4.1 at 50k XP
			battery: 12.4 + spacecoXp / 15625, // 12.4 → 15.6 at 50k XP
			super_oxygen_liquid_nitrogen: 19.5 + spacecoXp / 10000, // 19.5 → 24.5 at 50k XP
		},
	};
}
