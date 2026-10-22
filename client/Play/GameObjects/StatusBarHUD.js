import Phaser from 'phaser';
import { theme } from '@vanilla-bean/components';
import { engines } from '../../../constants';
import { ScreenLayer } from './ScreenLayer';

export default class StatusBarHUD {
	constructor(scene) {
		this.scene = scene;

		// Fuel color mapping based on engine fuel type
		this.fuelColors = {
			oil: Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
			battery: Phaser.Display.Color.ValueToColor(theme.colors.blue.toRgbString()).color,
			super_oxygen_liquid_nitrogen: Phaser.Display.Color.ValueToColor(theme.colors.teal.toRgbString()).color,
		};

		// Each bar uses 30% of screen width, 3 bars total = 90% of screen
		const barWidth = window.innerWidth * 0.3;
		const totalWidth = barWidth * 3;
		const barHeight = 20;
		const topMargin = 10;
		const startX = (window.innerWidth - totalWidth) / 2; // Center the group

		// Create health bar
		this.healthFrame = scene.add.rectangle(startX, topMargin, barWidth + 4, barHeight + 4, 0x000000);
		this.healthFrame.setOrigin(0, 0);

		this.healthBar = scene.add.rectangle(
			startX + 2,
			topMargin + 2,
			barWidth,
			barHeight,
			Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color,
		);
		this.healthBar.setOrigin(0, 0);

		this.healthText = scene.add.text(startX + barWidth / 2 + 2, topMargin + 4, 'HEALTH', {
			fontSize: '12px',
			color: '#ffffff',
			fontFamily: 'monospace',
		});
		this.healthText.setOrigin(0.5, 0);

		// Create fuel bar
		this.fuelFrame = scene.add.rectangle(startX + barWidth + 4, topMargin, barWidth + 4, barHeight + 4, 0x000000);
		this.fuelFrame.setOrigin(0, 0);

		this.fuelBar = scene.add.rectangle(
			startX + barWidth + 4 + 2,
			topMargin + 2,
			barWidth,
			barHeight,
			Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
		);
		this.fuelBar.setOrigin(0, 0);

		this.fuelText = scene.add.text(startX + barWidth + 4 + barWidth / 2 + 2, topMargin + 4, 'FUEL', {
			fontSize: '12px',
			color: '#ffffff',
			fontFamily: 'monospace',
		});
		this.fuelText.setOrigin(0.5, 0);

		// Create cargo bar
		this.cargoFrame = scene.add.rectangle(
			startX + (barWidth + 4) * 2,
			topMargin,
			barWidth + 4,
			barHeight + 4,
			0x000000,
		);
		this.cargoFrame.setOrigin(0, 0);

		this.cargoBar = scene.add.rectangle(
			startX + (barWidth + 4) * 2 + 2,
			topMargin + 2,
			barWidth,
			barHeight,
			Phaser.Display.Color.ValueToColor(theme.colors.green.toRgbString()).color,
		);
		this.cargoBar.setOrigin(0, 0);

		this.cargoText = scene.add.text(startX + (barWidth + 4) * 2 + barWidth / 2 + 2, topMargin + 4, 'CARGO', {
			fontSize: '12px',
			color: '#ffffff',
			fontFamily: 'monospace',
		});
		this.cargoText.setOrigin(0.5, 0);

		this.layer = new ScreenLayer(scene, 1000);
		this.layer.add([
			this.healthFrame,
			this.healthBar,
			this.healthText,
			this.fuelFrame,
			this.fuelBar,
			this.fuelText,
			this.cargoFrame,
			this.cargoBar,
			this.cargoText,
		]);

		// Store bar width for updates
		this.barWidth = barWidth;
	}

	update(player) {
		if (!player) return;

		// Update health bar - use scaleX to keep full width visible
		if (player.health !== undefined && player.maxHealth) {
			const healthRatio = player.health / player.maxHealth;
			this.healthBar.scaleX = Math.max(0, healthRatio);
		}

		// Update fuel bar - use scaleX to keep full width visible
		if (player.fuel !== undefined && player.maxFuel) {
			const fuelRatio = player.fuel / player.maxFuel;
			this.fuelBar.scaleX = Math.max(0, fuelRatio);

			// Update fuel bar color based on engine fuel type
			if (player.configuration?.engine) {
				const engineConfig = engines[player.configuration.engine];
				if (engineConfig?.fuelType && this.fuelColors[engineConfig.fuelType]) {
					this.fuelBar.setFillStyle(this.fuelColors[engineConfig.fuelType]);
				}
			}
		}

		// Update cargo bar - use scaleX to keep full width visible
		if (player.cargo !== undefined && player.maxCargo) {
			const cargoRatio = player.cargo / player.maxCargo;
			this.cargoBar.scaleX = Math.max(0, cargoRatio);
		}
	}

	destroy() {
		this.layer.destroy();
	}
}
