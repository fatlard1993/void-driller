import { expect, test } from 'bun:test';

import router from './router';

const DomResponse = globalThis.Response;
const route = router({ httpServer: { upgrade: () => true } });

// happy-dom's Request drops Origin and Host, so the guard is given request-shaped objects
const request = (method, path, headers = {}) => ({
	method,
	url: `http://driller.lan:1040${path}`,
	headers: new Headers({ host: 'driller.lan:1040', ...headers }),
});

test("another site's page can't open a game socket or act in a game", async () => {
	globalThis.Response = (await Bun.fetch('data:,')).constructor;

	try {
		const upgrade = await route(request('GET', '/ws', { origin: 'https://evil.example', upgrade: 'websocket' }));
		const write = await route(request('POST', '/games', { origin: 'https://evil.example' }));

		expect(upgrade.status).toBe(403);
		expect(write.status).toBe(403);
		expect(
			await route(request('GET', '/ws', { origin: 'http://driller.lan:1040', upgrade: 'websocket' })),
		).toBeUndefined();
	} finally {
		globalThis.Response = DomResponse;
	}
});
