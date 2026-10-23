import { Component, Elem, styled, theme } from '@vanilla-bean/components';

import { cardFrameAttributes, cardFrameStyles, frameColor } from './frame';

/**
 * Standardized card container component with optional header, body, and footer sections
 * Based on the SpacecoDialog shop player inventory item cards reference template
 */
export class Card extends styled(
	Component,
	({ colors, space }) => `
		display: flex;
		flex-direction: column;
		align-items: center;
		background: ${colors.darkest(colors.gray)};
		padding: ${space.md};
		min-width: 120px;
		gap: ${space.sm};
		${cardFrameStyles}

		&.state-available {
			--card-edge: ${colors.success};
		}

		&.state-unavailable {
			--card-edge: ${colors.alpha(colors.danger, 0.7)};
		}

		&.state-owned {
			--card-edge: ${frameColor};
		}
	`,
) {
	static schema = {
		header: {},
		body: {},
		footer: {},
		footerButtons: {},
		// Edges the card: 'available' to take (affordable), 'unavailable' (can't afford, or locked), or 'owned'
		state: {
			enum: ['available', 'unavailable', 'owned'],
			set(value) {
				this.removeClass(/\bstate-\S+\b/g);

				if (value) this.addClass(`state-${value}`);
			},
		},
	};

	constructor(options = {}, ...children) {
		super({ ...cardFrameAttributes, ...options }, ...children);
	}

	build() {
		// Use @vanilla-bean/components append pattern for cleaner organization
		const sections = [];

		// Header section
		if (this.options.header) {
			sections.push(
				new Elem({
					content: this.options.header,
					className: 'card-header',
					style: {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: theme.space.sm,
						fontWeight: 'bold',
						textAlign: 'center',
						marginBottom: theme.space.sm,
						color: theme.colors.lighter(theme.colors.gray),
					},
				}),
			);
		}

		// Body section
		if (this.options.body) {
			sections.push(
				new Elem({
					content: this.options.body,
					className: 'card-body',
					style: {
						flex: '1',
						textAlign: 'center',
						width: '100%',
					},
				}),
			);
		}

		// Footer section
		if (this.options.footer) {
			const footerStyle = this.options.footerButtons
				? {
						display: 'flex',
						flexDirection: 'row',
						gap: theme.space.sm,
						marginTop: theme.space.sm,
						flexWrap: 'wrap',
					}
				: {
						marginTop: theme.space.sm,
						textAlign: 'center',
					};

			// Apply flex styles to footer buttons more idiomatically
			let footerContent = this.options.footer;
			if (this.options.footerButtons && Array.isArray(footerContent)) {
				footerContent = footerContent.map(child => {
					if (child.constructor.name === 'Button') {
						return Object.assign(child, {
							style: { ...child.style, flex: '1', minWidth: '80px' },
						});
					}
					return child;
				});
			}

			sections.push(
				new Elem({
					content: footerContent,
					className: 'card-footer',
					style: footerStyle,
				}),
			);
		}

		// Append all sections at once using @vanilla-bean/components pattern
		this.append(sections);
	}
}
