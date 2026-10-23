import { describe, expect, it } from 'bun:test';

import { cutCornerPoints, cutCorners } from './frame';

describe('cutCorners', () => {
	it('cuts only the corners named', () => {
		expect(cutCorners('6px', ['tl', 'br'])).toBe(
			'polygon(0 6px, 6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
		);
	});
});

describe('cutCornerPoints', () => {
	it('cuts the corners named and leaves the rest square', () => {
		expect(cutCornerPoints(100, 20, { tl: 6, br: 6 })).toEqual([
			{ x: 0, y: 6 },
			{ x: 6, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 14 },
			{ x: 94, y: 20 },
			{ x: 0, y: 20 },
		]);
	});

	it('keeps a nearly empty gauge drawable by clamping its cuts to the box', () => {
		const points = cutCornerPoints(2, 20, { tl: 6, br: 6 });

		expect(points.every(({ x, y }) => x >= 0 && x <= 2 && y >= 0 && y <= 20)).toBe(true);
	});
});
