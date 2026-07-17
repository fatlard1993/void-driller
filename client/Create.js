import { Select } from '@vanilla-bean/components';
import { Create as BaseCreate } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { worlds } from '../constants';
import { contractName } from '../utils';
import { ConsoleContainer } from './shared/ConsoleContainer.js';

export default class Create extends BaseCreate {
	constructor(options, ...children) {
		super(
			{
				toolbar: {
					heading: 'New Drilling Contract',
					createText: 'Authorize Contract',
				},
				formData: {
					name: contractName(),
					worldName: 'L1: Training Shallows',
				},
				formInputs: [
					{ key: 'name', label: 'Contract ID' },
					...(window.DEV_MODE
						? [
								{
									InputComponent: Select,
									key: 'worldName',
									label: 'World',
									options: worlds.map(({ name }) => name),
								},
							]
						: []),
				],
				containerComponent: ConsoleContainer,
				containerText:
					'> [SYSTEM] Initiating contract.\n> Fill out required fields used by Mission Control to track your drilling op.',
				...options,
			},
			...children,
		);
	}
}
