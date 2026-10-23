import { theme, styled, delay, Button, Elem } from '@vanilla-bean/components';
import { cutCornerEdgeStyles, frameAttributes, frameColor, frameCorner, frameStyles } from './frame';

const defaultCharacterDelay = 12;

export class ConsoleContainer extends (styled.Component`
	${frameStyles()}
	position: relative;
	background: ${theme.colors.black};
	width: clamp(90vw, 80vw, 1700px);
	margin: 6em auto;
	padding: var(--frame-inset);
	box-sizing: border-box;

	@media ${theme.media.phone} {
		--frame-corner: ${frameCorner.small};
		width: calc(100% - 24px);
		max-width: 100vw;
		margin-left: ${theme.space.md};
		margin-right: ${theme.space.md};
		margin-top: 3em;
		margin-bottom: 3em;
	}

	& > pre {
		font-family: 'FontWithASyntaxHighlighter', monospace;
		font-palette: --void-driller-console-theme;
		color: ${theme.colors.white};
		font-size: 18px;
		white-space: pre-wrap;
	}

	/* A terminal's field: a corner cut, edged in the frame's color, brighter while typing */
	& input:not([type='checkbox']) {
		--input-edge: ${theme.colors.alpha(frameColor, 0.5)};
		--input-edge-width: 1px;

		${cutCornerEdgeStyles('tr', theme.space.sm, 'var(--input-edge)', 'var(--input-edge-width)')}

		&:focus {
			--input-edge: ${frameColor};
			--input-edge-width: 2px;

			box-shadow: inset 0 0 0 1px var(--input-edge);
		}

		&.validation-errors {
			--input-edge: ${theme.colors.light(theme.colors.red)};
		}
	}

	/* Below the top right notch and its corner */
	& > button {
		position: absolute;
		top: calc(2 * var(--frame-corner));
		right: var(--frame-inset);
	}
`) {
	async typeText(text, getCharacterDelay = () => defaultCharacterDelay) {
		for (let i = 0; i < text.length; i++) {
			if (this.skipped) return;

			const character = text[i];
			this.consoleText.elem.textContent += character;

			await delay(getCharacterDelay(character, i));
		}
	}

	constructor(options = {}, ...children) {
		super({ ...frameAttributes, ...options }, ...children);
	}

	build() {
		this._init();
	}

	async _init() {
		this.initialized = true;
		this.skipped = false;

		this.skip = new Button({
			appendTo: this,
			content: 'skip',
			onPointerPress: () => {
				this.skipped = true;

				this.consoleText.elem.textContent = this.options.textContent;
				this.append(this.options.append);
				this.skip.elem.remove();
			},
		});

		this.consoleText = new Elem({
			appendTo: this,
			tag: 'pre',
		});

		const connectingMessage = '> Connecting...';

		await this.typeText(connectingMessage, (character, index) => (character === '.' && index > 11 ? 110 : 33));

		await delay(500);

		if (this.skipped) return;

		this.consoleText.elem.textContent = '';

		await this.typeText(this.options.textContent);

		if (this.options.append) {
			for (const elem of this.options.append) {
				if (this.skipped) return;

				await delay(50);

				if (this.skipped) return;

				this.append(elem);
			}
		}

		this.skip.elem.remove();
	}

	// data: textContent and append collide with the elem property and Component method;
	// content is managed manually here, so both must stay store-only
	static schema = {
		textContent: { data: true },
		append: { data: true },
	};
}
