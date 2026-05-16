import { Link, Button, Notify, copyToClipboard, randInt } from 'vanilla-bean-components';

import View from './shared/View.js';
import { getGames, onMessage } from './api';
import { GameList, GameListText } from './shared/GameList.js';
import GameInfoPopover from './shared/GameInfoPopover.js';
import { ConsoleContainer } from './shared/ConsoleContainer.js';

const devButton = window.DEV_MODE
	? new Link({
			textContent: '> Dev Console',
			href: '#/dev',
			variant: 'button',
		})
	: null;

export default class Hub extends View {
	constructor(options, ...children) {
		super(
			{
				toolbar: {
					heading: 'SpaceCo // Mission Control',
					left: devButton ? [devButton] : [],
					right: [
						new Link({
							textContent: 'New Contract',
							href: '#/create',
							variant: 'button',
						}),
					],
				},
				...options,
			},
			...children,
		);

		this.buttonOptions = {
			linkText: 'Link',
			infoText: 'Intel',
			joinText: 'Deploy',
			watchText: 'Overwatch',
		};

		this.noGamesText =
			'> [SYSTEM] Scanning for active drilling contracts...\n> Found 0\n> SpaceCo recommends starting one before shareholders start asking questions.';
		this.gamesFoundTextFn = count => `> [SYSTEM] Scanning for active drilling contracts...\n> Found ${count}`;

		this.options.onPointerUp = () => {
			if (this.gamePopover) this.gamePopover.elem.remove();
		};
	}

	async render() {
		super.render();

		const games = await getGames();

		if (games.response.status !== 200) {
			new Notify({
				type: 'error',
				content: games.body?.message || games.response.statusText,
				x: randInt(12, window.innerWidth - 12),
				y: randInt(72, window.innerHeight / 3),
			});
			return;
		}

		const socketCleanup = onMessage(data => {
			if (
				data.update === 'newGame' ||
				data.update === 'removedGame' ||
				data.update === 'addPlayer' ||
				data.update === 'removePlayer'
			) {
				games.invalidateCache();
				this.render();
			}
		});

		this.addCleanup('socketCleanup', () => socketCleanup());

		if (!games.body?.length) {
			this.container = new ConsoleContainer({
				appendTo: this._body,
				textContent: this.noGamesText,
			});
			return;
		}

		const gameList = new GameList({
			items: games.body.map(({ id, name, players }) => ({
				append: [
					new GameListText({ content: name }),
					new Button({
						content: this.buttonOptions.linkText,
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
						content: this.buttonOptions.infoText,
						onPointerPress: event => {
							event.stopPropagation();

							if (this.gamePopover) this.gamePopover.elem.remove();
							else this.gamePopover = new GameInfoPopover({ x: event.clientX, y: event.clientY, gameId: id });
						},
					}),
					new Link({
						content: this.buttonOptions.joinText,
						href: `#/join/${id}`,
						variant: 'button',
					}),
					new Link({
						content: this.buttonOptions.watchText,
						href: `#/watch/${id}`,
						variant: 'button',
					}),
					new GameListText({ content: `${players.length}` }),
				],
			})),
		});

		const gamesText = this.gamesFoundTextFn(games.body.length);

		this.container = new ConsoleContainer(
			{
				appendTo: this._body,
				textContent: gamesText,
			},
			gameList,
		);
	}
}
