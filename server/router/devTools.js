import { generateAsteroid } from '../generateAsteroid.js';
import requestMatch from '../../byod-web-game/server/requestMatch';
import { serverLog } from '../../utils/logger.js';

/**
 * Development tools API endpoints
 * Only accessible when NODE_ENV === 'development'
 * @param request
 */
export default async (request) => {
	if (process.env.NODE_ENV !== 'development') {
		return null; // Fall through to next router
	}

	let match;

	// Get all world configurations
	match = requestMatch('GET', '/api/dev/worlds', request);
	if (match) {
		try {
			const { worlds } = await import('../../constants/worlds.js?t=' + Date.now());
			serverLog.debug('DevTools: Loaded world configurations', { count: worlds.length });

			return new Response(JSON.stringify(worlds), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (error) {
			serverLog.error('DevTools: Failed to load worlds', { error: error.message });
			return new Response(
				JSON.stringify({
					error: 'Failed to load worlds',
					message: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}
	}

	// Generate asteroid from configuration
	match = requestMatch('POST', '/api/dev/generate-asteroid', request);
	if (match) {
		try {
			const config = await request.json();
			serverLog.debug('DevTools: Generating asteroid', { worldId: config.id });

			// Load base world configuration if ID provided
			let baseWorldConfig = {};
			if (config.id) {
				const { worlds } = await import('../../constants/worlds.js?t=' + Date.now());
				baseWorldConfig = worlds.find(w => w.id === config.id) || {};
			}

			// Merge configurations
			const merged = { ...baseWorldConfig };
			Object.keys(config).forEach(key => {
				if (config[key] !== undefined) {
					merged[key] = config[key];
				}
			});
			const serverConfig = JSON.parse(JSON.stringify(merged));

			// Detect ground format
			if (serverConfig.ground?.base && serverConfig.ground?.veins) {
				serverConfig.groundFormat = 'veins';
			}

			// Generate asteroid
			const result = generateAsteroid(serverConfig, {});

			serverLog.debug('DevTools: Generation complete', {
				dimensions: `${result.width}x${result.depth}`,
			});

			return new Response(JSON.stringify(result), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (error) {
			serverLog.error('DevTools: Generation failed', { error: error.message });
			return new Response(
				JSON.stringify({
					error: 'Generation failed',
					message: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}
	}

	// Save world configuration back to constants/worlds.js
	match = requestMatch('POST', '/api/dev/save-world', request);
	if (match) {
		try {
			const { worldId, config } = await request.json();
			serverLog.info('DevTools: Saving world configuration', { worldId });

			const configPath = './constants/worlds.js';
			const currentContent = await Bun.file(configPath).text();

			// Load existing worlds
			const { worlds } = await import('../../constants/worlds.js?t=' + Date.now());

			// Find and update the specific world
			const worldIndex = worlds.findIndex(w => w.id === worldId);
			if (worldIndex === -1) {
				throw new Error(`World with ID '${worldId}' not found`);
			}

			const updatedWorlds = [...worlds];
			updatedWorlds[worldIndex] = { ...updatedWorlds[worldIndex], ...config };

			// Preserve file structure
			const startMarker = 'export const worlds = [';
			const endMarker = '];';

			const startIndex = currentContent.indexOf(startMarker);
			const endIndex = currentContent.lastIndexOf(endMarker);

			if (startIndex === -1 || endIndex === -1) {
				throw new Error('Could not find worlds array in file');
			}

			const beforeArray = currentContent.substring(0, startIndex + startMarker.length);
			const afterArray = currentContent.substring(endIndex);

			// Generate new content
			const worldsJson = JSON.stringify(updatedWorlds, null, 4);
			const newContent = beforeArray + '\n' + worldsJson.slice(1, -1) + '\n' + afterArray;

			// Write back
			await Bun.write(configPath, newContent);

			serverLog.info('DevTools: World configuration saved', { worldId, path: configPath });

			return new Response(
				JSON.stringify({
					success: true,
					message: 'World configuration saved successfully',
					worldId,
					path: configPath,
				}),
				{
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				},
			);
		} catch (error) {
			serverLog.error('DevTools: Save failed', { error: error.message });
			return new Response(
				JSON.stringify({
					error: 'World save failed',
					message: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}
	}

	return null; // No match, fall through
};
