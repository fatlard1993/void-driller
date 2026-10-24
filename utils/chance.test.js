import { chance, weightedChance } from './chance';

describe('chance', () => {
	test('0 never happens and 100 always does', () => {
		for (let i = 0; i < 200; i++) {
			expect(chance(0)).toBe(false);
			expect(chance(100)).toBe(true);
		}
	});

	test('a percentage comes up about that often', () => {
		let hits = 0;

		for (let i = 0; i < 20_000; i++) if (chance(25)) hits++;

		expect(hits / 20_000).toBeCloseTo(0.25, 1);
	});
});

describe('weightedChance', () => {
	test('a key comes up about as often as its percentage, and a 0 never does', () => {
		const counts = { common: 0, rare: 0, never: 0 };

		for (let i = 0; i < 20_000; i++) counts[weightedChance({ common: 75, rare: 25, never: 0 })]++;

		expect(counts.common / 20_000).toBeCloseTo(0.75, 1);
		expect(counts.never).toBe(0);
	});

	test('percentages that do not sum to 100 are refused', () => {
		expect(() => weightedChance({ common: 70, rare: 25 })).toThrow('sum to 95');
	});
});
