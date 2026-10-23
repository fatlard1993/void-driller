import { describe, expect, it } from 'bun:test';

import { cutCorners } from './frame';

describe('cutCorners', () => {
	it('cuts only the corners named', () => {
		expect(cutCorners('6px', ['tl', 'br'])).toBe(
			'polygon(0 6px, 6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
		);
	});
});
