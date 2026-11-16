import { afterEach, beforeAll, describe, expect, mock, test } from 'bun:test';

// Phaser needs a real canvas; the boot screen is DOM beside it
mock.module('phaser', () => {
	const Phaser = new Proxy(class {}, { get: (target, key) => (key in target ? target[key] : Phaser) });

	return { default: Phaser };
});

globalThis.WebSocket = class extends EventTarget {
	send() {}
	close() {}
};

let GameScene;

beforeAll(async () => {
	({ default: GameScene } = await import('./GameScene'));
});

// The boot screen's methods, on a scene with only what they read: the game's canvas, in the element the game is drawn in
const sceneIn = gameElem => {
	const canvas = document.createElement('canvas');

	gameElem.append(canvas);

	return Object.assign(Object.create(GameScene.prototype), { game: { canvas } });
};

describe('the boot screen', () => {
	let gameElem;

	afterEach(() => gameElem.remove());

	test("is a loading EmptyState in the game's element, whose bar follows the load", () => {
		gameElem = document.createElement('div');
		document.body.append(gameElem);

		const scene = sceneIn(gameElem);

		scene.createLoadingUI();

		const bar = gameElem.querySelector('progress');

		expect(gameElem.querySelector('.loading')).not.toBeNull();
		expect(gameElem.textContent).toContain('Loading asset database');
		expect(bar.value).toBe(0);

		scene.updateLoadingProgress(40);

		expect(bar.value).toBe(0.4);

		scene.updateLoadingProgress(100, 'Asset database loaded - Initializing world...');

		expect(bar.value).toBe(1);
		expect(gameElem.textContent).toContain('Asset database loaded - Initializing world...');

		scene.hideLoadingUI();

		expect(gameElem.querySelector('progress')).toBeNull();
	});
});
