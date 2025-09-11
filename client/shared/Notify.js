import { Notify as BaseNotify } from 'vanilla-bean-components';
import { randInt } from '../../utils';

export default class Notify extends BaseNotify {
	constructor(options) {
		super({
			x: randInt(12, window.innerWidth - 12),
			y: randInt(72, window.innerHeight / 3),
			...options,
		});
	}
}
