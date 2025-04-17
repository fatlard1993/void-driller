import { Link, Button, Form, Select } from 'vanilla-bean-components';

import worlds from '../../worlds';
import { simpleId } from '../../utils';
import { View } from '../layout';
import { createGame } from '../api';

export default class Create extends View {
	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Create',
					left: [new Link({ textContent: 'Cancel', href: '#/hub', variant: 'button' })],
					right: [
						new Button({
							textContent: 'Create',
							onPointerPress: async () => {
								if (this.form.validate()) return;

								const game = (await createGame({ body: { ...this.form.options.data } })).body;

								window.location.href = `#/join/${game.id}`;
							},
						}),
					],
				},
			},
			...children,
		);
	}

	async render() {
		super.render();

		const formData = {
			name: simpleId(),
		};

		this.form = new Form({
			appendTo: this._body,
			styles: () => `
				margin: 12px 0 12px 12px;
				padding-right: 12px;
			`,
			data: formData,
			inputs: [
				{ key: 'name', label: 'Room Name' },
				{
					InputComponent: Select,
					key: 'worldName',
					label: 'World',
					options: worlds.map(({ name }) => name),
					value: 'one',
				},
			],
		});
	}
}
