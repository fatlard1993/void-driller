import { resolve, sep } from 'path';

import { serveApp, serveStatic } from '@vanilla-bean/components/app';

import { serverLog } from '../../utils/logger.js';

const DOCS = resolve('docs');

// Briefings and help come from docs/ as parsed markdown, through the runtime markdown loader
const serveMarkdown = async path => {
	const file = resolve(`.${path}`);

	if (!file.startsWith(DOCS + sep) || path.split('/').some(segment => segment.startsWith('.'))) return;
	if (!(await Bun.file(file).exists())) return;

	serverLog.debug('Loading Markdown', { path });

	return Response.json((await import(file))?.default);
};

const staticRouter = async request => {
	let path;

	try {
		path = decodeURIComponent(new URL(request.url).pathname);
	} catch {
		return new Response('Bad path', { status: 400 });
	}

	if (path.endsWith('.md')) {
		const markdown = await serveMarkdown(path);

		if (markdown) return markdown;
	}

	// The page and its build, then the sprites and sounds the client loads by url, then the briefing audio in docs/
	const response =
		(await serveApp(request, { api: '/games/', packages: ['augmented-ui'] })) ??
		(await serveStatic(request, { root: 'client' })) ??
		(path.startsWith('/docs/') ? await serveStatic(request, { root: '.' }) : undefined);

	if (response) return response;

	serverLog.warning('File not found', { requestedPath: path });

	return new Response(
		`File not found. SpaceCo archives are vast, but apparently not infinite. Verify your link: ${path}`,
		{ status: 404 },
	);
};

export default staticRouter;
