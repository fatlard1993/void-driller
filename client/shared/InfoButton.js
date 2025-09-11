import { Button, Elem, Component, Popover, theme } from 'vanilla-bean-components';

/**
 * Small info button that shows detailed information in a popover when clicked
 */
export class InfoButton extends Component {
	constructor(options = {}) {
		const defaultStyle = {
			display: 'inline-flex',
			alignItems: 'center',
			gap: '4px'
		};

		super({
			...options,
			style: {
				...defaultStyle,
				...options.style
			}
		});
		
		this.title = options.title || 'Information';
		this.description = options.description || '';
	}

	render() {
		this._infoButton = new Button({
			icon: 'info-circle',
			appendTo: this,
			style: {
				fontSize: '12px',
				padding: '4px',
				minWidth: 'auto',
				background: theme.colors.darker(theme.colors.blue),
				border: `1px solid ${theme.colors.blue}`,
				borderRadius: '50%',
				color: theme.colors.light(theme.colors.blue),
				cursor: 'pointer'
			},
			onPointerPress: () => this.showPopover()
		});

		super.render();
	}

	showPopover() {
		// Don't create multiple popovers
		if (this._popover) {
			return;
		}

		// Build popover content using more idiomatic vanilla-bean-components pattern
		const content = [
			// Title (conditionally included)
			...(this.title ? [new Elem({
				content: this.title,
				style: {
					fontWeight: 'bold',
					marginBottom: '8px',
					color: theme.colors.lighter(theme.colors.gray)
				}
			})] : []),
			
			// Description
			new Elem({
				content: this.description,
				style: {
					fontSize: '13px',
					lineHeight: '1.4',
					color: theme.colors.light(theme.colors.gray)
				}
			})
		];

		// Create popover using vanilla-bean-components Popover
		this._popover = new Popover({
			trigger: this._infoButton,
			content: content,
			position: 'right',
			style: {
				background: theme.colors.darkest(theme.colors.gray),
				border: `2px solid ${theme.colors.gray}`,
				borderRadius: '8px',
				padding: '12px',
				maxWidth: '300px',
				boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
			},
			// Use vanilla-bean-components' built-in cleanup instead of setTimeout
			onClose: () => {
				this._popover = null;
			}
		});
	}
}