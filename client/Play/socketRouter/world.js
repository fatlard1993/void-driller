import gameContext from '../../shared/gameContext';
import { explode } from '../effects';
import { Gas, Lava } from '../GameObjects';

export default data => {
	if (data.update === 'dissipateGas') {
		data.addedGas.forEach(gas => {
			const sprite = new Gas(gameContext.scene, gas.x, gas.y, gas.name.split('_')[0], 'fill');

			gameContext.serverState.world.grid[gas.x][gas.y].hazards = gameContext.serverState.world.grid[gas.x][
				gas.y
			].hazards.filter(hazard => {
				if (hazard.name.endsWith('monster')) {
					gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });

					hazard.sprite.destroy();

					return false;
				} else return true;
			});

			gameContext.serverState.world.grid[gas.x][gas.y].hazards.push({ name: gas.name, sprite });
			gameContext.sceneLayers.hazards.add(sprite);
		});

		data.removedGas.forEach(gas => {
			const updatedHazards = [];

			gameContext.serverState.world.grid[gas.x][gas.y].hazards.forEach(hazard => {
				if (hazard.name?.endsWith('gas')) hazard.sprite.dissipate();
				else updatedHazards.push(hazard);
			});

			gameContext.serverState.world.grid[gas.x][gas.y].hazards = updatedHazards;
		});
	} else if (data.update === 'spillLava') {
		data.addedLava.forEach(lava => {
			const sprite = new Lava(gameContext.scene, lava.x, lava.y, 'fill');

			gameContext.serverState.world.grid[lava.x][lava.y].hazards = gameContext.serverState.world.grid[lava.x][
				lava.y
			].hazards.filter(hazard => {
				if (hazard.name.endsWith('monster')) {
					gameContext.scene.sound.play('hurt_chomper', { volume: gameContext.volume.effects });

					hazard.sprite.destroy();

					return false;
				} else return true;
			});

			gameContext.serverState.world.grid[lava.x][lava.y].hazards.push({ name: 'lava', sprite });
			gameContext.sceneLayers.hazards.add(sprite);
		});

		data.removedLava.forEach(lava => {
			const updatedHazards = [];

			gameContext.serverState.world.grid[lava.x][lava.y].hazards.forEach(hazard => {
				if (hazard.name === 'lava') hazard.sprite.dissipate();
				else updatedHazards.push(hazard);
			});

			gameContext.serverState.world.grid[lava.x][lava.y].hazards = updatedHazards;
		});
	} else if (data.update === 'wakeChomper') {
		const chomper = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			hazard => hazard.name === data.name,
		);

		if (!chomper) return;

		chomper.sprite.awake();

		chomper.sprite.move(data.move, 500, data.orientation);

		gameContext.serverState.world.grid[data.position.x][data.position.y].hazards = gameContext.serverState.world.grid[
			data.position.x
		][data.position.y].hazards.filter(hazard => hazard.name !== data.name);

		gameContext.serverState.world.grid[data.move.x][data.move.y].hazards.push(chomper);
	} else if (data.update === 'sleepChomper') {
		const chomper = gameContext.serverState.world.grid[data.position.x][data.position.y].hazards.find(
			hazard => hazard.name === data.name,
		);

		if (!chomper) return;

		chomper.sprite.sleep();
	} else if (data.update === 'explodeBomb') {
		console.log('explodeBomb', data);

		explode({ position: data.position, radius: data.radius });
	}

	return false;
};
