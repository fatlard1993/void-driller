import { getImmediateSurrounds, gridToPxPosition, hasFooting, pxToGridPosition } from '../../../utils';
import gameContext from '../../shared/gameContext';
import socket from '../../socket';
import { playerMove } from '../../api';

const line = [];
const path = [];
const maxPathLength = 20;

export const submitPath = () => {
	if (path.length === 0) return;

	line.forEach((rectangle, index) => {
		rectangle.scene.tweens.add({
			targets: rectangle,
			duration: 400,
			delay: index * 400,
			alpha: 0,
			onComplete: () => rectangle.destroy(),
		});
	});

	playerMove({ path });

	path.length = 0;
	line.length = 0;

	gameContext.scene.sound.play('path_accept', { volume: gameContext.volume.interfaces });

	gameContext.cursor.visible = false;
};

export const onPointerDown = pointer => {
	const gridPosition = pxToGridPosition({ x: pointer.worldX, y: pointer.worldY });
	const gridSnappedPxPosition = gridToPxPosition(gridPosition);

	gameContext.cursor.x = gridSnappedPxPosition.x;
	gameContext.cursor.y = gridSnappedPxPosition.y;

	const player = gameContext.players.currentPlayer;
	const delta = {
		x: Math.abs(gridPosition.x - player.position.x),
		y: Math.abs(gridPosition.y - player.position.y),
	};

	if (delta.x > 1 || delta.y > 1 || (delta.x === 0 && delta.y === 0)) return;

	if (!hasFooting(gridPosition, gameContext.serverState.world.grid)) return;

	line.push(gameContext.scene.add.rectangle(gridSnappedPxPosition.x, gridSnappedPxPosition.y, 64, 64, 0x00ff00));
	line[line.length - 1].alpha = 0.4;

	path.push(gridPosition);
};

export const onPointerMove = (pointer, gameObjects) => {
	if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
		window.location.reload();
	}

	if (gameObjects.some(one => one === gameContext.spaceco.tradeButton)) return;

	const player = gameContext.players.currentPlayer;

	if (!player) return console.log('missing player', gameContext.players);

	const gridPosition = pxToGridPosition({ x: pointer.worldX, y: pointer.worldY });
	const gridSnappedPxPosition = gridToPxPosition(gridPosition);

	const lastMove = path[path.length - 1] || player.position;
	const delta = {
		x: Math.abs(gridPosition.x - lastMove.x),
		y: Math.abs(gridPosition.y - lastMove.y),
	};

	if (!gameContext.cursor) {
		gameContext.cursor = gameContext.scene.add.rectangle(0, 0, 64, 64, 0xff0000);
		gameContext.cursor.alpha = 0.3;
		gameContext.cursor.visible = false;
		gameContext.sceneLayers.interfaces.add(gameContext.cursor);
	}

	gameContext.cursor.x = gridSnappedPxPosition.x;
	gameContext.cursor.y = gridSnappedPxPosition.y;
	gameContext.cursor.visible = true;
	gameContext.cursor.fillColor = 0xff0000;

	if (gridPosition.x === player.position.x && gridPosition.y === player.position.y) {
		// console.log('move rejected: player position', { gridPosition, delta });
		return;
	}

	if (delta.x > 1 || delta.y > 1 || (delta.x === 0 && delta.y === 0)) {
		// console.log('move rejected: not a move', { gridPosition, delta, lastMove });
		return;
	}

	if (path.some(step => step.x === gridPosition.x && step.y === gridPosition.y)) {
		// console.log('move rejected: already used');
		return;
	}

	const surrounds = getImmediateSurrounds(
		gridPosition,
		['left', 'right', 'bottom'],
		gameContext.serverState.world.grid,
	);

	if (
		!hasFooting(gridPosition, gameContext.serverState.world.grid, [
			...(path.some(step => step.x === surrounds.left.x && step.y === surrounds.left.y) ? [] : ['left']),
			...(path.some(step => step.x === surrounds.right.x && step.y === surrounds.right.y) ? [] : ['right']),
			...(path.some(step => step.x === surrounds.bottom.x && step.y === surrounds.bottom.y) ? [] : ['bottom']),
		])
	) {
		// console.log('move rejected: no footing');
		return;
	}

	gameContext.cursor.fillColor = 0x00ff00;

	// console.log('move OK', { gridPosition, delta, lastMove });

	if (pointer.isDown && path.length < maxPathLength) {
		line.push(gameContext.scene.add.rectangle(gridSnappedPxPosition.x, gridSnappedPxPosition.y, 64, 64, 0x00ff00));
		line[line.length - 1].alpha = 0.4;

		path.push(gridPosition);

		gameContext.scene.sound.play('path_select', { volume: gameContext.volume.interfaces });
	}
};

export const onPointerUp = () => submitPath();

export const onPointerOut = () => {
	if(gameContext.cursor) gameContext.cursor.visible = false;

	submitPath();
};
