import { theme } from '@vanilla-bean/components';

/**
 * The game's cut-corner frame (augmented-ui). A framed element takes frameAttributes as options and frameStyles in its
 * styles. Past the corner cuts, two notches reach one corner deep: along the top for four corners from the top right,
 * and up the left side for four corners from the bottom left. Whatever sits in those places is clipped, so a framed
 * element pads its content clear of them by --frame-inset: a corner, the border, and a gap.
 */
export const frameAttributes = { 'data-augmented-ui': 'tl-clip tr-2-clip-x br-clip bl-2-clip-y border' };

/** The corner size for a panel that fills the screen or most of it, and for a small one (a popover, a phone dialog) */
export const frameCorner = { large: theme.space.lg, small: theme.space.md };

/**
 * @param {string} [corner] - One of frameCorner
 * @returns {string} CSS declarations for the framed element itself
 */
export const frameStyles = (corner = frameCorner.large) => `
	--frame-corner: ${corner};
	--frame-inset: calc(var(--frame-corner) + ${theme.space.sm});
	--aug-tl1: var(--frame-corner);
	--aug-tr1: var(--frame-corner);
	--aug-tr2: var(--frame-corner);
	--aug-br1: var(--frame-corner);
	--aug-bl1: var(--frame-corner);
	--aug-bl2: var(--frame-corner);
	--aug-border-all: 2px;
	--aug-border-bg: ${theme.colors.light(theme.colors.teal)};
	border: none;
	border-radius: 0;
	box-shadow: none;
`;

/**
 * A framed Dialog: the header and footer keep their text and buttons clear of the corners and notches
 * @param {string} [corner] - One of frameCorner
 * @returns {string} CSS for the dialog
 */
export const frameDialogStyles = (corner = frameCorner.large) => `
	${frameStyles(corner)}

	& > .header {
		padding-inline: var(--frame-inset) calc(4 * var(--frame-corner));
	}

	& > .footer {
		padding-inline: var(--frame-inset);
	}
`;
