import { styled } from 'vanilla-bean-components';
import gameContext from './gameContext';

export default class DebugLog extends (styled.Component`
	position: fixed;
	top: 80px;
	left: 10px;
	background: rgba(0, 0, 0, 0.9);
	color: #00ff00;
	padding: 10px;
	font-family: 'Courier New', monospace;
	font-size: 11px;
	z-index: 10000;
	max-width: 90%;
	max-height: 40vh;
	overflow-y: auto;
	border: 1px solid #333;
	border-radius: 4px;
	white-space: pre-wrap;
	word-wrap: break-word;

	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: #222;
	}

	&::-webkit-scrollbar-thumb {
		background: #555;
		border-radius: 4px;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #777;
	}
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

	setupGlobalDebugLog() {
		// Store original console methods
		const originalLog = console.log;
		const originalError = console.error;
		const originalWarn = console.warn;

		// Set up the global debug log function
		window.debugLog = (message, type = 'info') => {
			this.addLog(message, type);
		};

		// Override console methods to capture all logging
		console.log = (...args) => {
			originalLog(...args);
			this.addLog('LOG: ' + args.join(' '), 'log');
		};

		console.error = (...args) => {
			originalError(...args);
			this.addLog('ERROR: ' + args.join(' '), 'error');
		};

		console.warn = (...args) => {
			originalWarn(...args);
			this.addLog('WARN: ' + args.join(' '), 'warn');
		};
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
		if (!this.contentDiv) return;

		const logHtml = this.logs
			.map(log => {
				const color = this.getLogColor(log.type);
				return `<span style="color: ${color}">[${log.timestamp}] ${log.message}</span>`;
			})
			.join('\n');

		this.contentDiv.innerHTML = logHtml;

		// Auto-scroll to bottom
		this.contentDiv.scrollTop = this.contentDiv.scrollHeight;
	}

	getLogColor(type) {
		switch (type) {
			case 'error':
				return '#ff4444';
			case 'warn':
				return '#ffaa00';
			case 'log':
				return '#88ccff';
			default:
				return '#00ff00';
		}
	}

	setVisibility(visible) {
		if (visible) {
			this.elem.style.display = 'block';
			this.updateContent();
		} else {
			this.elem.style.display = 'none';
		}
	}

	clear() {
		this.logs = [];
		this.updateContent();
	}

	render() {
		super.render();

		// Create header with controls
		const header = document.createElement('div');
		header.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
			padding-bottom: 4px;
			border-bottom: 1px solid #333;
			font-weight: bold;
		`;

		const title = document.createElement('span');
		title.textContent = 'Debug Log';
		title.style.color = '#00ff00';

		const controls = document.createElement('div');

		// Clear button
		const clearBtn = document.createElement('button');
		clearBtn.textContent = 'Clear';
		clearBtn.style.cssText = `
			background: #333;
			color: #fff;
			border: 1px solid #555;
			padding: 2px 8px;
			font-size: 10px;
			border-radius: 2px;
			cursor: pointer;
			margin-left: 5px;
		`;
		clearBtn.onclick = () => this.clear();

		// Close button
		const closeBtn = document.createElement('button');
		closeBtn.textContent = '×';
		closeBtn.style.cssText = `
			background: #d33;
			color: #fff;
			border: none;
			padding: 2px 6px;
			font-size: 12px;
			border-radius: 2px;
			cursor: pointer;
			margin-left: 5px;
		`;
		closeBtn.onclick = () => {
			gameContext.debugVisible = false;
			localStorage.setItem('debugVisible', JSON.stringify(false));
		};

		controls.appendChild(clearBtn);
		controls.appendChild(closeBtn);
		header.appendChild(title);
		header.appendChild(controls);

		// Create content area
		this.contentDiv = document.createElement('div');
		this.contentDiv.style.cssText = `
			line-height: 1.3;
			min-height: 100px;
		`;

		this.elem.appendChild(header);
		this.elem.appendChild(this.contentDiv);

		// Initial content
		this.addLog('Debug log initialized');
	}
}
