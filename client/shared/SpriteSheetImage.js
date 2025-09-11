import { Elem, randInt } from 'vanilla-bean-components';
import { items, minerals } from '../../constants';

export default class SpriteSheetImage extends Elem {
	constructor({ url, size = 32, width = size, height = size, x = 0, y = 0, style = {} }) {
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

export class MineralImage extends SpriteSheetImage {
	constructor(color, style) {
		super({ url: 'img/minerals.png', x: randInt(0, 5), y: minerals[color].spriteIndex, style });
	}
}

export class ItemImage extends SpriteSheetImage {
	constructor(name, style) {
		super({ url: 'img/items.png', size: 64, x: items[name].spriteIndex, style });
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
	/** @type {(color: keyof iconIndex, style: {}) => {}} */
	constructor(name, style) {
		super({ url: 'img/icons.png', x: iconIndex[name], style });
	}
}

export class VehicleImage extends SpriteSheetImage {
	constructor(index, style) {
		super({ url: 'img/vehicles.png', size: 64, x: index, style });
	}
}

export class DrillImage extends SpriteSheetImage {
	constructor(index, style) {
		super({ url: 'img/drills.png', width: 30, height: 56, x: index, style });
	}
}

export class EngineImage extends SpriteSheetImage {
	constructor(index, style) {
		const w = 3;
		const y = index > w ? Math.ceil(index / w - 1) : 0;
		const x = index > w ? index - w * y : index;
		super({ url: 'img/engines.png', size: 128, x, y, style });
	}
}

export class PartImage extends SpriteSheetImage {
	constructor(index, style) {
		const w = 15;
		const y = index > w ? Math.ceil(index / w - 1) : 0;
		const x = index > w ? index - w * y : index;
		super({ url: 'img/parts.png', size: 64, x, y, style });
	}
}

export class SpacecoImage extends SpriteSheetImage {
	constructor(index, style) {
		super({ url: 'img/spaceco.png', size: 192, x: index, style });
	}
}
