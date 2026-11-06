import { Link, failureReason } from '@vanilla-bean/components';
import { View } from '@fatlard1993/web-game-framework/ui/layout';
import Notify from '../shared/Notify';
import gameContext from '../shared/gameContext';
import WatchGame from './WatchGame';
import { getGameWhenLoaded } from '../Play/reconcile';

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

		this.game = await getGameWhenLoaded(gameContext.gameId);

		if (this.game.status === 'error') {
			new Notify({ intent: 'danger', content: failureReason(this.game) });

			window.location.href = `#/hub`;

			return;
		}

		gameContext.serverState = this.game.body;

		this._toolbar.options.heading = `Watch Mode - ${this.game.body.name}`;

		new WatchGame({ appendTo: this._body });
	}
}
