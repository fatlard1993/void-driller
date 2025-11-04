import { styled } from 'vanilla-bean-components';
import Phaser from 'phaser';

import gameContext from '../shared/gameContext';
import { onMessage } from '../../byod-web-game/client/socket';
import WatchScene from './WatchScene';
import watchSocketRouter from './watchSocketRouter';

export default class WatchGame extends (styled.Component`
	height: 100%;
	width: 100%;

	canvas {
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
			type: Phaser.WEBGL,
			parent: this.elem,
			width: window.innerWidth,
			height: window.innerHeight - 78,
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

	render() {
		super.render();

		// Setup socket router for watch mode
		const socketCleanup = onMessage(watchSocketRouter);
		this.addCleanup('socketCleanup', () => socketCleanup());

		// Handle window resize
		window.addEventListener('resize', () => {
			gameContext.game.scale.resize(window.innerWidth, window.innerHeight - 78);
		});
	}
}
