import { styled, throttle, debounce } from 'vanilla-bean-components';
import Phaser from 'phaser';

import gameContext from '../shared/gameContext';
import { onMessage } from '../../byod-web-game/client/socket';
import DebugLog from '../shared/DebugLog';
import { onKeyDown, onKeyUp, onPointerDown, onPointerMove, onPointerOut, onPointerUp } from './inputs';
import GameScene from './GameScene';
import socketRouter from './socketRouter';

export default class Game extends (styled.Component`
	height: 100%;
	width: 100%;
	
	/* Ensure proper mobile display */
	canvas {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		-webkit-tap-highlight-color: transparent;
		background: transparent !important;
		position: relative !important;
		z-index: 1 !important;
	}
`) {
	constructor(options = {}) {
		super({ ...options, autoRender: false });
		
		// Initialize debug log component
		this.debugLog = new DebugLog();

		try {
			gameContext.game = new Phaser.Game({
				type: Phaser.WEBGL,
				parent: this.elem,
				width: window.innerWidth,
				height: window.innerHeight - 78,
				scene: GameScene,
				transparent: true, // Transparent to show page background (stars)
				backgroundColor: 'rgba(0,0,0,0)', // Transparent background
			});
			
			setTimeout(() => {
				if (window.debugLog) window.debugLog('Phaser.Game created');
			}, 200);
			
			gameContext.game.events.once('ready', () => {
				if (window.debugLog) {
					window.debugLog('Phaser ready event fired');
					window.debugLog(`Canvas element: ${!!gameContext.game.canvas}`);
					
					if (gameContext.game.canvas) {
						const canvas = gameContext.game.canvas;
						window.debugLog(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
						window.debugLog(`Canvas computed display: ${getComputedStyle(canvas).display}`);
						window.debugLog(`Canvas parent exists: ${!!canvas.parentElement}`);
					}
				}
				gameContext.scene = gameContext.game.scene.scenes[0];
				
				setTimeout(() => {
					this.render();
					if (window.debugLog) {
						window.debugLog(`Phaser scene ready: ${!!gameContext.scene}`);
					}
				}, 300);
			});
			
		} catch (error) {
			setTimeout(() => {
				if (window.debugLog) window.debugLog('Phaser creation failed: ' + error.message);
			}, 200);
		}
	}

	render() {
		super.render();
		
		// Debug log initial system state
		if (window.debugLog) {
			window.debugLog('Game render() called');
			window.debugLog(`Window size: ${window.innerWidth}x${window.innerHeight}`);
			window.debugLog(`Game element: ${this.elem ? 'exists' : 'missing'}`);
			window.debugLog(`Phaser game: ${gameContext.game ? 'exists' : 'missing'}`);
		}

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
