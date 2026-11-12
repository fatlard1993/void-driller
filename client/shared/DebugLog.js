import { Button, Content, Elem, styled, writeStorage, theme } from '@vanilla-bean/components';
import gameContext from './gameContext';

// Each kind of entry in the color of its role
const logIntent = { error: 'danger', warn: 'warning', log: 'info', info: 'success' };

export default class DebugLog extends (styled.Component`
	position: fixed;
	top: 80px;
	left: 10px;
	flex-direction: column;
	background: ${({ colors }) => colors.alpha(colors.black, 0.9)};
	color: ${({ colors }) => colors.success};
	padding: ${({ space }) => space.md};
	font-family: 'Courier New', monospace;
	font-size: ${theme.fontSize.xs};
	z-index: 10000;
	max-width: 90%;
	max-height: 40vh;
	border: 1px solid ${({ colors }) => colors.border};
	border-radius: ${({ radius }) => radius.sm};
	white-space: pre-wrap;
	word-wrap: break-word;

	& .debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: ${({ space }) => space.sm};
		margin-bottom: ${({ space }) => space.sm};
		padding-bottom: ${({ space }) => space.xs};
		border-bottom: 1px solid ${({ colors }) => colors.border};
		font-weight: bold;
	}

	& .debug-content {
		line-height: 1.3;
		min-height: 100px;

		& > span {
			display: block;
		}
	}

	${({ colors }) =>
		Object.entries(logIntent)
			.map(([type, intent]) => `& .log-${type} { color: ${colors[intent]}; }`)
			.join('\n')}
`) {
	constructor(options = {}) {
		super({ ...options, autoRender: false });

		this.logs = [];
		this.maxLogs = 100;

		// Set up global debug logging function
		this.setupGlobalDebugLog();

		// Initial render and visibility
		this.render();
		this.setVisibility(gameContext.debugVisible);

		// Store reference globally so console can control it
		window.debugLogComponent = this;
	}

	// The console is wrapped once per page; each Play mount takes over as the log that receives it
	setupGlobalDebugLog() {
		window.debugLog = (message, type = 'info') => this.addLog(message, type);

		if (console.log.debugLogWrapped) return;

		const original = { log: console.log, error: console.error, warn: console.warn };

		Object.entries({ log: 'LOG', error: 'ERROR', warn: 'WARN' }).forEach(([method, label]) => {
			console[method] = (...args) => {
				original[method](...args);
				window.debugLogComponent?.addLog(`${label}: ${args.join(' ')}`, method);
			};
			console[method].debugLogWrapped = true;
		});
	}

	addLog(message, type = 'info') {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = {
			message,
			type,
			timestamp,
			id: Date.now() + Math.random(),
		};

		this.logs.push(logEntry);

		// Keep only the last maxLogs entries
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		// Re-render if visible
		if (gameContext.debugVisible) {
			this.updateContent();
		}
	}

	updateContent() {
		if (!this.content) return;

		this.content.elem.replaceChildren(
			...this.logs.map(
				log =>
					new Elem({
						tag: 'span',
						className: `log-${logIntent[log.type] ? log.type : 'info'}`,
						textContent: `[${log.timestamp}] ${log.message}`,
					}).elem,
			),
		);

		// Auto-scroll to bottom
		this.content.elem.scrollTop = this.content.elem.scrollHeight;
	}

	setVisibility(visible) {
		if (visible) {
			this.elem.style.display = 'flex';
			this.updateContent();
		} else {
			this.elem.style.display = 'none';
		}
	}

	clear() {
		this.logs = [];
		this.updateContent();
	}

	build() {
		new Elem(
			{ className: 'debug-header', appendTo: this },
			new Elem({ tag: 'span', textContent: 'Debug Log' }),
			new Elem(
				{},
				new Button({ textContent: 'Clear', variant: 'flat', onPointerPress: () => this.clear() }),
				new Button({
					icon: 'xmark',
					variant: 'flat',
					'aria-label': 'Close',
					onPointerPress: () => {
						gameContext.debugVisible = false;
						writeStorage('debugVisible', false);
					},
				}),
			),
		);

		this.content = new Content({ addClass: 'debug-content', appendTo: this });

		// Initial content
		this.addLog('Debug log initialized');
	}
}
