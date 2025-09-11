import { Elem, styled } from 'vanilla-bean-components';

/**
 * Standardized grid layout component for displaying cards with consistent max-width constraints.
 * Prevents cards from stretching too wide while maintaining responsive behavior.
 */
export class CardGrid extends (styled.Component`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 300px));
	justify-content: center;
	gap: 12px;
`) {
	constructor(options = {}) {
		super({
			minCardWidth: 200,
			maxCardWidth: 300,
			gap: 12,
			...options,
		});
	}

	render() {
		super.render();

		// Update grid styles based on options
		this.elem.style.gridTemplateColumns = `repeat(auto-fit, minmax(${this.options.minCardWidth}px, ${this.options.maxCardWidth}px))`;
		this.elem.style.gap = `${this.options.gap}px`;

		// Append any provided content
		if (this.options.content) {
			if (Array.isArray(this.options.content)) {
				this.append(this.options.content);
			} else {
				this.append([this.options.content]);
			}
		}
	}
}