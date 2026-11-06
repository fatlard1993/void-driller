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

// Every pattern the dispatcher knows; crystals match a cell to its vein by this index
const patterns = [
	'organic',
	'fractal',
	'layered',
	'radial',
	'scattered',
	'concentric',
	'grid',
	'spiral',
	'lightning',
	'cellular',
	'flow',
	'percolation',
	'maze',
	'noise_bands',
];

describe('vein index', () => {
	test.each(patterns)('a %s vein stamps its cells with its own index', pattern => {
		const asteroid = generateAsteroid({
			...worlds[0],
			ground: {
				base: 'white',
				veins: [
					{ color: 'orange', density: 2, size: 1, yield: 1, pattern: 'organic' },
					{ color: 'black', density: 12, size: 2, yield: 1, pattern },
				],
			},
		});

		const stamped = asteroid.grid
			.flat()
			.filter(cell => cell.ground?.type === 'black' && cell.ground.veinSource)
			.map(cell => cell.ground.veinIndex);

		expect(stamped.length).toBeGreaterThan(0);
		expect(new Set(stamped)).toEqual(new Set([1]));
	});
});
