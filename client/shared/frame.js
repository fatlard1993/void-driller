import { Label, configured, theme } from '@vanilla-bean/components';

/** The frame's edge, wherever the game draws one */
export const frameColor = theme.colors.light(theme.colors.teal);

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
	--aug-border-bg: ${frameColor};
	border: none;
	border-radius: 0;
	box-shadow: none;
`;

/**
 * Corners cut off a box by clip-path: for a shape with no edge to draw, or an element that can't carry augmented-ui's
 * pseudo-elements (a button's icon is its ::before, an input has none)
 * @param {string} size - How far each cut reaches along both sides
 * @param {Array<'tl'|'tr'|'br'|'bl'>} corners - The corners to cut
 * @returns {string} A clip-path value
 */
export const cutCorners = (size, corners) => {
	const far = `calc(100% - ${size})`;
	const cut = (corner, points, square) => (corners.includes(corner) ? points : square);

	return `polygon(${[
		cut('tl', `0 ${size}, ${size} 0`, '0 0'),
		cut('tr', `${far} 0, 100% ${size}`, '100% 0'),
		cut('br', `100% ${far}, ${far} 100%`, '100% 100%'),
		cut('bl', `${size} 100%, 0 ${far}`, '0 100%'),
	].join(', ')})`;
};

/**
 * A section of a framed dialog: two opposite corners cut, smaller than the frame around it, and filled rather than edged.
 * A markdown callout takes the same corners over its own colors.
 */
const subPanelClass = 'sub-panel';

/** A titled section of a framed dialog; what sits inside it (a list, a slider, a field) stays plain */
export const SubPanel = configured(Label, { addClass: subPanelClass });

/** For a section that isn't a SubPanel; spread into its options */
export const subPanelOptions = { addClass: subPanelClass };

/**
 * A framed Dialog: the header and footer keep their text and buttons clear of the corners and notches, and its sections
 * take the sub-panel's shape
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

	& :is(.${subPanelClass}, blockquote) {
		--sub-panel-corner: ${theme.space.md};

		clip-path: ${cutCorners('var(--sub-panel-corner)', ['tl', 'br'])};
		border-radius: 0;

		@media ${theme.media.phone} {
			--sub-panel-corner: ${theme.space.sm};
		}
	}

	& .${subPanelClass} {
		background-color: ${theme.colors.alpha(theme.colors.teal, 0.08)};
		border: none;
	}
`;

/** A card: the sub-panel's corners, edged in --card-edge, which the card's state sets (augmented-ui) */
export const cardFrameAttributes = { 'data-augmented-ui': 'tl-clip br-clip border' };

export const cardFrameStyles = `
	--aug-tl1: ${theme.space.md};
	--aug-br1: ${theme.space.md};
	--aug-border-all: 2px;
	--aug-border-bg: var(--card-edge, ${theme.colors.gray});
	border: none;
	border-radius: 0;

	@media ${theme.media.phone} {
		--aug-tl1: ${theme.space.sm};
		--aug-br1: ${theme.space.sm};
	}
`;
