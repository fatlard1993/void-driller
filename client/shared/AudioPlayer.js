import { Elem, styled, Button } from 'vanilla-bean-components';
import gameContext from './gameContext';

/**
 * Floating audio player UI component
 */
class AudioPlayer extends styled.Component(
	({ colors }) => `
		position: fixed;
		top: 48px;
		left: 50%;
		transform: translateX(-50%);
		background: ${colors.darkest(colors.gray)};
		border: 2px solid ${colors.light(colors.gray)};
		border-radius: 8px;
		padding: 12px 18px;
		display: flex;
		align-items: center;
		gap: 12px;
		z-index: 10000;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		animation: slideDown 0.3s ease-out;

		@keyframes slideDown {
			from {
				transform: translateX(-50%) translateY(-100%);
				opacity: 0;
			}
			to {
				transform: translateX(-50%) translateY(0);
				opacity: 1;
			}
		}

		.audio-title {
			color: ${colors.lighter(colors.gray)};
			font-size: 14px;
			font-weight: bold;
			margin: 0;
		}

		.audio-controls {
			display: flex;
			align-items: center;
			gap: 9px;
		}

		.audio-button {
			width: 32px;
			height: 32px;
			padding: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			background: ${colors.darker(colors.gray)};
			border: 1px solid ${colors.gray};
			cursor: pointer;
			transition: all 0.2s;
			border-radius: 4px;

			&:hover {
				background: ${colors.gray};
				transform: scale(1.05);
			}

			&:active {
				transform: scale(0.95);
			}

			&.play-pause {
				background: ${colors.darkest(colors.green)};
				border-color: ${colors.green};
				color: ${colors.green};

				&:hover {
					background: ${colors.darker(colors.green)};
				}
			}

			&.close {
				background: ${colors.darkest(colors.red)};
				border-color: ${colors.red};
				color: ${colors.red};

				&:hover {
					background: ${colors.darker(colors.red)};
				}
			}
		}

		.audio-visualizer {
			display: flex;
			align-items: center;
			gap: 3px;
			height: 24px;
			margin: 0 6px;
		}

		.audio-bar {
			width: 3px;
			height: 100%;
			background: ${colors.green};
			animation: pulse 0.6s ease-in-out infinite alternate;
			border-radius: 2px;
		}

		@keyframes pulse {
			from {
				transform: scaleY(0.3);
				opacity: 0.5;
			}
			to {
				transform: scaleY(1);
				opacity: 1;
			}
		}
	`,
) {
	constructor(options) {
		super(options);
		this.currentAudio = null;
		this.currentType = null;
		this.currentWorldName = null;
		this.isPlaying = false;
		this.isPaused = false;
		this.queuedType = null; // Type to play after current audio ends
	}

	render() {
		super.render();

		// Title text
		this.titleElem = new Elem({
			appendTo: this,
			className: 'audio-title',
		});

		// Controls container
		this.controlsElem = new Elem({
			appendTo: this,
			className: 'audio-controls',
		});

		// Play/Pause button
		this.playPauseBtn = new Button({
			icon: 'play',
			appendTo: this.controlsElem,
			addClass: ['audio-button', 'play-pause'],
			onPointerPress: () => this.togglePlayPause(),
		});

		// Visualizer container (populates when playing)
		this.visualizerElem = new Elem({
			appendTo: this.controlsElem,
			className: 'audio-visualizer',
		});

		// Close button
		this.closeBtn = new Button({
			icon: 'xmark',
			appendTo: this.controlsElem,
			addClass: ['audio-button', 'close'],
			onPointerPress: () => this.stop(),
		});

		this.updateUI();
	}

	/**
	 * Gets the audio file path for a given world name and type
	 * @param {string} worldName - The world name
	 * @param {string} type - The audio type (briefing or bulletin)
	 * @returns {string} The audio file path
	 */
	getAudioPath(worldName, type) {
		const fileName = worldName.replace(/:\s+/g, '_').replace(/\s+/g, '_');
		return `docs/briefings/audio/${fileName}_${type}.mp3`;
	}

	/**
	 * Checks if audio file exists for given world and type
	 * @param {string} worldName - The world name
	 * @param {string} type - The audio type (briefing or bulletin)
	 * @returns {Promise<boolean>} True if audio file exists
	 */
	async hasAudio(worldName, type) {
		const path = this.getAudioPath(worldName, type);
		try {
			const response = await fetch(path, { method: 'HEAD' });
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Play audio for a given world name and type
	 * @param {string} worldName - The world name
	 * @param {string} type - The audio type (briefing or bulletin)
	 * @param {object} options - Options
	 * @param {boolean} options.autoQueue - Auto-queue bulletin after briefing
	 * @returns {Promise<boolean>} True if playback started
	 */
	async play(worldName, type, options = {}) {
		// Stop current audio if playing (but don't remove element)
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio.currentTime = 0;
			this.currentAudio = null;
		}

		const path = this.getAudioPath(worldName, type);

		// Check if file exists
		const exists = await this.hasAudio(worldName, type);
		if (!exists) {
			return false;
		}

		// If autoQueue and playing briefing, queue bulletin
		if (options.autoQueue && type === 'briefing') {
			const hasBulletin = await this.hasAudio(worldName, 'bulletin');
			if (hasBulletin) {
				this.queuedType = 'bulletin';
			}
		}

		this.currentAudio = new Audio(path);
		this.currentType = type;
		this.currentWorldName = worldName;
		this.isPlaying = true;
		this.isPaused = false;

		// Set volume from gameContext
		this.currentAudio.volume = gameContext.volume.interfaces || 0.5;

		// Setup event listeners
		this.currentAudio.addEventListener('ended', async () => {
			// If there's a queued audio, play it
			if (this.queuedType) {
				const nextType = this.queuedType;
				this.queuedType = null;
				await this.play(worldName, nextType);
			} else {
				this.stop();
			}
		});

		this.currentAudio.addEventListener('error', () => {
			this.queuedType = null;
			this.stop();
		});

		// Play audio
		try {
			await this.currentAudio.play();
			this.updateUI();
			return true;
		} catch {
			this.queuedType = null;
			this.stop();
			return false;
		}
	}

	/**
	 * Toggle play/pause
	 */
	togglePlayPause() {
		if (!this.currentAudio) return;

		if (this.isPaused) {
			this.currentAudio.play();
			this.isPaused = false;
			this.isPlaying = true;
		} else {
			this.currentAudio.pause();
			this.isPaused = true;
			this.isPlaying = false;
		}

		this.updateUI();
	}

	/**
	 * Stop playback and hide UI
	 */
	stop() {
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio.currentTime = 0;
			this.currentAudio = null;
		}

		this.isPlaying = false;
		this.isPaused = false;
		this.currentType = null;
		this.currentWorldName = null;

		this.elem.remove();
	}

	/**
	 * Update the UI to reflect current state
	 */
	updateUI() {
		if (!this.titleElem) return;

		// Update title
		this.titleElem.content = `${this.currentType === 'briefing' ? '📡 Briefing' : '📋 Bulletin'} Audio`;

		// Update play/pause button icon
		this.playPauseBtn.options.icon = this.isPlaying ? 'pause' : 'play';

		// Update visualizer
		this.visualizerElem.empty();
		if (this.isPlaying) {
			// Create 3 animated bars
			for (let i = 0; i < 3; i++) {
				new Elem({
					appendTo: this.visualizerElem,
					className: 'audio-bar',
					style: {
						animationDelay: `${i * 0.1}s`,
					},
				});
			}
		}
	}
}

// Global instance that manages audio playback
class AudioPlayerManager {
	constructor() {
		this.player = null;
	}

	async play(worldName, type, options = {}) {
		console.log('[AudioPlayer] play called', { worldName, type, options });

		// Remove existing player if present
		if (this.player) {
			this.player.elem.remove();
		}

		// Create new player and render to document body
		this.player = new AudioPlayer({ appendTo: document.body });
		console.log('[AudioPlayer] player created', this.player);

		// Start playback
		const result = await this.player.play(worldName, type, options);
		console.log('[AudioPlayer] play result', result);
		return result;
	}

	async hasAudio(worldName, type) {
		const fileName = worldName.replace(/:\s+/g, '_').replace(/\s+/g, '_');
		const path = `docs/briefings/audio/${fileName}_${type}.mp3`;
		try {
			const response = await fetch(path, { method: 'HEAD' });
			return response.ok;
		} catch {
			return false;
		}
	}

	stop() {
		if (this.player) {
			this.player.stop();
			this.player = null;
		}
	}
}

// Export singleton instance
const audioPlayer = new AudioPlayerManager();
export default audioPlayer;
