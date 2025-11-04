import { Router } from 'vanilla-bean-components';

import Create from './Create';
import DevTools from './DevTools';
import Hub from './Hub';
import Join from './Join';
import Play from './Play';
import Watch from './Watch/Watch';

const paths = {
	create: '/create',
	hub: '/hub',
	join: '/join/:gameId',
	play: '/play/:gameId',
	watch: '/watch/:gameId',
	dev: '/dev',
};

const views = {
	[paths.create]: Create,
	[paths.hub]: Hub,
	[paths.join]: Join,
	[paths.play]: Play,
	[paths.watch]: Watch,
};

// Add dev tools route only in development mode
if (window.DEV_MODE) {
	views[paths.dev] = DevTools;
}

const router = new Router({ views, defaultPath: paths.hub });

export default router;
