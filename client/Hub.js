import { configured } from 'vanilla-bean-components';

import { Hub } from '../byod-web-game/client/GameRoom';
import { ConsoleContainer } from './shared/ConsoleContainer';

export default configured(Hub, {
	toolbar: {
		heading: 'SpaceCo // Mission Control',
		createText: 'New Contract',
		createHref: '#/create',
	},
	buttons: {
		linkText: 'Link',
		infoText: 'Intel',
		joinText: 'Deploy',
	},
	containerComponent: ConsoleContainer,
	noGamesText:
		'> [SYSTEM] Scanning for active drilling contracts...\n> Found 0\n> SpaceCo recommends starting one before shareholders start asking questions.',
	gamesFoundTextFn: count => `> [SYSTEM] Scanning for active drilling contracts...\n> Found ${count}`,
});
