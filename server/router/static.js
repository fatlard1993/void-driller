import { serverLog } from '../../utils/logger.js';

const staticRouter = async request => {
	const path = decodeURIComponent(new URL(request.url).pathname);

	serverLog.debug('Static server request', { path });

	if (path.endsWith('.md') && (await Bun.file(path.slice(1)).exists())) {
		serverLog.debug('Loading Markdown', { path });

		return Response.json((await import(`../../${path}`))?.default);
	}

	const possiblePaths = [
		`client/build${path}`,
		`node_modules${path}`,
		`client${path}`,
		path.startsWith('/') ? path.slice(1) : path,
		`../node_modules${path}`,
		`../node_modules/vanilla-bean-components/node_modules/${path}`,
	];

	let file = null;
	let foundPath = null;

	for (const testPath of possiblePaths) {
		file = Bun.file(testPath);
		if (await file.exists()) {
			foundPath = testPath;
			serverLog.debug('Found file', { path: testPath });
			break;
		}
	}

	if (!foundPath) {
		serverLog.warning('File not found', { requestedPath: path, attemptedPaths: possiblePaths });
		return new Response(
			`File not found. SpaceCo archives are vast, but apparently not infinite. Verify your link: ${path}`,
			{ status: 404 },
		);
	}

	// Get proper Content-Type for the file
	const contentType = getContentType(path);

	return new Response(file, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			Pragma: 'no-cache',
			Expires: '0',
			'Access-Control-Allow-Origin': '*',
		},
	});
};

// Helper function to determine content type
/**
 *
 * @param path
 */
function getContentType(path) {
	const ext = path.toLowerCase().split('.').pop();
	const mimeTypes = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		wav: 'audio/wav',
		mp3: 'audio/mpeg',
		js: 'application/javascript',
		css: 'text/css',
		html: 'text/html',
		json: 'application/json',
	};
	return mimeTypes[ext] || 'application/octet-stream';
}
export default staticRouter;
