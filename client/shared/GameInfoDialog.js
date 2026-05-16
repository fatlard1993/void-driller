import { Component, Dialog, List, Label } from 'vanilla-bean-components';

import { deleteGame } from '../api';

export default class GameInfoDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			header: options.game.name,
			buttons: [
				'Close',
				{
					textContent: 'Delete',
					style: ({ colors }) => ({ background: colors.red }),
				},
				'Join',
			],
			onButtonPress: ({ button }) => {
				if (button === 'Join') window.location.href = `#/join/${options.game.id}`;
				else if (button?.textContent === 'Delete') deleteGame(options.game.id);

				this.close();
			},
			...options,
		});
	}

	async render() {
		super.render();

		const { game } = this.options;

		new Component({ content: `Game ID: ${game.id}`, appendTo: this._body });

		new Label({
			label: 'Players',
			appendTo: this._body,
			append: new List({ items: game.players.map(({ name }) => name) }),
		});
	}
}
