import { convertRange, theme } from 'vanilla-bean-components';
import Phaser from 'phaser';

import { getSurroundingRadius, gridToPxPosition, pxToGridPosition } from '../../../utils';
import gameContext from '../gameContext';
import { Drill } from './Drill';

const iconIndex = {
	oil: 0,
	health: 1,
	cargo: 2,
	super_oxygen_liquid_nitrogen: 3,
	battery: 4,
};

const fuelColors = {
	oil: Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
	battery: Phaser.Display.Color.ValueToColor(theme.colors.blue.toRgbString()).color,
	super_oxygen_liquid_nitrogen: Phaser.Display.Color.ValueToColor(theme.colors.teal.toRgbString()).color,
};

export class Player extends Drill {
	constructor(scene, x, y, orientation, vehicle, drill) {
		super(scene, x, y, orientation, vehicle, drill);

		this.healthBarIcon = scene.add.image(0, 0, 'icons', 1);
		this.healthBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.healthBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);

		this.fuelBarIcon = scene.add.image(0, 0, 'icons', 0);
		this.fuelBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.fuelBar = scene.add.rectangle(0, 0, 100, 3, fuelColors.oil);

		this.cargoBarIcon = scene.add.image(0, 0, 'icons', 2);
		this.cargoBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.cargoBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.dark(theme.colors.green).toRgbString()).color,
		);

		this.showStatusBars(false);
		this.updateStatusBars({ position: { x, y } });

		gameContext.sceneLayers.interfaces.add(this.healthBarIcon);
		gameContext.sceneLayers.interfaces.add(this.healthBarFrame);
		gameContext.sceneLayers.interfaces.add(this.healthBar);
		gameContext.sceneLayers.interfaces.add(this.fuelBarIcon);
		gameContext.sceneLayers.interfaces.add(this.fuelBarFrame);
		gameContext.sceneLayers.interfaces.add(this.fuelBar);
		gameContext.sceneLayers.interfaces.add(this.cargoBarIcon);
		gameContext.sceneLayers.interfaces.add(this.cargoBarFrame);
		gameContext.sceneLayers.interfaces.add(this.cargoBar);

		this.move({ x, y }, 0, orientation);

		scene.cameras.main.startFollow(this);
	}

	showStatusBars(show = true) {
		this.healthBarIcon.visible = show;
		this.healthBarFrame.visible = show;
		this.healthBar.visible = show;
		this.fuelBarIcon.visible = show;
		this.fuelBarFrame.visible = show;
		this.fuelBar.visible = show;
		this.cargoBarIcon.visible = show;
		this.cargoBarFrame.visible = show;
		this.cargoBar.visible = show;
	}

	updateStatusBars({ position, speed = 0 } = {}) {
		const player = gameContext.players.get(gameContext.playerId);

		if (player) {
			this.healthBar.width = convertRange(player.health, [0, player.maxHealth], [1, 100]);
			this.fuelBar.width = convertRange(player.fuel, [0, player.maxFuel], [1, 100]);
			this.cargoBar.width = convertRange(player.cargo, [0, player.maxCargo], [1, 100]);

			const engineConfig = gameContext.serverState.world.engines[player.configuration.engine];

			this.fuelBarIcon.setTexture('icons', iconIndex[engineConfig.fuelType]);
			this.fuelBarIcon.setScale(engineConfig.fuelType === 'oil' ? 0.8 : 1);
			this.fuelBar.fillColor = fuelColors[engineConfig.fuelType];
		}

		this.showStatusBars(!!player);

		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			if (this.healthBar.visible) {
				this.scene.tweens.add({ targets: this.healthBar, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarFrame, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarIcon, duration: speed, x: x - 70, y: y - 40 });
			} else {
				this.healthBarIcon.x = x - 70;
				this.healthBarIcon.y = y - 40;

				this.healthBar.x = x;
				this.healthBar.y = y - 40;

				this.healthBarFrame.x = x;
				this.healthBarFrame.y = y - 40;
			}

			if (this.fuelBar.visible) {
				this.scene.tweens.add({ targets: this.fuelBar, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarFrame, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarIcon, duration: speed, x: x + 60, y: y - 50 });
			} else {
				this.fuelBarIcon.x = x + 60;
				this.fuelBarIcon.y = y - 50;

				this.fuelBar.x = x;
				this.fuelBar.y = y - 50;

				this.fuelBarFrame.x = x;
				this.fuelBarFrame.y = y - 50;
			}

			if (this.cargoBar.visible) {
				this.scene.tweens.add({ targets: this.cargoBar, duration: speed, x, y: y - 60 });
				this.scene.tweens.add({ targets: this.cargoBarFrame, duration: speed, x, y: y - 60 });
				this.scene.tweens.add({ targets: this.cargoBarIcon, duration: speed, x: x - 70, y: y - 60 });
			} else {
				this.cargoBarIcon.x = x - 70;
				this.cargoBarIcon.y = y - 60;

				this.cargoBar.x = x;
				this.cargoBar.y = y - 60;

				this.cargoBarFrame.x = x;
				this.cargoBarFrame.y = y - 60;
			}
		}
	}

	move(position, speed, orientation) {
		super.move(position, speed, orientation);

		this.updateStatusBars({ position, speed });
		this.nearSpaceco = getSurroundingRadius(position, 1).some(
			position =>
				pxToGridPosition(gameContext.spaceco.x) === position.x &&
				pxToGridPosition(gameContext.spaceco.y) === position.y,
		);

		if (this.nearSpaceco) gameContext.spaceco.showPrompt();
		else gameContext.spaceco.hidePrompt();
	}

	teleport(position, speed) {
		super.teleport(position, speed);

		this.updateStatusBars({ position, speed });
	}

	fall(position, speed) {
		super.fall(position, speed);

		this.showStatusBars(false);
	}
}
