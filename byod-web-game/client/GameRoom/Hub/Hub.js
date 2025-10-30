import { Link, Button, Notify, copyToClipboard, randInt } from 'vanilla-bean-components';

import { View } from '../../layout';
import { getGames } from '../../api';
import { onMessage } from '../../socket';
import { GameList, GameListText } from './GameList';
import GameInfoPopover from './GameInfoPopover';

export default class Hub extends View {
	constructor(options, ...children) {
		console.log('Hub constructor options:', {
			options,
			containerComponent: !!options.containerComponent,
			noGamesText: !!options.noGamesText,
		});

		// Extract Hub-specific options that shouldn't be passed to parent
		const {
			containerComponent,
			noGamesText,
			gamesFoundText,
			gamesFoundTextFn,
			buttons,
			...parentOptions
		} = options;

		super(
			{
				...parentOptions,
				toolbar: {
					heading: options.toolbar?.heading || 'Game Hub',
					left: options.toolbar?.left || [],
					right: [
						new Link({
							textContent: options.toolbar?.createText || 'New Game',
							href: options.toolbar?.createHref || '#/create',
							variant: 'button',
						}),
					],
				},
			},
			...children,
		);

		// Store Hub-specific options separately
		this.containerComponent = containerComponent;
		this.noGamesText = noGamesText;
		this.gamesFoundText = gamesFoundText;
		this.gamesFoundTextFn = gamesFoundTextFn;
		this.buttonOptions = buttons;

		this.options.onPointerUp = () => {
			if (this.gamePopover) this.gamePopover.elem.remove();
		};
	}

	async render() {
		super.render();

		const games = await getGames();

		if (games.response.status !== 200) {
			// TODO limit to center area
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
			// Allow games to provide their own container component for empty state
			console.log('Debug options:', {
				containerComponent: !!this.containerComponent,
				noGamesText: !!this.noGamesText,
			});
			if (this.containerComponent && this.noGamesText) {
				const ContainerComponent = this.containerComponent;
				this.container = new ContainerComponent({
					appendTo: this._body,
					textContent: this.noGamesText,
				});
			} else {
				const noGamesMessage = this.options.noGamesMessage || 'No games found. Create one to get started!';
				const messageElement = document.createElement('div');
				messageElement.style.cssText = 'margin: 24px; padding: 16px; text-align: center; color: #666;';
				messageElement.textContent = noGamesMessage;
				this._body.append(messageElement);
			}
			return;
		}

		const gameList = new GameList({
			items: games.body.map(({ id, name, players }) => ({
				append: [
					new GameListText({ content: name }),
					new Button({
						content: this.buttonOptions?.linkText || 'Copy Link',
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
						content: this.buttonOptions?.infoText || 'Info',
						onPointerPress: event => {
							event.stopPropagation();

							if (this.gamePopover) this.gamePopover.elem.remove();
							else this.gamePopover = new GameInfoPopover({ x: event.clientX, y: event.clientY, gameId: id });
						},
					}),
					new Link({
						content: this.buttonOptions?.joinText || 'Join',
						href: `#/join/${id}`,
						variant: 'button',
					}),
					new GameListText({ content: `${players.length}` }),
				],
			})),
		});

		// Allow games to provide their own container component for games list
		if (this.containerComponent && (this.gamesFoundText || this.gamesFoundTextFn)) {
			const ContainerComponent = this.containerComponent;
			const gamesText = this.gamesFoundTextFn
				? this.gamesFoundTextFn(games.body.length)
				: this.gamesFoundText;

			this.container = new ContainerComponent(
				{
					appendTo: this._body,
					textContent: gamesText,
				},
				gameList,
			);
		} else {
			this._body.append(gameList);
		}
	}
}
