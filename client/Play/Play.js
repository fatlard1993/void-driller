import { Button, Dialog, Label, Input } from '@vanilla-bean/components';

import { View } from '@fatlard1993/web-game-framework/ui/layout';
import Notify from '../shared/Notify';
import { exitGame, getGame } from '../api';
import gameContext from '../shared/gameContext';
import Game from './Game';
import ConsoleDialog from './ConsoleDialog';

export default class Play extends View {
	static schema = {
		gameId: {},
	};

	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Loading...',
					left: [
						new Button({
							content: 'Abort Contract',
							onPointerPress: () => {
								this.removePlayerOnExit = true;

								gameContext.openDialog = new Dialog({
									size: 'small',
									header: 'Abort Contract',
									body: new Label(
										{
											label:
												'Terminating this drilling contract will remove you from the operation.\nThis action cannot be undone. Are you sure you want to proceed?',
											variant: 'inline-after',
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
												this.removePlayerOnExit = value;
											},
										}),
									),
									buttons: ['Abort Contract', 'Cancel'],
									onButtonPress: async ({ button, closeDialog }) => {
										if (button === 'Abort Contract') {
											if (this.removePlayerOnExit) {
												const { response, body } = await exitGame();

												if (response.status !== 200) {
													new Notify({ type: 'error', content: body?.message || response.statusText });
												}
											}

											// Stop any playing audio and music before navigating away
											if (gameContext.audioPlayer) {
												gameContext.audioPlayer.stop();
											}
											if (gameContext.musicManager) {
												gameContext.musicManager.stop();
											}

											window.location.href = `#/hub`;
										}

										closeDialog();
									},
								});
							},
						}),
					],
					right: [
						new Button({
							content: 'Console',
							onPointerPress: () => {
								gameContext.openDialog = new ConsoleDialog();
							},
						}),
					],
				},
			},
			...children,
		);
	}

	build() {
		super.build();
		this._init();
	}

	async _init() {
		gameContext.gameId = this.options.gameId;
		gameContext.playerId = localStorage.getItem(gameContext.gameId);

		if (!gameContext.playerId) {
			window.location.href = `#/join/${gameContext.gameId}`;

			return;
		}

		this.game = await getGame(gameContext.gameId);

		if (this.game.response.status !== 200) {
			new Notify({ type: 'error', content: this.game.body?.message || this.game.response.statusText });

			localStorage.removeItem(this.options.gameId);

			window.location.href = `#/hub`;

			return;
		}

		gameContext.serverState = this.game.body;

		if (!gameContext.serverState.players.find(({ id }) => id === gameContext.playerId)) {
			window.location.href = `#/join/${gameContext.gameId}`;

			return;
		}

		this._toolbar.options.heading = this.game.body.name;

		new Game({ appendTo: this._body });
	}
}
