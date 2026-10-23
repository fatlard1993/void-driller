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

/** A tab: one corner cut, and the selected one edged in the frame's color (augmented-ui) */
export const tabFrameAttributes = selected => ({ 'data-augmented-ui': selected ? 'tr-clip border' : 'tr-clip' });

export const tabFrameStyles = `
	--aug-tr1: ${theme.space.md};
	--aug-border-all: 2px;
	--aug-border-bg: ${frameColor};
	border-radius: 0;

	@media ${theme.media.phone} {
		--aug-tr1: ${theme.space.sm};
	}
`;

// Each corner's cut runs across the corner box, and a gradient starting from the corner meets it halfway
const cornerGradients = {
	tl: ['to bottom right', 'left top'],
	tr: ['to bottom left', 'right top'],
	br: ['to top left', 'right bottom'],
	bl: ['to top right', 'left bottom'],
};

/**
 * The edge along a clip-path cut, which a border can't follow: a line across the corner's box, inside the cut
 * @param {'tl'|'tr'|'br'|'bl'} corner - The corner cut
 * @param {string} color - The edge's color
 * @param {string} width - The edge's width
 * @returns {string} A background image for the corner's box
 */
const cutEdge = (corner, color, width) =>
	`linear-gradient(${cornerGradients[corner][0]}, transparent 50%, ${color} 50%, ${color} calc(50% + ${width}), transparent calc(50% + ${width}))`;

/**
 * One corner cut, with the box's border carried across the cut (clip-path, for a box with a border and no room for
 * augmented-ui's pseudo-elements: a toast's icon is its ::before, an input has none)
 * @param {'tl'|'tr'|'br'|'bl'} corner - The corner to cut
 * @param {string} size - How far the cut reaches along both sides
 * @param {string} edge - The border's color
 * @param {string} [width] - The border's width
 * @returns {string} CSS declarations; the box keeps its own background color
 */
export const cutCornerEdgeStyles = (corner, size, edge, width = '1px') => `
	clip-path: ${cutCorners(size, [corner])};
	border-radius: 0;
	border-color: ${edge};
	background-image: ${cutEdge(corner, edge, width)};
	background-position: ${cornerGradients[corner][1]};
	background-size: ${size} ${size};
	background-repeat: no-repeat;
	background-origin: border-box;
`;

/**
 * The game's top bars (the framework's toolbars, styled from here as a stylesheet): the lower edge angles up at both
 * ends, ruled in the frame's color, and each button's outer bottom corner is cut toward the screen edge it sits by.
 * A dialog's footer buttons stay plain.
 */
export const frameToolbarStyles = `
	.variant-bar:has(> .left):has(> .right) {
		--toolbar-corner: ${theme.space.md};
		--chrome-corner: ${theme.space.md};

		clip-path: polygon(
			0 0,
			100% 0,
			100% calc(100% - var(--toolbar-corner)),
			calc(100% - var(--toolbar-corner)) 100%,
			var(--toolbar-corner) 100%,
			0 calc(100% - var(--toolbar-corner))
		);
		border-bottom: none;
		padding-bottom: calc(${theme.space.sm} + var(--toolbar-corner) / 2);
		background:
			${cutEdge('bl', frameColor, '2px')} left bottom / var(--toolbar-corner) var(--toolbar-corner) no-repeat,
			${cutEdge('br', frameColor, '2px')} right bottom / var(--toolbar-corner) var(--toolbar-corner) no-repeat,
			linear-gradient(${frameColor}, ${frameColor}) center bottom / calc(100% - 2 * var(--toolbar-corner)) 2px no-repeat,
			${theme.colors.surface};

		& > :is(.left, .right) > :is(.vbc-button, .variant-button) {
			border-radius: 0;
			/* Inside the cut, where an outline outside it would be clipped */
			outline-offset: -3px;
		}

		& > .left > :is(.vbc-button, .variant-button) {
			clip-path: ${cutCorners('var(--chrome-corner)', ['bl'])};
		}

		& > .right > :is(.vbc-button, .variant-button) {
			clip-path: ${cutCorners('var(--chrome-corner)', ['br'])};
		}

		@media ${theme.media.phone} {
			--toolbar-corner: ${theme.space.sm};
			--chrome-corner: ${theme.space.sm};
		}
	}
`;

/**
 * A box with some corners cut, as points for the canvas (Phaser) to draw in the frame's language. Each cut is clamped
 * to the box, so a nearly empty gauge still draws.
 * @param {number} width - The box's width
 * @param {number} height - The box's height
 * @param {{ tl?: number, tr?: number, br?: number, bl?: number }} cuts - How far each corner's cut reaches
 * @returns {Array<{ x: number, y: number }>} The points, clockwise from the top left
 */
export const cutCornerPoints = (width, height, { tl = 0, tr = 0, br = 0, bl = 0 } = {}) => {
	const [a, b, c, d] = [tl, tr, br, bl].map(cut => Math.max(0, Math.min(cut, width, height)));
	const points = [
		{ x: 0, y: a },
		{ x: a, y: 0 },
		{ x: width - b, y: 0 },
		{ x: width, y: b },
		{ x: width, y: height - c },
		{ x: width - c, y: height },
		{ x: d, y: height },
		{ x: 0, y: height - d },
	];

	// A corner left square gives the same point twice
	return points.filter(({ x, y }, index) => {
		const previous = points.at(index - 1);

		return x !== previous.x || y !== previous.y;
	});
};
