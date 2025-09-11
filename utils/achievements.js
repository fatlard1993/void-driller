/**
 * Shared achievement utilities for consistent formatting across the application
 */

/**
 * Format achievement rewards for display
 * @param {Array} awards - Array of achievement awards
 * @param {object} options - Formatting options
 * @param {string} options.xpLabel - Label to use for XP rewards (defaults to "GMS")
 * @param {boolean} options.includePrefix - Whether to include "Rewards: " prefix (defaults to false)
 * @returns {string} Formatted rewards string
 */
export function formatAchievementRewards(awards, options = {}) {
	if (!awards || awards.length === 0) return '';
	
	const { 
		xpLabel = 'GMS', 
		includePrefix = false 
	} = options;
	
	const rewardStrings = awards
		.filter(award => Array.isArray(award)) // Only process array awards, skip functions
		.map(([type, amount]) => {
			switch (type) {
				case 'xp':
					return `+${amount} ${xpLabel}`;
				case 'credits':
					return `+$${amount}`;
				case 'item':
					return `+${amount} ${type.charAt(0).toUpperCase() + type.slice(1).replaceAll('_', ' ')}`;
				default:
					return `+${amount} ${type.charAt(0).toUpperCase() + type.slice(1).replaceAll('_', ' ')}`;
			}
		});
	
	// Check if there are any function-based rewards (dynamic rewards)
	const hasDynamicRewards = awards.some(award => typeof award === 'function');
	if (hasDynamicRewards) {
		rewardStrings.push('+ Dynamic Items');
	}
	
	if (rewardStrings.length === 0) return '';
	
	const rewardsText = rewardStrings.join(', ');
	return includePrefix ? `Rewards: ${rewardsText}` : rewardsText;
}

/**
 * Format achievement rewards for player achievements (uses "XP (Pension Credits)" label)
 * @param {Array} awards - Array of achievement awards
 * @returns {string} Formatted rewards string
 */
export function formatPlayerAchievementRewards(awards) {
	return formatAchievementRewards(awards, { 
		xpLabel: 'XP (Pension Credits)',
		includePrefix: true 
	});
}

/**
 * Format achievement rewards for SpaceCo achievements (uses "GMS (Galactic Market Share)" label)
 * @param {Array} awards - Array of achievement awards
 * @returns {string} Formatted rewards string
 */
export function formatSpacecoAchievementRewards(awards) {
	return formatAchievementRewards(awards, { 
		xpLabel: 'GMS (Galactic Market Share)' 
	});
}

/**
 * Format achievement rewards for notifications (uses simple "GMS" label)
 * @param {Array} awards - Array of achievement awards
 * @returns {string} Formatted rewards string
 */
export function formatNotificationAchievementRewards(awards) {
	return formatAchievementRewards(awards, { 
		xpLabel: 'GMS' 
	});
}