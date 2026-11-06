import { describe, expect, test } from 'bun:test';

import { persistWithin } from './persistWithin';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('persistWithin', () => {
	test('constant change still reaches the disk every atMost, and once more when it settles', async () => {
		const writes = [];
		const save = persistWithin(() => writes.push(Date.now()), { settle: 40, atMost: 100 });
		const start = Date.now();

		for (let i = 0; i < 30; i++) {
			save();
			await sleep(10);
		}

		expect(writes.length).toBeGreaterThanOrEqual(2);
		expect(writes[0] - start).toBeLessThan(250);

		await sleep(80);

		expect(writes.at(-1)).toBeGreaterThan(start + 300);
	});

	test('flush writes a pending save now, and nothing when none is pending', () => {
		let writes = 0;
		const save = persistWithin(() => writes++, { settle: 1000, atMost: 5000 });

		save.flush();
		expect(writes).toBe(0);

		save();
		save.flush();
		expect(writes).toBe(1);
	});
});
