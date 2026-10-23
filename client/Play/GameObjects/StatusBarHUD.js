import Phaser from 'phaser';
import { theme } from '@vanilla-bean/components';
import { engines } from '../../../constants';
import { cutCornerPoints, frameColor } from '../../shared/frame';
import { ScreenLayer } from './ScreenLayer';

const toColor = color => Phaser.Display.Color.ValueToColor(color.toRgbString()).color;

// The gauge's edge, and the gap between it and the fill
const EDGE = 2;

export default class StatusBarHUD {
	constructor(scene) {
		this.scene = scene;

		// Fuel color mapping based on engine fuel type
		this.fuelColors = {
			oil: toColor(theme.colors.yellow),
			battery: toColor(theme.colors.blue),
			super_oxygen_liquid_nitrogen: toColor(theme.colors.teal),
		};

		// Three gauges across 90% of the screen, their ends cut in the frame's language; smaller cuts on a phone
		const gap = parseInt(theme.space.sm);
		const totalWidth = window.innerWidth * 0.9;
		const top = 10;
		const startX = (window.innerWidth - totalWidth) / 2;

		this.width = (totalWidth - gap * 2) / 3;
		this.height = 24;
		this.cut = parseInt(window.matchMedia(theme.media.phone).matches ? theme.space.sm : theme.space.md);

		this.layer = new ScreenLayer(scene, 1000);

		this.gauges = Object.fromEntries(
			[
				['health', 'HEALTH', toColor(theme.colors.red)],
				['fuel', 'FUEL', this.fuelColors.oil],
				['cargo', 'CARGO', toColor(theme.colors.green)],
			].map(([key, label, color], index) => {
				const x = startX + index * (this.width + gap);
				const edge = scene.add.graphics({ x, y: top });
				const fill = scene.add.graphics({ x: x + EDGE, y: top + EDGE });
				const text = scene.add.text(x + this.width / 2, top + this.height / 2, label, {
					fontSize: '12px',
					color: '#ffffff',
					fontFamily: 'monospace',
				});
				const outline = cutCornerPoints(this.width, this.height, { tl: this.cut, br: this.cut });

				text.setOrigin(0.5, 0.5);

				edge.fillStyle(0x000000, 1);
				edge.fillPoints(outline, true);
				edge.lineStyle(1.5, toColor(frameColor), 1);
				edge.strokePoints(outline, true);

				this.layer.add([edge, fill, text]);

				return [key, { fill, color, ratio: 0 }];
			}),
		);

		Object.values(this.gauges).forEach(gauge => this.fill(gauge, 1));
	}

	/**
	 * Fills a gauge to a ratio, inside its edge and in its cut shape
	 * @param {object} gauge - One of this.gauges
	 * @param {number} ratio - How full, 0 to 1
	 * @param {number} [color] - A new fill color
	 */
	fill(gauge, ratio, color = gauge.color) {
		const clamped = Math.max(0, Math.min(1, ratio));

		if (clamped === gauge.ratio && color === gauge.color) return;

		gauge.ratio = clamped;
		gauge.color = color;
		gauge.fill.clear();

		if (!clamped) return;

		const cut = this.cut - EDGE / 2;

		gauge.fill.fillStyle(color, 1);
		gauge.fill.fillPoints(
			cutCornerPoints((this.width - EDGE * 2) * clamped, this.height - EDGE * 2, { tl: cut, br: cut }),
			true,
		);
	}

	update(player) {
		if (!player) return;

		if (player.health !== undefined && player.maxHealth) {
			this.fill(this.gauges.health, player.health / player.maxHealth);
		}

		if (player.fuel !== undefined && player.maxFuel) {
			// The fuel's color follows the engine's fuel type
			const fuelColor = this.fuelColors[engines[player.configuration?.engine]?.fuelType];

			this.fill(this.gauges.fuel, player.fuel / player.maxFuel, fuelColor ?? this.gauges.fuel.color);
		}

		if (player.cargo !== undefined && player.maxCargo) {
			this.fill(this.gauges.cargo, player.cargo / player.maxCargo);
		}
	}

	destroy() {
		this.layer.destroy();
	}
}
