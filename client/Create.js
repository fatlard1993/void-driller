import { Link, Button, Form, Select } from '@vanilla-bean/components';

import View from './shared/View.js';
import { createGame } from './api';
import { worlds } from '../constants';
import { contractName } from '../utils';
import { ConsoleContainer } from './shared/ConsoleContainer.js';

export default class Create extends View {
	constructor(options, ...children) {
		super(
			{
				toolbar: {
					heading: 'New Drilling Contract',
					left: [
						new Link({
							textContent: 'Back to Hub',
							href: '#/hub',
							variant: 'button',
						}),
					],
					right: [
						new Button({
							textContent: 'Authorize Contract',
							onPointerPress: async () => {
								if (this.form.hasErrors()) return;

								const game = (await createGame({ body: { ...this.form.options.data } })).body;

								window.location.href = `#/join/${game.id}`;
							},
						}),
					],
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
				...options,
			},
			...children,
		);
	}

	build() {
		super.build();

		this.form = new Form({
			style: {
				margin: '12px 0 12px 12px',
				paddingRight: '12px',
			},
			data: this.options.subscriber('formData'),
			inputs: this.options.subscriber('formInputs'),
		});

		this.container = new ConsoleContainer(
			{
				appendTo: this._body,
				textContent:
					'> [SYSTEM] Initiating contract.\n> Fill out required fields used by Mission Control to track your drilling op.',
			},
			this.form,
		);
	}
}
