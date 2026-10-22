import { styled } from '@vanilla-bean/components';
import Phaser from 'phaser';

import gameContext from '../shared/gameContext';
import WatchScene from './WatchScene';
import setupWatchRouter from './watchSocketRouter';

export default class WatchGame extends (styled.Component`
	height: 100%;
	width: 100%;

	& canvas {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
		background: transparent !important;
		position: relative !important;
		z-index: 1 !important;
	}
`) {
	constructor(options = {}) {
		super({ ...options, autoRender: false });

		gameContext.game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: this.elem,
			width: window.innerWidth,
			height: window.innerHeight,
			scene: WatchScene,
			transparent: true,
			backgroundColor: 'rgba(0,0,0,0)',
			audio: {
				disableWebAudio: true, // No audio in watch mode
				noAudio: true,
			},
		});

		gameContext.game.events.once('ready', () => {
			gameContext.scene = gameContext.game.scene.scenes[0];

			setTimeout(() => {
				this.render();
			}, 300);
		});
	}

	build() {
		const eventRouter = setupWatchRouter();
		this.addCleanup('eventRouter', () => eventRouter.destroy());

		// The canvas fills the view's body, below its toolbar
		const fit = new ResizeObserver(
			() => this.elem.clientHeight && gameContext.game.scale.resize(window.innerWidth, this.elem.clientHeight),
		);
		fit.observe(this.elem);
		this.addCleanup('fit', () => fit.disconnect());
	}
}
