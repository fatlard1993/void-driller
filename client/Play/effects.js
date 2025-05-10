import { convertRange, getSurroundingRadius } from '../../utils';
import gameContext from './gameContext';

export const destroyGround = ({ x, y }) => {
	const gridConfig = gameContext.serverState.world.grid[x][y];

	if (gridConfig.ground.sprite?.scene) gridConfig.ground.sprite.dig();

	gameContext.serverState.world.grid[x][y].ground = {};
};

export const explode = ({ position, radius }) => {
	const player = gameContext.players.get(gameContext.playerId);

	const delta = {
		x: position.x - player.position.x,
		y: position.y - player.position.y,
	};

	gameContext.scene.cameras.main.shake(1000, convertRange(Math.abs(delta.x) + Math.abs(delta.y), [0, 20], [0.01, 0]));
	gameContext.scene.cameras.main.flash(600);
	gameContext.scene.sound.play('explode', { volume: gameContext.volume.effects });

	getSurroundingRadius(position, radius).forEach(({ x, y }) => {
		destroyGround({ x, y, silent: true });
	});
};
