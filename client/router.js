import { Router } from 'vanilla-bean-components';

import Create from './Create';
import Hub from './Hub';
import Join from './Join';
import Play from './Play';

const paths = { create: '/create', hub: '/hub', join: '/join/:gameId', play: '/play/:gameId' };
const views = {
	[paths.create]: Create,
	[paths.hub]: Hub,
	[paths.join]: Join,
	[paths.play]: Play,
};

const router = new Router({ views, defaultPath: paths.hub });

export default router;
