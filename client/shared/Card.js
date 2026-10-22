import { Component, Elem, theme } from '@vanilla-bean/components';

/**
 * Standardized card container component with optional header, body, and footer sections
 * Based on the SpacecoDialog shop player inventory item cards reference template
 */
export class Card extends Component {
	static schema = {
		header: {},
		body: {},
		footer: {},
		footerButtons: {},
	};

	constructor(options = {}) {
		const defaultStyle = {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			background: theme.colors.darkest(theme.colors.gray),
			border: `2px solid ${theme.colors.gray}`,
			borderRadius: theme.radius.md,
			padding: theme.space.md,
			minWidth: '120px',
			gap: theme.space.sm,
		};

		super({
			...options,
			style: {
				...defaultStyle,
				...options.style,
			},
		});
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
