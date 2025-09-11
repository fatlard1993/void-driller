import { Button, Elem, Popover, styled } from 'vanilla-bean-components';
import gameContext from './gameContext';

export class InfoButton extends (styled.Component`
	display: inline-flex;
	align-items: center;
	gap: 4px;

	.info-button {
		font-size: 12px;
		padding: 4px;
		min-width: auto;
	}

	.popover-content {
		max-width: 300px;
	}

	.popover-title {
		font-weight: bold;
		margin-bottom: 8px;
		color: ${({ colors }) => colors.lighter(colors.gray)};
		border-bottom: 1px solid ${({ colors }) => colors.dark(colors.gray)};
		padding-bottom: 4px;
	}

	.popover-description {
		font-size: 13px;
		line-height: 1.4;
	}
`) {
	constructor(options = {}) {
		super({
			title: 'Information',
			description: '',
			...options,
		});
	}

	render() {
		super.render();

		// Create the info button using default Button styling
		this._infoButton = new Button({
			className: 'info-button',
			content: this.options.buttonText || 'more',
			appendTo: this,
			onPointerPress: () => this.showPopover(),
		});

		// Play sound effect like other interactive elements
		if (gameContext?.sounds?.blip) {
			this._infoButton.elem.addEventListener('click', () => {
				gameContext.sounds.blip.play({ volume: gameContext.volume.interfaces });
			});
		}
	}

	showPopover() {
		// Don't create multiple popovers
		if (this._popover) {
			return;
		}

		// Build popover content
		const contentElements = [];

		// Add title if provided
		if (this.options.title && this.options.title !== 'Information') {
			contentElements.push(
				new Elem({
					className: 'popover-title',
					content: this.options.title,
				})
			);
		}

		// Add description
		if (this.options.description) {
			contentElements.push(
				new Elem({
					className: 'popover-description',
					content: this.options.description,
				})
			);
		} else {
			contentElements.push(
				new Elem({
					className: 'popover-description',
					content: 'No additional information available.',
					style: { fontStyle: 'italic' },
				})
			);
		}

		// Create popover container using minimal styling
		const popoverContainer = new Elem({
			className: 'popover-content',
			append: contentElements,
		});

		// Get button position for popover positioning
		const buttonRect = this._infoButton.elem.getBoundingClientRect();
		
		// Create popover with explicit positioning
		this._popover = new Popover({
			trigger: this._infoButton.elem,
			content: popoverContainer,
			position: 'top',
			x: buttonRect.left + buttonRect.width / 2,
			y: buttonRect.top,
			onClose: () => {
				this._popover = null;
			},
		});
	}

	// Handle cleanup when component is destroyed
	destroy() {
		if (this._popover) {
			this._popover.close();
			this._popover = null;
		}
		super.destroy?.();
	}
}