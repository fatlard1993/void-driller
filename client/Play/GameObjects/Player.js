import { convertRange, theme } from 'vanilla-bean-components';
import Phaser from 'phaser';

import { getSurroundingRadius, gridToPxPosition, pxToGridPosition } from '../../../utils';
import gameContext from '../gameContext';
import { Drill } from './Drill';

export class Player extends Drill {
	constructor(scene, x, y, orientation) {
		super(scene, x, y, orientation);

		this.healthBarIcon = scene.add.image(0, 0, 'map', 'item_repair_nanites');
		this.healthBarIcon.setScale(0.7);
		this.healthBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.healthBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);

		this.fuelBarIcon = scene.add.image(0, 0, 'map', 'item_gas');
		this.fuelBarIcon.setScale(0.7);
		this.fuelBarFrame = scene.add.rectangle(0, 0, 104, 7, 0x000000);
		this.fuelBar = scene.add.rectangle(
			0,
			0,
			100,
			3,
			Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
		);

		this.showStatusBars(false);
		this.updateStatusBars({ position: { x, y } });

		gameContext.sceneLayers.interfaces.add(this.healthBarIcon);
		gameContext.sceneLayers.interfaces.add(this.healthBarFrame);
		gameContext.sceneLayers.interfaces.add(this.healthBar);
		gameContext.sceneLayers.interfaces.add(this.fuelBarIcon);
		gameContext.sceneLayers.interfaces.add(this.fuelBarFrame);
		gameContext.sceneLayers.interfaces.add(this.fuelBar);

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
	}

	updateStatusBars({ position, speed = 0 } = {}) {
		const player = gameContext.players.get(gameContext.playerId);

		if (player) {
			this.healthBar.width = convertRange(player.health, [0, player.maxHealth], [1, 100]);
			this.fuelBar.width = convertRange(player.fuel, [0, player.maxFuel], [1, 100]);
		}

		this.showStatusBars(!!player);

		if (position) {
			const { x, y } = gridToPxPosition(position);

			speed += 200;

			if (this.healthBar.visible) {
				this.scene.tweens.add({ targets: this.healthBar, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarFrame, duration: speed, x: x, y: y - 40 });
				this.scene.tweens.add({ targets: this.healthBarIcon, duration: speed, x: x - 70, y: y - 35 });
			} else {
				this.healthBarIcon.x = x - 70;
				this.healthBarIcon.y = y - 35;

				this.healthBar.x = x;
				this.healthBar.y = y - 40;

				this.healthBarFrame.x = x;
				this.healthBarFrame.y = y - 40;
			}

			if (this.fuelBar.visible) {
				this.scene.tweens.add({ targets: this.fuelBar, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarFrame, duration: speed, x, y: y - 50 });
				this.scene.tweens.add({ targets: this.fuelBarIcon, duration: speed, x: x - 70, y: y - 55 });
			} else {
				this.fuelBarIcon.x = x - 70;
				this.fuelBarIcon.y = y - 55;

				this.fuelBar.x = x;
				this.fuelBar.y = y - 50;

				this.fuelBarFrame.x = x;
				this.fuelBarFrame.y = y - 50;
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
}
