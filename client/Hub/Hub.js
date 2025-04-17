import { Link, Button, copyToClipboard } from 'vanilla-bean-components';

import Notify from '../shared/Notify';
import { View } from '../layout';
import { getGames } from '../api';
import { onMessage } from '../socket';
import { GameList, GameListText } from './GameList';
import GameInfoPopover from './GameInfoPopover';

export default class Hub extends View {
	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Hub',
					right: [new Link({ textContent: 'Create Game', href: '#/create', variant: 'button' })],
				},
			},
			...children,
		);

		this.options.onPointerUp = () => {
			if (this.gamePopover) this.gamePopover.elem.remove();
		};
	}

	async render() {
		super.render();

		const games = await getGames();

		if (games.response.status !== 200) {
			new Notify({ type: 'error', content: games.body?.message || games.response.statusText });
			return;
		}

		const socketCleanup = onMessage(data => {
			if (data.update === 'newGame' || data.update === 'removedGame') {
				games.invalidateCache();
				this.render();
			}
		});

		this.addCleanup('socketCleanup', () => socketCleanup());

		this._body.append(
			new GameList({
				items: games.body.map(({ id, name, players }) => ({
					append: [
						new GameListText({ content: name }),
						new Button({
							content: 'Share',
							onPointerPress: event => {
								event.stopPropagation();

								copyToClipboard(`${window.location.origin}#/join/${id}`);

								new Notify({
									x: event.clientX,
									y: event.clientY,
									content: 'Copied link to clipboard!',
									type: 'success',
									timeout: 1300,
								});
							},
						}),
						new Button({
							content: 'Info',
							onPointerPress: event => {
								event.stopPropagation();

								if (this.gamePopover) this.gamePopover.elem.remove();
								else this.gamePopover = new GameInfoPopover({ x: event.clientX, y: event.clientY, gameId: id });
							},
						}),
						new Link({ content: 'Join', href: `#/join/${id}`, variant: 'button' }),
						new GameListText({ content: `${players.length}` }),
					],
				})),
			}),
		);
	}
}
