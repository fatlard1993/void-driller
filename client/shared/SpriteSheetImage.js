import { Elem, randInt } from 'vanilla-bean-components';

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

const mineralColorIndex = {
	teal: 0,
	blue: 1,
	red: 2,
	purple: 3,
	pink: 4,
	orange: 5,
	green: 6,
	yellow: 7,
	black: 8,
	white: 9,
};

export class MineralImage extends SpriteSheetImage {
	/** @type {(color: keyof mineralColorIndex, style: {}) => {}} */
	constructor(color, style) {
		super({ url: 'img/minerals.png', x: randInt(0, 5), y: mineralColorIndex[color], style });
	}
}

const itemNameIndex = {
	repair_nanites: 0,
	teleporter: 1,
	detonator: 2,
	responder: 3,
	responder_spaceco: 4,
	responder_teleporter: 5,
	gas: 6,
	timed_charge: 7,
	remote_charge: 8,
	super_oxygen_liquid_nitrogen: 9,
};

export class ItemImage extends SpriteSheetImage {
	/** @type {(color: keyof itemNameIndex, style: {}) => {}} */
	constructor(name, style) {
		super({ url: 'img/items.png', size: 64, x: itemNameIndex[name], style });
	}
}

const iconIndex = {
	fuel_oil: 0,
	health: 1,
	cargo: 2,
	fuel_soln: 3,
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

export class PartsImage extends SpriteSheetImage {
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
