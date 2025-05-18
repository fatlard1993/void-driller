import { styled, throttle, debounce } from 'vanilla-bean-components';
import Phaser from 'phaser';

import gameContext from '../shared/gameContext';
import { onMessage } from '../socket';
import { onKeyDown, onKeyUp, onPointerDown, onPointerMove, onPointerOut, onPointerUp } from './inputs';
import GameScene from './GameScene';
import ConsoleDialog from './ConsoleDialog';
import socketRouter from './socketRouter';

export default class Game extends (styled.Component`
	background-image: url('img/background.svg');
	height: 100%;
`) {
	constructor(options = {}) {
		super({ ...options, autoRender: false });

		gameContext.game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: this.elem,
			width: window.innerWidth,
			height: window.innerHeight - 78,
			scene: GameScene,
			transparent: true,
		});

		gameContext.game.events.once('ready', () => {
			gameContext.scene = gameContext.game.scene.scenes[0];

			setTimeout(() => this.render(), 300);
		});
	}

	render() {
		super.render();

		if (!localStorage.getItem('console_defaultMenu')) gameContext.openDialog = new ConsoleDialog();

		const socketCleanup = onMessage(socketRouter);

		this.addCleanup('socketCleanup', () => socketCleanup());

		window.addEventListener(
			'resize',
			debounce(() => {
				gameContext.game.scale.resize(window.innerWidth, window.innerHeight - 78);
			}),
		);

		gameContext.scene.input.on('pointerdown', onPointerDown);
		gameContext.scene.input.on('pointermove', throttle(onPointerMove, 30));
		gameContext.scene.input.on('pointerup', onPointerUp);
		gameContext.scene.input.on('gameout', onPointerOut);

		gameContext.scene.input.keyboard.on('keydown', onKeyDown);
		gameContext.scene.input.keyboard.on('keyup', onKeyUp);
	}
}
