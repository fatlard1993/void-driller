/** @type {(percentage?: number) => boolean} True `percentage` percent of the time */
export const chance = (percentage = 50) => Math.random() * 100 < percentage;

/**
 * Pick a key, each as likely as its percentage
 * @example weightedChance({ common: 70, rare: 25, legendary: 5 }); // 'common' 70% of the time
 * @param {object} percentages - Keys to their chance, summing to 100
 * @returns {string} The key picked
 */
export const weightedChance = percentages => {
	const entries = Object.entries(percentages);
	const total = entries.reduce((sum, [, percentage]) => sum + percentage, 0);

	if (total !== 100)
		throw new Error(`weightedChance percentages sum to ${total}, not 100: ${Object.keys(percentages)}`);

	let roll = Math.random() * 100;

	for (const [key, percentage] of entries) {
		roll -= percentage;

		if (roll < 0) return key;
	}

	return entries.findLast(([, percentage]) => percentage > 0)[0];
};
