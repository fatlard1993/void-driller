import { Link, Button, Notify, Form, randInt } from '@vanilla-bean/components';

import View from './shared/View.js';
import { getGame, joinGame } from './api';
import { playerName } from '../utils';
import { ConsoleContainer } from './shared/ConsoleContainer.js';

export default class Join extends View {
	constructor(options, ...children) {
		super(
			{
				toolbar: {
					heading: 'Join Mission',
					left: [
						new Link({
							content: 'Void Contract',
							href: '#/hub',
							variant: 'button',
						}),
					],
					right: [
						new Button({
							content: 'Deploy',
							onPointerPress: async () => {
								if (this.form.hasErrors()) return;

								const join = await joinGame(this.options.gameId, {
									body: { ...this.form.options.data, playerId: localStorage.getItem(this.options.gameId) },
								});

								if (join.status !== 'success') {
									return new Notify({
										type: 'error',
										content: join.body?.message || join.body?.error || String(join.body),
										x: randInt(12, window.innerWidth - 12),
										y: randInt(72, window.innerHeight / 3),
									});
								}

								localStorage.setItem(this.options.gameId, join.body.id);
								localStorage.setItem('lastName', join.body.name);

								window.location.href = `#/play/${this.options.gameId}`;
							},
						}),
					],
				},
				formData: {
					name: localStorage.getItem('lastName') || playerName(),
				},
				formInputs: [{ key: 'name', label: 'Driller Name' }],
				...options,
			},
			...children,
		);
	}

	build() {
		super.build();
		this._init();
	}

	async _init() {
		const playerId = localStorage.getItem(this.options.gameId);

		const game = await getGame(this.options.gameId);

		if (game.response.status !== 200) {
			new Notify({ type: 'error', content: game.body?.message || game.response.statusText });

			localStorage.removeItem(this.options.gameId);

			window.location.href = '#/hub';

			return;
		}

		if (playerId && game.body.players.some(({ id }) => id === playerId)) {
			window.location.href = `#/play/${this.options.gameId}`;

			return;
		}

		this.form = new Form({
			style: {
				margin: '12px 0 12px 12px',
				paddingRight: '12px',
			},
			data: this.options.subscriber('formData'),
			inputs: this.options.subscriber('formInputs'),
		});

		const containerText = `> [SYSTEM] Initiating void driller contract for Operation: ${game.body.name}.\n> Please identify yourself. Unidentified drillers will be reclassified as debris.`;

		this.container = new ConsoleContainer(
			{
				appendTo: this._body,
				textContent: containerText,
			},
			this.form,
		);
	}
}
