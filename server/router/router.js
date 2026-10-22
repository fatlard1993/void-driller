import { basicGameRoutes } from '@fatlard1993/web-game-framework';
import { serverLog } from '../../utils/logger.js';

import devToolsRoutes from './devTools';
import gameRoutes from './game';
import staticRoutes from './static';

const gameCrudRoutes = basicGameRoutes({ logger: serverLog });

// The Server takes socket upgrades first, and answers a thrown error (withErrors)
const router = server => async request =>
	(await gameCrudRoutes(request, server)) ??
	(await devToolsRoutes(request, server)) ??
	(await gameRoutes(request, server)) ??
	(await staticRoutes(request, server));

export default router;
