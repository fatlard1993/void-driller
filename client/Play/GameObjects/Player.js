import { convertRange, theme } from 'vanilla-bean-components';
import Phaser from 'phaser';

import { gridToPxPosition } from '../../../utils';
import gameContext from '../gameContext';
import { Drill } from './Drill';

export class Player extends Drill {
	constructor(scene, x, y, orientation) {
		super(scene, x, y, orientation);

		this.healthBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.healthBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);

		this.fuelBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.fuelBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
		);

		this.cargoBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.cargoBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.blue.toRgbString()).color,
		);

		this.showStatusBars(false);
		this.updateStatusBars({ position: { x, y } });

		gameContext.sceneLayers.interfaces.add(this.healthBarFrame);
		gameContext.sceneLayers.interfaces.add(this.healthBar);
		gameContext.sceneLayers.interfaces.add(this.fuelBarFrame);
		gameContext.sceneLayers.interfaces.add(this.fuelBar);
		gameContext.sceneLayers.interfaces.add(this.cargoBarFrame);
		gameContext.sceneLayers.interfaces.add(this.cargoBar);

		scene.cameras.main.startFollow(this);
	}

	showStatusBars(show = true) {
		this.healthBarFrame.visible = show;
		this.healthBar.visible = show;
		this.fuelBarFrame.visible = show;
		this.fuelBar.visible = show;
		this.cargoBarFrame.visible = show;
		this.cargoBar.visible = show;
	}

	updateStatusBars({ position, speed = 0 } = {}) {
		const player = gameContext.players.get(gameContext.playerId);

		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			if (this.healthBar.visible) {
				this.scene.tweens.add({ targets: this.healthBar, duration: speed, x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarFrame, duration: speed, x: x, y: y - 40 });
			} else {
				this.healthBar.x = x;
				this.healthBar.y = y - 40;

				this.healthBarFrame.x = x;
				this.healthBarFrame.y = y - 40;
			}

			if (this.fuelBar.visible) {
				this.scene.tweens.add({ targets: this.fuelBar, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarFrame, duration: speed, x, y: y - 50 });
			} else {
				this.fuelBar.x = x;
				this.fuelBar.y = y - 50;

				this.fuelBarFrame.x = x;
				this.fuelBarFrame.y = y - 50;
			}

			if (this.cargoBar.visible) {
				this.scene.tweens.add({ targets: this.cargoBar, duration: speed, x, y: y - 60 });
				this.scene.tweens.add({ targets: this.cargoBarFrame, duration: speed, x, y: y - 60 });
			} else {
				this.cargoBar.x = x;
				this.cargoBar.y = y - 60;

				this.cargoBarFrame.x = x;
				this.cargoBarFrame.y = y - 60;
			}
		}

		this.showStatusBars(!!player);

		if (!player) return;

		this.healthBar.width = convertRange(player.health, [0, player.maxHealth], [1, 100]);
		this.fuelBar.width = convertRange(player.fuel, [0, player.maxFuel], [1, 100]);
		this.cargoBar.width = convertRange(player.cargo, [0, player.maxCargo], [1, 100]);
	}

	move(position, speed, orientation) {
		super.move(position, speed, orientation);

		this.updateStatusBars({ position, speed });
	}

	teleport(position, speed) {
		super.teleport(position, speed);

		this.updateStatusBars({ position, speed });
	}
}
