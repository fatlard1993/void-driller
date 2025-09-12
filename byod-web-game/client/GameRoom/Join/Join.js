import { Link, Button, Notify, Form, randInt } from 'vanilla-bean-components';

import { View } from '../../layout';
import { getGame, joinGame } from '../../api';

export default class Join extends View {
	constructor(options, ...children) {
		super(
			{
				formInputs: [{ key: 'name', label: 'Player Name' }],
				...options,
				toolbar: {
					heading: options.toolbar?.heading || 'Join Game',
					left: [
						new Link({
							content: options.toolbar?.backText || 'Back to Hub',
							href: options.toolbar?.backHref || '#/hub',
							variant: 'button',
						}),
					],
					right: [
						new Button({
							content: options.toolbar?.joinText || 'Join',
							onPointerPress: async () => {
								if (this.form.validate()) return;

								const join = await joinGame(this.options.gameId, {
									body: { ...this.form.options.data, playerId: localStorage.getItem(this.options.gameId) },
								});

								if (!join.success) {
									return new Notify({
										type: 'error',
										content: join.body,
										x: randInt(12, window.innerWidth - 12),
										y: randInt(72, window.innerHeight / 3),
									});
								}

								localStorage.setItem(this.options.gameId, join.body.id);
								localStorage.setItem('lastName', join.body.name);

								const playUrl = options.playUrl || `#/play/${this.options.gameId}`;
								window.location.href = playUrl;
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

		// Allow games to provide their own container component and content
		if (this.options.containerComponent) {
			const ContainerComponent = this.options.containerComponent;
			let containerText = this.options.containerText;

			// Support dynamic text generation based on game data
			if (this.options.containerTextProvider && typeof this.options.containerTextProvider === 'function') {
				containerText = this.options.containerTextProvider(game.body);
			} else if (!containerText) {
				containerText = `> [SYSTEM] Joining game: ${game.body.name}.\n> Please identify yourself.`;
			}

			this.container = new ContainerComponent(
				{
					appendTo: this._body,
					textContent: containerText,
				},
				this.form,
			);
		} else {
			// Default behavior - append the form directly
			this._body.append(this.form);
		}
	}
}
