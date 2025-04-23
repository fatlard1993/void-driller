import { Elem } from 'vanilla-bean-components';

import imageMap from '../img/map.json';

export default class SpriteSheetImage extends Elem {
	constructor(key, style = {}) {
		super({
			style: {
				backgroundImage: 'url(/img/map.png)',
				backgroundPosition: `-${imageMap.frames[key].frame.x}px -${imageMap.frames[key].frame.y}px`,
				width: `${imageMap.frames[key].frame.w}px`,
				height: `${imageMap.frames[key].frame.h}px`,
				...style,
			},
		});
	}
}
