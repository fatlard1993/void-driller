import { EmptyState, Link } from '@vanilla-bean/components';
import { enterGame } from '@fatlard1993/web-game-framework/client';
import { View } from '@fatlard1993/web-game-framework/ui/layout';
import gameContext from '../shared/gameContext';
import WatchGame from './WatchGame';
import { applyView, leave } from '../Play/reconcile';

export default class Watch extends View {
	static schema = {
		gameId: {},
	};

	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Watch Mode - Loading...',
					left: [
						new Link({
							textContent: 'Back to Hub',
							href: '#/hub',
							variant: 'button',
						}),
					],
					right: [
						new Link({
							textContent: 'Deploy',
							href: `#/join/${options.gameId}`,
							variant: 'button',
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

		// Spectator only: no player of this browser's, and the server sends the watcher's view of each change
		gameContext.serverState = null;
		gameContext.isWatchMode = true;

		// Until the game's first view is in
		const loading = new EmptyState({ loading: true, appendTo: this._body });

		const { game, leave: leaveGame } = await enterGame(gameId, {
			watch: true,
			onState: applyView,
			gone: () => leave('This contract is gone.', gameId),
		});

		loading.destroy();

		if (!game || this.elem?.isConnected === false) return leaveGame();

		this.addCleanup('enterGame', leaveGame);
		gameContext.serverState = game;
		this._toolbar.options.heading = `Watch Mode - ${game.name}`;

		new WatchGame({ appendTo: this._body });
	}
}
