import { describe, expect, test } from 'bun:test';

import { worlds } from '../constants/index.js';
import { generateAsteroid } from './generateAsteroid.js';

const alienTypes = world =>
	world.grid
		.flat()
		.flatMap(cell => (cell.hazards || []).filter(hazard => hazard.type === 'alien').map(({ name }) => name));

describe('generateAsteroid', () => {
	test('aliens listed as an array of types are placed from that list', () => {
		const asteroid = generateAsteroid({
			...worlds[3],
			aliens: { ...worlds[3].aliens, budget: [4, 4], types: ['rock_mite', 'hive_drone'] },
		});

		const placed = alienTypes(asteroid);

		expect(placed.length).toBeGreaterThan(0);
		expect(placed.every(name => ['rock_mite', 'hive_drone'].includes(name))).toBe(true);
	});
});
