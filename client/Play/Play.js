import { Button, styled } from '@vanilla-bean/components';

import { enterGame } from '@fatlard1993/web-game-framework/client';
import { View } from '@fatlard1993/web-game-framework/ui/layout';
import { ExitDialog } from '@fatlard1993/web-game-framework/ui/GameRoom';
import gameContext, { teardownGame } from '../shared/gameContext';
import { releaseInputOnClose } from '../shared/BaseDialog';
import { frameAttributes, frameCorner, frameDialogStyles } from '../shared/frame';
import Game from './Game';
import ConsoleDialog from './ConsoleDialog';
import { applyView, leave } from './reconcile';

// Aborting stops following the game first, so the view that drops this player isn't taken for being dropped
class AbortDialog extends styled(ExitDialog)`
	${frameDialogStyles(frameCorner.small)}
` {
	async exit() {
		this.options.beforeExit?.();
		await super.exit();
	}
}

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
										beforeExit: () => gameContext.leaveGame?.(),
										onExit: () => teardownGame(),
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
		const { gameId } = this.options;

		gameContext.serverState = null;
		gameContext.isWatchMode = false;

		// Opens the game as the player this browser joined as: the server hears they're here and sends each view of the
		// game from then on (applyView); a browser that isn't in it goes to join it
		const { game, leave: leaveGame } = await enterGame(gameId, {
			onState: applyView,
			notMember: () => (window.location.href = `#/join/${gameId}`),
			gone: () => leave('This contract is gone.', gameId),
		});

		if (!game || this.elem?.isConnected === false) return leaveGame();

		// Leaving (aborting the contract) stops following the game first
		gameContext.leaveGame = leaveGame;
		this.addCleanup('enterGame', leaveGame);
		gameContext.serverState = game;
		this._toolbar.options.heading = game.name;

		new Game({ appendTo: this._body });
	}
}
