import { Link } from '@vanilla-bean/components';
import { Hub as BaseHub } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { ConsoleContainer } from './shared/ConsoleContainer.js';

const devButton = window.DEV_MODE
	? new Link({
			textContent: '> Dev Console',
			href: '#/dev',
			variant: 'button',
		})
	: null;

export default class Hub extends BaseHub {
	constructor(options, ...children) {
		super(
			{
				toolbar: {
					heading: 'SpaceCo // Mission Control',
					left: devButton ? [devButton] : [],
					createText: 'New Contract',
				},
				containerComponent: ConsoleContainer,
				noGamesText:
					'> [SYSTEM] Scanning for active drilling contracts...\n> Found 0\n> SpaceCo recommends starting one before shareholders start asking questions.',
				gamesFoundTextFn: count => `> [SYSTEM] Scanning for active drilling contracts...\n> Found ${count}`,
				buttons: {
					linkText: 'Link',
					infoText: 'Intel',
					joinText: 'Deploy',
					watchText: 'Overwatch',
				},
				popoverOptions: {
					infoRows: game => [
						...(game.world?.name ? [` - ${game.world.name} - `] : []),
						`Game: ${game.name}`,
						`Players: ${game.players.length}`,
					],
				},
				...options,
			},
			...children,
		);
	}
}
