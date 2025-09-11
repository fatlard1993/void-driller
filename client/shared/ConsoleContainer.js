import { theme, styled, delay, Button, Elem } from 'vanilla-bean-components';

const defaultCharacterDelay = 12;

export class ConsoleContainer extends (styled.Component`
	position: relative;
	background: ${theme.colors.black};
	border: 3px solid ${theme.colors.lighter(theme.colors.blue)};
	width: clamp(90vw, 80vw, 1700px);
	margin: 6em auto;
	border-radius: 6px;
	padding: 6px;

	& > pre {
		font-family: 'FontWithASyntaxHighlighter', monospace;
		font-palette: --void-driller-console-theme;
		color: ${theme.colors.white};
		font-size: 18px;
		white-space: pre-wrap;
	}

	& > button {
		position: absolute;
		top: 6px;
		right: 6px;
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

	async render() {
		super.render();

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

	_setOption(key, value) {
		if (!this.initialized && ['textContent', 'append'].includes(key)) return;

		super._setOption(key, value);
	}
}
