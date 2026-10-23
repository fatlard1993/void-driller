import { Button, styled } from '@vanilla-bean/components';
import { failureReason } from '@vanilla-bean/hypertether';

import { View } from '@fatlard1993/web-game-framework/ui/layout';
import { ExitDialog } from '@fatlard1993/web-game-framework/ui/GameRoom';
import Notify from '../shared/Notify';
import { getGame } from '../api';
import gameContext from '../shared/gameContext';
import { releaseInputOnClose } from '../shared/BaseDialog';
import { frameAttributes, frameCorner, frameDialogStyles } from '../shared/frame';
import Game from './Game';
import ConsoleDialog from './ConsoleDialog';

const AbortDialog = styled(ExitDialog)`
	${frameDialogStyles(frameCorner.small)}
`;

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
								gameContext.openDialog = releaseInputOnClose(
									new AbortDialog({
										...frameAttributes,
										gameId: gameContext.gameId,
										playerId: gameContext.playerId,
										header: 'Abort Contract',
										confirmLabel: 'Abort Contract',
										label:
											'Terminating this drilling contract will remove you from the operation.\nThis action cannot be undone. Are you sure you want to proceed?',
										onExit: () => {
											gameContext.audioPlayer?.stop();
											gameContext.musicManager?.stop();
										},
									}),
								);
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

		if (this.game.status === 'error') {
			new Notify({ type: 'error', content: failureReason(this.game) });

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
