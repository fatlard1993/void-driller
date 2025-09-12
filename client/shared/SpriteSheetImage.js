import { Elem, randInt } from 'vanilla-bean-components';
import { items, minerals } from '../../constants';

export default class SpriteSheetImage extends Elem {
	constructor({
		url,
		size = 32,
		width = size,
		height = size,
		x = 0,
		y = 0,
		displaySize,
		displayWidth,
		displayHeight,
		style = {},
	}) {
		if (displaySize) {
			// Scale proportionally to fit within displaySize
			const scale = displaySize / Math.max(width, height);
			const finalWidth = width * scale;
			const finalHeight = height * scale;

			super({
				style: {
					width: `${finalWidth}px`,
					height: `${finalHeight}px`,
					overflow: 'hidden',
					margin: 0,
					...style,
				},
			});

			this.append([
				new Elem({
					style: {
						backgroundImage: `url(${url})`,
						backgroundPosition: `-${x * width}px -${y * height}px`,
						backgroundSize: 'auto',
						width: `${width}px`,
						height: `${height}px`,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
						imageRendering: 'pixelated',
						margin: 0,
					},
				}),
			]);
		} else if (displayWidth || displayHeight) {
			// Custom dimensions
			const finalWidth = displayWidth || width;
			const finalHeight = displayHeight || height;
			const scaleX = finalWidth / width;
			const scaleY = finalHeight / height;

			super({
				style: {
					backgroundImage: `url(${url})`,
					backgroundPosition: `-${x * width}px -${y * height}px`,
					backgroundSize: 'auto',
					width: `${width}px`,
					height: `${height}px`,
					transform: `scale(${scaleX}, ${scaleY})`,
					transformOrigin: 'top left',
					imageRendering: 'pixelated',
					margin: 0,
					...style,
				},
			});
		} else {
			// Original behavior - no scaling
			super({
				style: {
					backgroundImage: `url(${url})`,
					backgroundPosition: `-${x * width}px -${y * height}px`,
					width: `${width}px`,
					height: `${height}px`,
					margin: 0,
					...style,
				},
			});
		}
	}
}

export class MineralImage extends SpriteSheetImage {
	constructor(color, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		super({
			url: 'img/minerals.png',
			x: randInt(0, 5),
			y: minerals[color].spriteIndex,
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

export class ItemImage extends SpriteSheetImage {
	constructor(name, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		super({
			url: 'img/items.png',
			size: 64,
			x: items[name].spriteIndex,
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

const iconIndex = {
	oil: 0,
	health: 1,
	cargo: 2,
	super_oxygen_liquid_nitrogen: 3,
	battery: 4,
};

export class IconImage extends SpriteSheetImage {
	constructor(name, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		super({
			url: 'img/icons.png',
			x: iconIndex[name],
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

export class VehicleImage extends SpriteSheetImage {
	constructor(index, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		super({
			url: 'img/vehicles.png',
			size: 64,
			x: index,
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

export class DrillImage extends SpriteSheetImage {
	constructor(index, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		super({
			url: 'img/drills.png',
			width: 30,
			height: 56,
			x: index,
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

export class EngineImage extends SpriteSheetImage {
	constructor(index, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		const w = 3;
		const y = index > w ? Math.ceil(index / w - 1) : 0;
		const x = index > w ? index - w * y : index;
		super({
			url: 'img/engines.png',
			size: 128,
			x,
			y,
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

export class PartImage extends SpriteSheetImage {
	constructor(index, options = {}) {
		const { displaySize, displayWidth, displayHeight, ...style } = options;
		const cols = 15;
		const y = Math.floor(index / cols);
		const x = index % cols;
		super({
			url: 'img/parts.png',
			size: 64,
			x,
			y,
			displaySize,
			displayWidth,
			displayHeight,
			style,
		});
	}
}

export class SpacecoImage extends SpriteSheetImage {
	constructor(index, style) {
		super({ url: 'img/spaceco.png', size: 192, x: index, style });
	}
}
