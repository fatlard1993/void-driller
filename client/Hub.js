import { configured, Link } from 'vanilla-bean-components';

import { Hub } from '../byod-web-game/client/GameRoom';
import { ConsoleContainer } from './shared/ConsoleContainer';

const devButton = window.DEV_MODE
	? new Link({
			textContent: '> Dev Console',
			href: '#/dev',
			variant: 'button',
		})
	: null;

export default configured(Hub, {
	toolbar: {
		heading: 'SpaceCo // Mission Control',
		createText: 'New Contract',
		createHref: '#/create',
		...(devButton && { left: [devButton] }),
	},
	buttons: {
		linkText: 'Link',
		infoText: 'Intel',
		joinText: 'Deploy',
		watchText: 'Overwatch',
	},
	containerComponent: ConsoleContainer,
	noGamesText:
		'> [SYSTEM] Scanning for active drilling contracts...\n> Found 0\n> SpaceCo recommends starting one before shareholders start asking questions.',
	gamesFoundTextFn: count => `> [SYSTEM] Scanning for active drilling contracts...\n> Found ${count}`,
});
