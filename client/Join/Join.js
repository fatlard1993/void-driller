import { Component, Link, Button, Form, styled } from 'vanilla-bean-components';

import { View } from '../layout';
import { getGame, joinGame } from '../api/game';
import Notify from '../shared/Notify';

const Heading = styled(
	Component,
	() => `
		font-size: 1.5em;
		text-align: center;
		margin: 0 0 12px;
	`,
	{ tag: 'h2' },
);

export default class Join extends View {
	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Join',
					left: [new Link({ content: 'Cancel', href: '#/hub', variant: 'button' })],
					right: [
						new Button({
							content: 'Play',
							onPointerPress: async () => {
								if (this.form.validate()) return;

								const join = await joinGame(this.options.gameId, {
									body: { ...this.form.options.data, playerId: localStorage.getItem(this.options.gameId) },
								});

								if (!join.success) return new Notify({ type: 'error', content: join.body });

								localStorage.setItem(this.options.gameId, join.body.id);
								localStorage.setItem('lastName', join.body.name);

								window.location.href = `#/play/${this.options.gameId}`;
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

		const name = localStorage.getItem('lastName') || '';
		const playerId = localStorage.getItem(this.options.gameId);

		const game = await getGame(this.options.gameId);

		if (game.response.status !== 200) {
			new Notify({ type: 'error', content: game.body?.message || game.response.statusText });

			window.location.href = '#/hub';

			return;
		}

		if (playerId && game.body.players.some(({ id }) => id === playerId)) {
			window.location.href = `#/play/${this.options.gameId}`;

			return;
		}

		new Heading({ appendTo: this._body, content: game.body.name });

		this.form = new Form({
			appendTo: this._body,
			styles: () => `
				margin: 12px 0 12px 12px;
				padding-right: 12px;
			`,
			data: { name },
			inputs: [{ key: 'name', label: 'Player Name', validations: [[/.+/, 'Required']] }],
		});
	}
}
