import { describe, expect, test } from 'bun:test';

import { gridChanges, playerChanges } from './gameDiff';

const cell = (ground, items = [], hazards = []) => ({ ground: ground ? { type: ground } : {}, items, hazards });

describe('gridChanges', () => {
	test('reports dug, grown, re-stocked and re-hazarded cells, and nothing for cells that match', () => {
		const local = [
			[cell('white'), cell('white', [{ name: 'oil' }]), cell(null, [], [{ type: 'gas' }])],
			[cell(null), cell('orange'), cell('white', [{ name: 'mineral_white' }])],
		];
		const server = [
			[
				cell(null),
				cell('white', [{ name: 'oil' }]),
				cell(null, [], [{ type: 'gas' }, { type: 'alien', name: 'rock_mite' }]),
			],
			[cell('green'), cell('orange'), cell('white', [{ name: 'mineral_white' }])],
		];

		expect(gridChanges(local, server)).toEqual([
			{ x: 0, y: 0, ground: null },
			{ x: 0, y: 2, hazards: [{ type: 'gas' }, { type: 'alien', name: 'rock_mite' }] },
			{ x: 1, y: 0, ground: 'green' },
		]);
	});

	test('an alien replaced by another kind in the same cell is a change', () => {
		const local = [[cell(null, [], [{ type: 'alien', name: 'rock_mite' }])]];
		const server = [[cell(null, [], [{ type: 'alien', name: 'hive_drone' }])]];

		expect(gridChanges(local, server)).toEqual([{ x: 0, y: 0, hazards: [{ type: 'alien', name: 'hive_drone' }] }]);
	});

	test('a cell the client never had is left alone', () => {
		expect(gridChanges([[cell('white')]], [[cell('white'), cell('white')]])).toEqual([]);
	});

	test('items compare by what they are, not by order or by the sprite riding along', () => {
		const local = [[cell(null, [{ name: 'oil', sprite: {} }, { name: 'battery' }])]];
		const server = [[cell(null, [{ name: 'battery' }, { name: 'oil' }])]];

		expect(gridChanges(local, server)).toEqual([]);
	});
});

describe('playerChanges', () => {
	test('sorts players into gone, added and updated', () => {
		const local = new Map([
			['a', { id: 'a' }],
			['b', { id: 'b' }],
		]);
		const server = [{ id: 'b' }, { id: 'c' }];

		expect(playerChanges(local, server)).toEqual({ gone: ['a'], added: [{ id: 'c' }], updated: [{ id: 'b' }] });
	});
});
