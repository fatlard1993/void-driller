import { Card as LibraryCard, Elem, styled, theme } from '@vanilla-bean/components';

import { cardFrameAttributes, cardFrameStyles, frameColor } from './frame';

/** The edge a card wears, as its accent: something the player can take now, or something already theirs */
export const cardEdge = { available: theme.colors.success, owned: frameColor };

/**
 * The library's Card in the game's cut-corner frame, laid out as a header, a body and a footer. Its accent edges the
 * whole frame rather than striping the left side. One that can't be taken now (can't afford, locked) is `disabled`,
 * which dims it whole and says so.
 */
export class Card extends styled(
	LibraryCard,
	({ colors, space }) => `
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: ${colors.darkest(colors.gray)};
		padding: ${space.md};
		min-width: 120px;
		gap: ${space.sm};
		${cardFrameStyles}

		/* The accent is the frame's edge (cardFrameStyles reads --card-accent), not an inset stripe */
		&.accented {
			box-shadow: none;
		}

		& .card-header {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: ${space.sm};
			margin-bottom: ${space.sm};
			font-weight: bold;
			text-align: center;
			color: ${colors.lighter(colors.gray)};
		}

		& .card-body {
			flex: 1;
			width: 100%;
			text-align: center;
		}

		& .card-footer {
			margin-top: ${space.sm};
			text-align: center;
		}

		& .card-footer.buttons {
			display: flex;
			flex-wrap: wrap;
			gap: ${space.sm};

			& > button {
				flex: 1;
				min-width: 80px;
			}
		}
	`,
) {
	static schema = {
		header: {},
		body: {},
		footer: {},
		footerButtons: {},
	};

	constructor(options = {}, ...children) {
		super({ ...cardFrameAttributes, ...options }, ...children);
	}

	build() {
		// The library Card's own build: a disabled card presses nothing
		super.build();

		const { header, body, footer, footerButtons } = this.options;

		this.append(
			[
				header && new Elem({ content: header, className: 'card-header' }),
				body && new Elem({ content: body, className: 'card-body' }),
				footer && new Elem({ content: footer, className: footerButtons ? 'card-footer buttons' : 'card-footer' }),
			].filter(Boolean),
		);
	}
}
