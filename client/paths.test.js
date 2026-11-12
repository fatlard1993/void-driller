import { describe, expect, it } from 'bun:test';

import { href, paths } from './paths';

describe('href', () => {
	it('links to a path with no params', () => {
		expect(href(paths.hub)).toBe('#/hub');
	});

	it('fills in a path’s params', () => {
		expect(href(paths.join, { gameId: 'abc123' })).toBe('#/join/abc123');
	});
});
