import { Elem, styled } from 'vanilla-bean-components';
import { ItemImage } from './SpriteSheetImage';

/**
 * Displays a price/credits amount with the credits icon
 * @param {number} amount - The credit amount to display
 * @param {string} variant - 'default', 'success' (green), 'error' (red)
 * @param {number} size - Icon size (default 16)
 * @param {string|Element} prefix - Content to display before the price (e.g., 'Buy (')
 * @param {string|Element} suffix - Content to display after the price (e.g., ')')
 */
export default class PriceDisplay extends (styled.Component`
	display: inline-flex;
	align-items: center;
	gap: 4px;

	.credits-icon {
		flex-shrink: 0;
	}

	.amount {
		font-weight: bold;
		white-space: nowrap;
	}

	.prefix, .suffix {
		white-space: nowrap;
	}

	&.success .credits-icon {
		filter: hue-rotate(90deg) saturate(1.5);
	}

	&.error .credits-icon {
		filter: hue-rotate(-30deg) saturate(1.5);
	}
`) {
	render() {
		super.render();

		const { amount, variant = 'default', size = 16, prefix, suffix } = this.options;

		// Add variant class for color styling
		if (variant !== 'default') {
			this.elem.classList.add(variant);
		}

		// Add prefix if provided
		if (prefix) {
			this.append(
				typeof prefix === 'string'
					? new Elem({ tag: 'span', className: 'prefix', content: prefix })
					: prefix,
			);
		}

		// Credits icon and amount
		this.append(
			new ItemImage('credits', {
				className: 'credits-icon',
				displaySize: size,
			}),
			new Elem({
				tag: 'span',
				className: 'amount',
				content: typeof amount === 'number' ? amount.toLocaleString() : amount,
			}),
		);

		// Add suffix if provided
		if (suffix) {
			this.append(
				typeof suffix === 'string'
					? new Elem({ tag: 'span', className: 'suffix', content: suffix })
					: suffix,
			);
		}
	}
}
