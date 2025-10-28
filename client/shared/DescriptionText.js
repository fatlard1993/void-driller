import { Elem, Button, styled } from 'vanilla-bean-components';

/**
 * Component that displays summary text with an optional "more/less" button to toggle full description.
 * Used consistently across cards that show asset information.
 */
export class DescriptionText extends (styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	text-align: center;
	max-width: 100%;

	.summary-text {
		font-size: 12px;
		line-height: 1.3;
		max-width: 100%;
		word-wrap: break-word;
	}

	.description-text {
		font-size: 12px;
		line-height: 1.3;
		max-width: 100%;
		word-wrap: break-word;
		font-style: italic;
	}

	.toggle-button {
		font-size: 10px;
		padding: 2px 8px;
		margin-top: 2px;
	}
`) {
	constructor(options = {}) {
		super({
			summary: '',
			description: '',
			title: '',
			expanded: false,
			...options,
		});
	}

	render() {
		super.render();

		this.renderContent();
	}

	renderContent() {
		// Clear and re-render content
		this.empty();

		// Show either summary or description based on expanded state
		new Elem({
			className: this.options.expanded ? 'description-text' : 'summary-text',
			content: this.options.expanded ? this.options.description : this.options.summary,
			appendTo: this,
		});

		// Show toggle button if we have both summary and description
		if (this.options.summary && this.options.description) {
			new Button({
				className: 'toggle-button',
				content: this.options.expanded ? 'Less' : 'More',
				variant: 'secondary',
				appendTo: this,
				onPointerPress: () => {
					this.options.expanded = !this.options.expanded;
					this.renderContent();
				},
			});
		}
	}
}
