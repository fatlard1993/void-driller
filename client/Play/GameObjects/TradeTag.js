import Phaser from 'phaser';
import { theme } from '@vanilla-bean/components';

import { cutCornerPoints, frameColor } from '../../shared/frame';
import gameContext from '../../shared/gameContext';

const toColor = color => Phaser.Display.Color.ValueToColor(color.toRgbString()).color;

// Room around the tag that still takes the press, for a finger
const TOUCH_SLOP = parseInt(theme.space.sm);

/**
 * The floating "Trade" tag over SpaceCo or a nearby driller: a button cut in the frame's language, centered on its
 * position, pressable a little past its edge, and lifted a pixel under the pointer
 */
export class TradeTag extends Phaser.GameObjects.Container {
	constructor(scene, x = 0, y = 0) {
		super(scene, x, y);

		const cut = parseInt(theme.space.sm);
		const text = scene.add.text(0, 0, 'Trade', { fontSize: '12px', fontFamily: 'monospace', color: '#ffffff' });

		text.setOrigin(0.5, 0.5);

		const width = text.width + parseInt(theme.space.md) * 2;
		const height = text.height + parseInt(theme.space.sm) * 2;
		const outline = cutCornerPoints(width, height, { tl: cut, br: cut }).map(point => ({
			x: point.x - width / 2,
			y: point.y - height / 2,
		}));
		const shape = scene.add.graphics();

		shape.fillStyle(toColor(theme.colors.blue), 1);
		shape.fillPoints(outline, true);
		shape.lineStyle(1.5, toColor(frameColor), 1);
		shape.strokePoints(outline, true);

		this.add([shape, text]);

		// A container's hit area is centered on it, like the tag
		this.setSize(width + TOUCH_SLOP * 2, height + TOUCH_SLOP * 2);
		this.setInteractive({ cursor: 'pointer' });

		this.on('pointerover', () => {
			if (gameContext.cursor) gameContext.cursor.visible = false;

			this.y -= 1;
		});

		this.on('pointerout', () => {
			this.y += 1;
		});

		scene.add.existing(this);
	}
}
