import { configured } from 'vanilla-bean-components';

import { Join } from '../byod-web-game/client/GameRoom';

import { playerName } from '../utils';
import { ConsoleContainer } from './shared/ConsoleContainer';

export default configured(Join, {
	formData: {
		name: localStorage.getItem('lastName') || playerName(),
	},
	formInputs: [{ key: 'name', label: 'Driller Name' }],
	toolbar: {
		heading: 'Join Mission',
		backText: 'Void Contract',
		joinText: 'Deploy',
	},
	containerComponent: ConsoleContainer,
	containerTextProvider: game =>
		`> [SYSTEM] Initiating void driller contract for Operation: ${game.name}.\n> Please identify yourself. Unidentified drillers will be reclassified as debris.`,
});
