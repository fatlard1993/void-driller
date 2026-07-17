import { Join as BaseJoin } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { playerName } from '../utils';
import { ConsoleContainer } from './shared/ConsoleContainer.js';

export default class Join extends BaseJoin {
	constructor(options, ...children) {
		super(
			{
				toolbar: {
					heading: 'Join Mission',
					backText: 'Void Contract',
					joinText: 'Deploy',
				},
				formData: {
					name: localStorage.getItem('lastName') || playerName(),
				},
				formInputs: [{ key: 'name', label: 'Driller Name' }],
				containerComponent: ConsoleContainer,
				containerTextProvider: game =>
					`> [SYSTEM] Initiating void driller contract for Operation: ${game.name}.\n> Please identify yourself. Unidentified drillers will be reclassified as debris.`,
				...options,
			},
			...children,
		);
	}
}
