import { Elem } from 'vanilla-bean-components';

export default class SpriteSheetImage extends Elem {
	constructor(url, index, width = 32, height = 32, style = {}) {
		super({
			style: {
				backgroundImage: `url(${url})`,
				backgroundPosition: `-${index * width}px -${index * height}px`,
				width: `${width}px`,
				height: `${height}px`,
				...style,
			},
		});
	}
}
