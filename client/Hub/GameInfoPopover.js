import { Component, Button, styled } from 'vanilla-bean-components';

import { getGame } from '../api/game';
import GameInfoDialog from './GameInfoDialog';

export default class GameInfoPopover extends styled.Popover`
	flex-direction: column;
` {
	constructor(options) {
		super({
			...options,
			styles: (theme, Component) => `
				${options.styles?.(theme, Component) || ''}
			`,
		});
	}

	async render() {
		super.render();

		const game = (await getGame(this.options.gameId)).body;

		new Component({ content: `Name: ${game.name}`, appendTo: this.elem });
		new Component({ content: `Players: ${game.players.length}`, appendTo: this.elem });
		new Button({
			content: 'More',
			appendTo: this.elem,
			style: { display: 'block', margin: '6px auto' },
			onPointerPress: () => {
				this.elem.remove();

				new GameInfoDialog({ game });
			},
		});
	}
}
