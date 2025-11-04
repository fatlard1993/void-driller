import { getSurroundingRadius } from '../../utils';
import gameContext from '../shared/gameContext';

export const destroyGround = (position, radius = 0) => {
	getSurroundingRadius(position, radius).forEach(({ x, y }) => {
		const cell = gameContext.serverState.world.grid[x]?.[y];
		if (!cell) return;

		// Dig the ground sprite
		cell.ground?.sprite?.dig();

		// Destroy all item and mineral sprites in this cell
		if (cell.items) {
			cell.items.forEach(item => {
				if (item.sprite?.scene) {
					item.sprite.destroy();
				}
			});
			cell.items = [];
		}

		// Clear ground and hazards from client state to match server
		cell.ground = {};
		cell.hazards = [];
	});
};

export const explode = ({ position, radius }) => {
	gameContext.scene.cameras.main.shake(600, 0.01);
	gameContext.scene.cameras.main.flash(400);
	gameContext.scene.sound.play('explode', { volume: gameContext.volume.effects });

	destroyGround(position, radius);
};

export const implode = ({
	position,
	radius,
	implosionType = 'gravity',
	collectedMinerals = {},
	collectedItems = {},
}) => {
	// Different visual/audio effects based on implosion type
	if (implosionType === 'void') {
		gameContext.scene.cameras.main.shake(800, 0.015);
		gameContext.scene.cameras.main.flash(600, 0x6600ff); // Purple flash for void
	} else {
		gameContext.scene.cameras.main.shake(700, 0.012);
		gameContext.scene.cameras.main.flash(500, 0x0066ff); // Blue flash for gravity
	}

	// Play a different sound effect than regular explosions
	gameContext.scene.sound.play('powerup', { volume: gameContext.volume.effects }); // Using powerup as implosion sound

	destroyGround(position, radius);

	// Additional visual feedback for collection
	const totalCollected =
		Object.values(collectedMinerals).reduce((sum, count) => sum + count, 0) +
		Object.values(collectedItems).reduce((sum, count) => sum + count, 0);

	if (totalCollected > 0) {
		// Play collection sound
		setTimeout(() => {
			gameContext.scene.sound.play('pickup', { volume: gameContext.volume.effects });
		}, 500);
	}
};
