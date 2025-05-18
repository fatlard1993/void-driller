/* eslint-disable no-nested-ternary */
import Phaser from 'phaser';

import { chance, getImmediateSurrounds, gridToPxPosition, randInt } from '../../../utils';
import gameContext from '../gameContext';

export class Ground extends Phaser.GameObjects.Sprite {
	/**
	 * Create a piece of Ground
	 * @param {object} scene - The scene
	 * @param {number} x - Grid x
	 * @param {number} y - Grid y
	 * @param { "black" | "blue" | "green" | "orange" | "pink" | "purple" | "red" | "teal" | "white" | "yellow" } name - The ground name
	 */
	constructor(scene, x, y, name) {
		super(scene, gridToPxPosition(x), gridToPxPosition(y), 'ground', randInt(0, 8));

		const colorCode = {
			purple: '#fff2fc',
			white: '#fff',
			green: '#c9dda8',
			blue: '#b7e7e2',
			red: '#c1745e',
			pink: '#c29fc0',
			teal: '#85ddb5',
			orange: '#df9a58',
			yellow: '#dac35c',
			black: '#666',
		};

		const { left, right, top, bottom } = getImmediateSurrounds(
			{ x, y },
			['left', 'right', 'top', 'bottom'],
			gameContext.serverState.world.grid,
		);

		this.setTint(
			// Phaser.Display.Color.ValueToColor(colorCode[name]).color,
			Phaser.Display.Color.ValueToColor(
				colorCode[
					[top.ground?.type, left.ground?.type].includes(name)
						? name
						: chance(70)
							? name
							: top.ground?.type || left.ground?.type || name
				],
			).color,
			Phaser.Display.Color.ValueToColor(
				colorCode[
					[top.ground?.type, right.ground?.type].includes(name)
						? name
						: chance(70)
							? name
							: top.ground?.type || right.ground?.type || name
				],
			).color,
			Phaser.Display.Color.ValueToColor(
				colorCode[
					[bottom.ground?.type, left.ground?.type].includes(name)
						? name
						: chance(70)
							? name
							: bottom.ground?.type || left.ground?.type || name
				],
			).color,
			Phaser.Display.Color.ValueToColor(
				colorCode[
					[bottom.ground?.type, right.ground?.type].includes(name)
						? name
						: chance(70)
							? name
							: bottom.ground?.type || right.ground?.type || name
				],
			).color,
		);

		this.name = name;

		this.crack = scene.add.sprite(gridToPxPosition(x), gridToPxPosition(y), 'crack');
		this.crack.visible = false;

		this.crack.anims.create({
			key: 'dig',
			frames: this.anims.generateFrameNumbers('crack'),
			duration: 500,
			repeat: 0,
		});

		this.crack.on('animationcomplete-dig', () => {
			this.crack.destroy();
			this.destroy();
		});

		scene.add.existing(this);
	}

	dig() {
		this.crack.visible = true;

		this.scene.sound.play('dig', { volume: gameContext.volume.effects });

		this.crack.anims.play('dig', false);
	}
}
