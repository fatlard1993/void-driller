import { describe, expect, test } from 'bun:test';

import { stepFuelCost, validateMovementPath } from './movement';

// An open 5x5 world standing on a solid floor at y=4; cells named "x,y" are solid white rock instead
const world = (...solid) =>
	[0, 1, 2, 3, 4].map(x =>
		[0, 1, 2, 3, 4].map(y => ({
			ground: y === 4 || solid.includes(`${x},${y}`) ? { type: 'white' } : {},
			items: [],
			hazards: [],
		})),
	);

const rig = {
	position: { x: 2, y: 3 },
	orientation: 'right',
	configuration: { drill: 'T1' },
	fuel: 100,
	fuelEfficiency: 2,
	cargo: 0,
	maxCargo: 10,
};

describe('validateMovementPath', () => {
	test('a step of two cells in a line is not a move', () => {
		const result = validateMovementPath({ player: rig, path: [{ x: 4, y: 3 }], grid: world() });

		expect(result.valid).toBe(false);
		expect(result.reason).toBe('invalid_distance');
	});

	test('a diagonal step is', () => {
		expect(validateMovementPath({ player: rig, path: [{ x: 3, y: 2 }], grid: world('3,3') }).valid).toBe(true);
	});
});

describe('stepFuelCost', () => {
	test('digging costs more than driving, and a heavy hold costs a fifth more', () => {
		const open = stepFuelCost(rig, { ground: {} });
		const rock = stepFuelCost(rig, { ground: { type: 'white' } });
		const laden = stepFuelCost({ ...rig, cargo: rig.maxCargo }, { ground: {} });

		expect(open).toBeCloseTo(0.15);
		expect(rock).toBeGreaterThan(open);
		expect(laden).toBeCloseTo(open * 1.2);
	});
});
