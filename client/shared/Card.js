import { Component, Elem, theme } from 'vanilla-bean-components';

/**
 * Standardized card container component with optional header, body, and footer sections
 * Based on the SpacecoDialog shop player inventory item cards reference template
 */
export class Card extends Component {
	constructor(options = {}) {
		const defaultStyle = {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			background: theme.colors.darkest(theme.colors.gray),
			border: `2px solid ${theme.colors.gray}`,
			borderRadius: '6px',
			padding: '12px',
			minWidth: '120px',
			gap: '6px',
		};

		super({
			...options,
			style: {
				...defaultStyle,
				...options.style,
			},
		});
	}

	render() {
		// Use vanilla-bean-components append pattern for cleaner organization
		const sections = [];

		// Header section
		if (this.options.header) {
			sections.push(
				new Elem({
					content: this.options.header,
					className: 'card-header',
					style: {
						fontWeight: 'bold',
						textAlign: 'center',
						marginBottom: '6px',
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
						gap: '6px',
						marginTop: '6px',
						flexWrap: 'wrap',
					}
				: {
						marginTop: '6px',
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

		// Append all sections at once using vanilla-bean-components pattern
		this.append(sections);
		super.render();
	}
}
