import { Link } from '@vanilla-bean/components';
import { View } from '@fatlard1993/web-game-framework/ui/layout';
import Notify from '../shared/Notify';
import { getGame } from '../api';
import gameContext from '../shared/gameContext';
import WatchGame from './WatchGame';

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
		gameContext.gameId = this.options.gameId;
		// Watch mode doesn't need a playerId - it's spectator only
		gameContext.playerId = null;
		gameContext.isWatchMode = true;

		this.game = await getGame(gameContext.gameId);

		if (this.game.response.status !== 200) {
			new Notify({ type: 'error', content: this.game.body?.message || this.game.response.statusText });

			window.location.href = `#/hub`;

			return;
		}

		gameContext.serverState = this.game.body;

		this._toolbar.options.heading = `Watch Mode - ${this.game.body.name}`;

		new WatchGame({ appendTo: this._body });
	}
}
