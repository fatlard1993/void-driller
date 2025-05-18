import Phaser from 'phaser';

import { gridToPxPosition, randInt } from '../../../utils';
import gameContext from '../../shared/gameContext';

export class Item extends Phaser.GameObjects.Sprite {
	/**
	 * Create an Item
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "oil" | "battery" | "super_oxygen_liquid_nitrogen" | "detonator" | "remote_charge" | "timed_charge" | "repair_nanites" | "teleport_station" | "advanced_teleporter" | "spaceco_teleporter" } name - The item name
	 */
	constructor(scene, x, y, name) {
		const itemIndex = {
			repair_nanites: 0,
			spaceco_teleporter: 1,
			detonator: 2,
			teleport_station: 3,
			advanced_teleporter: 5,
			oil: 6,
			timed_charge: 7,
			remote_charge: 8,
			super_oxygen_liquid_nitrogen: 9,
			battery: 10,
		};

		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'items', itemIndex[name]);

		this.name = name;

		scene.add.existing(this);

		this.anims.create({
			key: 'explode',
			frames: this.anims.generateFrameNumbers('explosion'),
			frameRate: 4,
			repeat: 0,
		});

		this.on('animationcomplete-explode', () => {
			this.destroy();
		});
	}

	explode() {
		this.anims.play('explode', false);
	}

	collect() {
		const player = gameContext.players.currentPlayer;

		this.scene.tweens.add({
			targets: this,
			x: gridToPxPosition(player.position.x) - randInt(-16, 16),
			y: gridToPxPosition(player.position.y) - randInt(111, 222),
			alpha: 0.3,
			duration: randInt(400, 900),
			delay: randInt(0, 500),
			ease: 'Linear',
			onComplete: () => {
				this.destroy();

				gameContext.scene.sound.play('pickup', { volume: gameContext.volume.effects });
			},
		});
	}
}
