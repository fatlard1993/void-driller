import { Elem, writeStorage } from '@vanilla-bean/components';

import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { loadDoc } from '../shared/loadDoc';
import audioPlayer from '../shared/AudioPlayer';

export default class BriefingDialog extends BaseDialog {
	constructor(options = {}) {
		super({
			header: 'Incoming Transmission',
			onButtonPress: () => {
				gameContext.briefings[gameContext.serverState.world.name] = true;
				writeStorage('briefings', gameContext.briefings);
				this.close();
			},
			...options,
		});
	}

	build() {
		super.build();
		this._init();
	}

	async _init() {
		const helpFile = await loadDoc(
			this._body,
			`docs/briefings/${encodeURIComponent(gameContext.serverState.world.name.replace(/:\s+/g, '_').replace(/\s+/g, '_'))}.md`,
			'briefing',
		);

		new Elem({ style: { overflow: 'auto' }, innerHTML: helpFile, appendTo: this._body });

		// Auto-play briefing audio when dialog opens, queue bulletin after with bookends
		audioPlayer.play(gameContext.serverState.world.name, 'briefing', { autoQueue: true, useBookends: true });
	}
}
