import { Elem, GET } from 'vanilla-bean-components';

import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import Notify from '../shared/Notify';
import audioPlayer from '../shared/AudioPlayer';

export default class BriefingDialog extends BaseDialog {
	constructor(options = {}) {
		super({
			header: 'Incoming Transmission',
			onButtonPress: () => {
				gameContext.briefings[gameContext.serverState.world.name] = true;
				localStorage.setItem('briefings', JSON.stringify(gameContext.briefings));
				this.close();
			},
			...options,
		});
	}

	async render() {
		super.render();

		const helpFile = await GET(`docs/briefings/${encodeURIComponent(gameContext.serverState.world.name.replace(/:\s+/g, '_').replace(/\s+/g, '_'))}.md`);

		if (!helpFile.response.ok) {
			new Notify({
				type: 'error',
				content:
					'Briefing data corrupted. Your mission is now officially "wing it" until further notice. (Try reloading.)',
			});

			return;
		}

		new Elem({ style: { overflow: 'auto' }, innerHTML: helpFile.body, appendTo: this._body });

		// Auto-play briefing audio when dialog opens, queue bulletin after with bookends
		audioPlayer.play(gameContext.serverState.world.name, 'briefing', { autoQueue: true, useBookends: true });
	}
}
