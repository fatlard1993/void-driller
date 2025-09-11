import { Component, Button, styled } from 'vanilla-bean-components';

import { getGame } from '../../api';
import GameInfoDialog from './GameInfoDialog';

export default class GameInfoPopover extends (styled.Popover`
	flex-direction: column;
`) {
	async render() {
		super.render();

		const game = (await getGame(this.options.gameId)).body;

		if (game.world?.name) {
			new Component({ content: ` - ${game.world.name} - `, appendTo: this });
		}
		new Component({ content: `Game: ${game.name}`, appendTo: this });
		new Component({ content: `Players: ${game.players.length}`, appendTo: this });
		new Button({
			content: 'More',
			appendTo: this,
			style: { display: 'block', margin: '6px auto' },
			onPointerPress: () => {
				this.elem.remove();

				new GameInfoDialog({ game });
			},
		});
	}
}
