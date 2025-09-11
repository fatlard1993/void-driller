import { Component, styled } from 'vanilla-bean-components';

const Heading = styled(
	Component,
	() => `
		font-size: 1.5em;
    margin: 0;
		position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 40%;

		/* Mobile responsive heading */
		@media (max-width: 768px) {
			font-size: 1.2em;
			max-width: 100%;
			position: relative;
			left: auto;
			transform: none;
			text-align: center;
			margin: 5px 0;
		}

		&:before {
			content: "";
		}
	`,
	{ tag: 'h1' },
);

const FlexContainer = styled(
	Component,
	() => `
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		/* Mobile responsive layout */
		@media (max-width: 768px) {
			flex-wrap: wrap;
			gap: 5px;
		}

		/* Make buttons smaller on mobile */
		@media (max-width: 768px) {
			button {
				font-size: 0.9em !important;
				padding: 6px 10px !important;
				min-height: 32px !important;
			}
		}
	`,
);

export default class Toolbar extends Component {
	constructor(options = {}, ...children) {
		super(
			{
				left: [],
				right: [],
				...options,
				styles: (theme, Component) => `
					padding: 15px 15px 0 15px;
					height: 57px;
					background-color: ${theme.colors.darkest(theme.colors.gray)};

					/* Mobile responsive improvements */
					@media (max-width: 768px) {
						padding: 10px 8px 0 8px;
						height: auto;
						min-height: 50px;
					}

					${options.styles?.(theme, Component) || ''}
				`,
			},
			...children,
		);
	}

	render() {
		if (this.options.heading?.elem) {
			this.options.heading.appendTo(this);
			this._heading = this.options.heading;
		} else {
			this._heading = new Heading({
				appendTo: this,
				...(typeof this.options.heading === 'string' ? { textContent: this.options.heading } : this.options.heading),
			});
		}
		this._left = new Component({}, ...this.options.left);
		this._right = new Component({}, ...this.options.right);

		new FlexContainer({ appendTo: this }, this._left, this._right);

		super.render();
	}

	setOption(key, value) {
		if (key === 'heading') this._heading.elem.textContent = value;
		else if (key === 'left') {
			this._left.empty();
			this._left.append(value);
		} else if (key === 'right') {
			this._right.empty();
			this._right.append(value);
		} else super.setOption(key, value);
	}
}
