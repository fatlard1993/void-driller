import { Elem, styled } from 'vanilla-bean-components';
import { ItemImage } from './SpriteSheetImage';

/**
 * Displays a price/credits amount with the credits icon
 * @param {number} amount - The credit amount to display
 * @param {string} variant - 'default', 'success' (green), 'error' (red)
 * @param {number} size - Icon size (default 16)
 * @param {string|Element} preText - Content to display before the price (e.g., '(')
 * @param {string|Element} postText - Content to display after the price (e.g., ')')
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

		const { amount, variant = 'default', size = 16, preText, postText } = this.options;

		// Add variant class for color styling
		if (variant !== 'default') {
			this.elem.classList.add(variant);
		}

		// Add preText if provided
		if (preText) {
			this.append(
				typeof preText === 'string'
					? new Elem({ tag: 'span', className: 'prefix', content: preText })
					: preText,
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

		// Add postText if provided
		if (postText) {
			this.append(
				typeof postText === 'string'
					? new Elem({ tag: 'span', className: 'suffix', content: postText })
					: postText,
			);
		}
	}
}
