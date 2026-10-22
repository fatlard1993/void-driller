import { describe, expect, test } from 'bun:test';

import { handleDevCommand } from './devConsole.js';

describe('fuck', () => {
	test('checks the port the server listens on', async () => {
		const lines = [];
		const log = console.log;
		const kill = process.kill;
		console.log = line => lines.push(line);
		process.kill = () => {};

		try {
			await handleDevCommand('fuck', { port: 54321, games: {} });
		} finally {
			console.log = log;
			process.kill = kill;
		}

		expect(lines.join('\n')).toContain('port 54321');
		expect(lines.join('\n')).not.toContain('3000');
		expect(lines.join('\n')).not.toContain('Failed to check');
	});
});
