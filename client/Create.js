import { Select, configured } from 'vanilla-bean-components';

import { Create } from '../byod-web-game/client/GameRoom';

import { worlds } from '../constants';
import { contractName } from '../utils';
import { ConsoleContainer } from './shared/ConsoleContainer';

export default configured(Create, {
	formData: {
		name: contractName(),
		worldName: 'Training Shallows',
	},
	formInputs: [
		{ key: 'name', label: 'Contract ID' },
		{
			InputComponent: Select,
			key: 'worldName',
			label: 'World',
			options: worlds.map(({ name }) => name),
		},
	],
	toolbar: {
		heading: 'New Drilling Contract',
		backText: 'Back to Hub',
		createText: 'Authorize Contract',
	},
	containerComponent: ConsoleContainer,
	containerText:
		'> [SYSTEM] Initiating contract.\n> Fill out required fields used by Mission Control to track your drilling op.',
});
