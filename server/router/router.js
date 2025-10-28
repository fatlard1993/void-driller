import { nanoid } from 'nanoid';

import requestMatch from '../../byod-web-game/server/requestMatch';
import byodWebGameRoutes from '../../byod-web-game/server/router';
import { serverLog } from '../../utils/logger.js';

import devToolsRoutes from './devTools';
import gameRoutes from './game';
import staticRoutes from './static';

const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 300; // 300 requests per minute per IP (increased for asset-heavy game loads)

const checkRateLimit = ip => {
	const now = Date.now();
	const clientKey = ip || 'unknown';

	if (!requestCounts.has(clientKey)) {
		requestCounts.set(clientKey, []);
	}

	const requests = requestCounts.get(clientKey);

	// Remove old requests outside the time window
	const validRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
	requestCounts.set(clientKey, validRequests);

	// Add current request
	validRequests.push(now);

	if (validRequests.length > RATE_LIMIT_MAX_REQUESTS) {
		serverLog.warning('Rate limit exceeded', {
			ip: clientKey,
			requestCount: validRequests.length,
			timeWindow: RATE_LIMIT_WINDOW,
			maxRequests: RATE_LIMIT_MAX_REQUESTS,
		});
		return false;
	}

	// Log request counts to understand load patterns
	if (validRequests.length % 10 === 0 || validRequests.length > 50) {
		serverLog.info('Request count tracking', {
			ip: clientKey,
			requestCount: validRequests.length,
			timeWindow: RATE_LIMIT_WINDOW,
			maxRequests: RATE_LIMIT_MAX_REQUESTS,
		});
	}

	// Log suspicious activity (more than 80% of limit)
	if (validRequests.length > RATE_LIMIT_MAX_REQUESTS * 0.8) {
		serverLog.info('High request rate detected', {
			ip: clientKey,
			requestCount: validRequests.length,
			timeWindow: RATE_LIMIT_WINDOW,
			maxRequests: RATE_LIMIT_MAX_REQUESTS,
		});
	}

	return true;
};

const router = server => async request => {
	try {
		// Rate limiting check
		const clientIp = request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || 'unknown';

		if (!checkRateLimit(clientIp)) {
			return new Response('Rate limit exceeded. Please slow down your requests.', {
				status: 429,
				headers: { 'Retry-After': '60' },
			});
		}
		let match;
		let response;

		match = requestMatch('GET', '/', request);
		if (match) {
			const file = Bun.file('client/build/index.html');
			let content = await file.text();

			// Inject DEV_MODE flag in development
			const devModeScript = `<script>window.DEV_MODE = ${process.env.NODE_ENV === 'development'};</script>`;
			content = content.replace('</head>', `${devModeScript}</head>`);

			return new Response(content, {
				headers: {
					'Content-Type': 'text/html',
					'Access-Control-Allow-Origin': '*',
				},
			});
		}

		match = requestMatch('GET', '/ws', request);
		if (match) {
			const success = server.httpServer.upgrade(request, { data: { clientId: nanoid() } });

			return success
				? undefined
				: new Response(
						'WebSocket upgrade failed. Our comms technicians suggest turning it off and back on again (refresh).',
						{ status: 400 },
					);
		}

		response = await byodWebGameRoutes(request, server);
		if (response) return response;

		response = await devToolsRoutes(request, server);
		if (response) return response;

		response = await gameRoutes(request, server);
		if (response) return response;

		response = await staticRoutes(request, server);
		if (response) return response;
	} catch (error) {
		serverLog.error('Router error', { error: error.message, stack: error.stack });

		return new Response(
			'Corporate mainframe error: someone unplugged something important. Give us a moment to patch the hole.',
			{ status: 500 },
		);
	}
};
export default router;
