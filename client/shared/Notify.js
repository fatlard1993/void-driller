import { Notify as BaseNotify, appendStyles, theme } from '@vanilla-bean/components';
import { randInt } from '../../utils';
import gameContext from './gameContext';

// A phone's dialog fills the screen, so stacked toasts sit above its footer (min-height 40px) rather than on its buttons
appendStyles(`
	@media ${theme.media.phone} {
		:root:has(dialog[open]) {
			--vbc-notify-offset: calc(40px + ${theme.space.sm});
		}
	}
`);

export default class Notify extends BaseNotify {
	constructor(options) {
		// Use gameContext default timeout if no timeout specified
		const timeout = options.timeout !== undefined ? options.timeout : gameContext.notifySettings?.autoDismissTimeout;

		super({
			// Scattered over the game, but stacked in the corner over a dialog, where a scattered toast lands on its header
			...(!gameContext.openDialog && {
				x: randInt(12, window.innerWidth - 12),
				y: randInt(72, window.innerHeight / 3),
			}),
			timeout,
			// Dismissed by the press itself (the release), so nothing under the toast gets pressed in its place
			onPointerDown: event => event?.stopPropagation(),
			...options,
		});
	}
}
