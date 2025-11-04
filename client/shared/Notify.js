import { Notify as BaseNotify } from 'vanilla-bean-components';
import { randInt } from '../../utils';
import gameContext from './gameContext';

export default class Notify extends BaseNotify {
	constructor(options) {
		// Use gameContext default timeout if no timeout specified
		const timeout = options.timeout !== undefined ? options.timeout : gameContext.notify?.autoDismissTimeout;

		super({
			x: randInt(12, window.innerWidth - 12),
			y: randInt(72, window.innerHeight / 3),
			timeout,
			onPointerDown: event => {
				if (event) {
					event.stopPropagation();
					event.preventDefault();
				}

				this.elem.remove();
			},
			...options,
		});
	}
}
