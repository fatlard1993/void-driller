import { Button, Dialog, Label, Input } from 'vanilla-bean-components';

import Notify from '../shared/Notify';
import { View } from '../layout';
import { exitGame, getGame } from '../api';
import gameContext from '../shared/gameContext';
import Game from './Game';
import ConsoleDialog from './ConsoleDialog';

export default class Play extends View {
	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Play',
					left: [
						new Button({
							content: 'Exit',
							onPointerPress: () => {
								this.options.removePlayerOnExit = true;

								new Dialog({
									size: 'small',
									style: { height: '144px' },
									header: 'Exiting',
									body: new Label(
										{
											label: 'Remove me from the game',
											inline: { after: true },
											styles: () => `
												bottom: 48px;
												position: absolute;
												width: calc(100% - 60px);
											`,
										},
										new Input({
											type: 'checkbox',
											value: true,
											onChange: ({ value }) => {
												this.options.removePlayerOnExit = value;
											},
										}),
									),
									buttons: ['Exit', 'Cancel'],
									onButtonPress: async ({ button, closeDialog }) => {
										if (button === 'Exit') {
											if (this.options.removePlayerOnExit) {
												const { response, body } = await exitGame();

												if (response.status !== 200) {
													new Notify({ type: 'error', content: body?.message || response.statusText });
												}
											}

											window.location.href = `#/hub`;
										}

										closeDialog();
									},
								});
							},
						}),
					],
					right: [new Button({ content: 'Console', onPointerPress: () => new ConsoleDialog() })],
				},
			},
			...children,
		);
	}

	async render() {
		super.render();

		gameContext.gameId = this.options.gameId;
		gameContext.playerId = localStorage.getItem(gameContext.gameId);

		if (!gameContext.playerId) {
			window.location.href = `#/join/${gameContext.gameId}`;

			return;
		}

		this.game = await getGame(gameContext.gameId);

		this.options.onDisconnected = () => {
			this.game.unsubscribe();
		};

		if (this.game.response.status !== 200) {
			new Notify({ type: 'error', content: this.game.body?.message || this.game.response.statusText });

			window.location.href = `#/hub`;

			return;
		}

		gameContext.serverState = this.game.body;

		if (!gameContext.serverState.players.find(({ id }) => id === gameContext.playerId)) {
			window.location.href = `#/join/${gameContext.gameId}`;

			return;
		}

		new Game({ appendTo: this._body });
	}
}
