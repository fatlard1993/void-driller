import { Elem, Button } from 'vanilla-bean-components';

import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { exitGame, spacecoBuyRescue } from '../api';
import Notify from '../shared/Notify';

export default class RescueDialog extends BaseDialog {
	constructor(options = {}) {
		super({
			header: 'Spaceco Rescue',
			...options,
		});
	}

	render() {
		super.render();

		const player = gameContext.players.currentPlayer;

		this._body.append(
			new Elem({
				tag: 'p',
				content:
					"You have ceased functioning. SpaceCo regrets your inconvenience - and reminds you that your suffering is covered under clause 7B: 'Expected Operational Failures.'\n\nPlease await retrieval or initiate teleportation, assuming your limbs still operate.\n\nPress [Esc] to access the Player Console. You may also scream, but we're not listening.",
			}),

			new Button({
				content: 'Buy Remote Teleport ($50)',
				disabled: player.credits < 50,
				onPointerPress: () => {
					spacecoBuyRescue();

					this.close();
				},
			}),
			new Button({
				content: 'Give Up ($0)',
				onPointerPress: async () => {
					const { response, body } = await exitGame();

					if (response.status !== 200) {
						new Notify({ type: 'error', content: body?.message || response.statusText });
					}

					window.location.href = `#/join/${gameContext.gameId}`;

					this.close();
				},
			}),
		);
	}
}
