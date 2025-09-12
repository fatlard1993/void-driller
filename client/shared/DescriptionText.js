import { Elem, styled } from 'vanilla-bean-components';
import { InfoButton } from './InfoButton';

/**
 * Component that displays summary text with an optional "more" info button below.
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

	.more-button-container {
		display: flex;
		justify-content: center;
	}
`) {
	constructor(options = {}) {
		super({
			summary: '',
			description: '',
			title: '',
			...options,
		});
	}

	render() {
		super.render();

		// Always show summary text
		if (this.options.summary) {
			new Elem({
				className: 'summary-text',
				content: this.options.summary,
				appendTo: this,
			});
		}

		// Show "more" button if we have a description
		if (this.options.description) {
			new Elem(
				{ className: 'more-button-container', appendTo: this },
				new InfoButton({
					title: this.options.title || 'More Information',
					description: this.options.description,
				}),
			);
		}
	}
}
