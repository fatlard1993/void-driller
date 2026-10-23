import { Notify as BaseNotify, appendStyles, styled, theme } from '@vanilla-bean/components';
import { randInt } from '../../utils';
import { cutCornerEdgeStyles } from './frame';
import gameContext from './gameContext';

// A phone's dialog fills the screen, so stacked toasts sit above its footer (min-height 40px) rather than on its buttons
appendStyles(`
	@media ${theme.media.phone} {
		:root:has(dialog[open]) {
			--vbc-notify-offset: calc(40px + ${theme.space.sm});
		}
	}
`);

export default class Notify extends styled(
	BaseNotify,
	({ colors, space }) => `
		/* A tiny cut, the toast's border carried across it in the color of its type */
		${cutCornerEdgeStyles('br', space.sm, 'var(--toast-edge)')}

		&.info {
			--toast-edge: ${colors.light(colors.blue)};
		}

		&.success {
			--toast-edge: ${colors.light(colors.green)};
		}

		&.warning {
			--toast-edge: ${colors.light(colors.yellow)};
		}

		&.error {
			--toast-edge: ${colors.light(colors.red)};
		}
	`,
) {
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
