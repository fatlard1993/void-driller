import { Elem, styled, Button } from 'vanilla-bean-components';
import gameContext from './gameContext';
import bookendConfig from './bookendConfig.js';

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
			transform: scaleY(0.3);
			opacity: 0.5;
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

		// Skip backward 10s button
		this.skipBackBtn = new Button({
			icon: 'backward',
			appendTo: this.controlsElem,
			addClass: ['audio-button'],
			onPointerPress: () => this.skip(-10),
		});

		// Play/Pause button
		this.playPauseBtn = new Button({
			icon: 'play',
			appendTo: this.controlsElem,
			addClass: ['audio-button', 'play-pause'],
			onPointerPress: () => this.togglePlayPause(),
		});

		// Skip forward 10s button
		this.skipForwardBtn = new Button({
			icon: 'forward',
			appendTo: this.controlsElem,
			addClass: ['audio-button'],
			onPointerPress: () => this.skip(10),
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
		return `docs/briefings/audio/${fileName}_${type}.wav`;
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
	 * @param {boolean} options.useBookends - Use bookends for briefing->bulletin transition
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

		// If playing bulletin with bookends directly, use playWithBookends
		if (type === 'bulletin' && options.useBookends) {
			return await this.playWithBookends(worldName);
		}

		// If autoQueue and playing briefing, queue bulletin with bookends
		let delayBeforePlay = 0;
		if (options.autoQueue && type === 'briefing') {
			const hasBulletin = await this.hasAudio(worldName, 'bulletin');
			if (hasBulletin) {
				this.queuedType = 'bulletin';
				this.useBookends = options.useBookends || false;

			}
		}

		// Load audio as blob for better seeking support
		try {
			const response = await fetch(path);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);

			this.currentAudio = new Audio(blobUrl);
			this.audioBlobUrl = blobUrl; // Store for cleanup
		} catch (e) {
			console.error('[AudioPlayer] Error loading audio as blob:', e);
			// Fallback to direct URL
			this.currentAudio = new Audio(path);
		}

		this.currentType = type;
		this.currentWorldName = worldName;
		this.isPlaying = true;
		this.isPaused = false;

		// Set volume from gameContext
		this.currentAudio.volume = gameContext.volume.briefings || 0.5;

		// Setup event listeners
		this.currentAudio.addEventListener('ended', async () => {
			// If there's a queued audio, play it
			if (this.queuedType) {
				const nextType = this.queuedType;
				this.queuedType = null;

				// If using bookends, handle the transition
				if (this.useBookends && nextType === 'bulletin') {
					this.useBookends = false;
					await this.playWithBookends(worldName);
				} else {
					await this.play(worldName, nextType);
				}
			} else {
				this.stop();
			}
		});

		this.currentAudio.addEventListener('error', () => {
			this.queuedType = null;
			this.stop();
		});

		// Play audio (with optional delay)
		try {
			if (delayBeforePlay > 0) {
				await new Promise(resolve => setTimeout(resolve, delayBeforePlay));
			}
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
	 * Concatenate audio buffers into a single buffer
	 * @param {Array<{buffer: AudioBuffer, start?: number, end?: number}>} segments
	 * @returns {AudioBuffer} Combined audio buffer
	 */
	concatenateAudioBuffers(audioContext, segments) {
		// Calculate total length and determine max channels
		let totalLength = 0;
		const processedSegments = segments.map(({ buffer, start = 0, end = null }) => {
			const startSample = Math.floor((start / 1000) * buffer.sampleRate);
			const endSample = end ? Math.floor((end / 1000) * buffer.sampleRate) : buffer.length;
			const length = endSample - startSample;
			totalLength += length;
			return { buffer, startSample, length };
		});

		const numberOfChannels = Math.max(...segments.map(s => s.buffer.numberOfChannels));
		const sampleRate = segments[0].buffer.sampleRate;

		// Create combined buffer
		const combinedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

		// Copy all audio data into combined buffer
		let offset = 0;
		processedSegments.forEach(({ buffer, startSample, length }) => {
			for (let channel = 0; channel < numberOfChannels; channel++) {
				// If this buffer doesn't have this channel (mono in stereo), duplicate from channel 0
				const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
				const sourceData = buffer.getChannelData(sourceChannel);

				// Extract the segment we want
				const segmentData = sourceData.slice(startSample, startSample + length);

				// Copy to combined buffer
				combinedBuffer.copyToChannel(segmentData, channel, offset);
			}
			offset += length;
		});

		return combinedBuffer;
	}

	/**
	 * Convert AudioBuffer to WAV blob
	 * @param {AudioBuffer} buffer - Audio buffer to convert
	 * @returns {Blob} WAV blob
	 */
	audioBufferToWav(buffer) {
		const numberOfChannels = buffer.numberOfChannels;
		const sampleRate = buffer.sampleRate;
		const format = 1; // PCM
		const bitDepth = 16;

		const bytesPerSample = bitDepth / 8;
		const blockAlign = numberOfChannels * bytesPerSample;

		const data = [];
		for (let i = 0; i < buffer.length; i++) {
			for (let channel = 0; channel < numberOfChannels; channel++) {
				const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
				data.push(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
			}
		}

		const dataLength = data.length * bytesPerSample;
		const bufferLength = 44 + dataLength;
		const arrayBuffer = new ArrayBuffer(bufferLength);
		const view = new DataView(arrayBuffer);

		// WAV header
		const writeString = (offset, string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(0, 'RIFF');
		view.setUint32(4, 36 + dataLength, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true); // fmt chunk size
		view.setUint16(20, format, true);
		view.setUint16(22, numberOfChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * blockAlign, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, bitDepth, true);
		writeString(36, 'data');
		view.setUint32(40, dataLength, true);

		// Write audio data
		let offset = 44;
		for (let i = 0; i < data.length; i++) {
			view.setInt16(offset, data[i], true);
			offset += 2;
		}

		return new Blob([arrayBuffer], { type: 'audio/wav' });
	}

	/**
	 * Play bulletin with bookends - concatenates intro + bulletin + outro into one seekable file
	 * @param {string} worldName - The world name
	 */
	async playWithBookends(worldName) {
		const bookendPath = 'audio/music/spaceco_bulletin_bookends.wav';
		const bulletinPath = this.getAudioPath(worldName, 'bulletin');

		// Load both files
		const [bookendBlob, bulletinBlob] = await Promise.all([
			fetch(bookendPath).then(r => r.blob()),
			fetch(bulletinPath).then(r => r.blob())
		]);

		// Decode audio files using Web Audio API
		const audioContext = new (window.AudioContext || window.webkitAudioContext)();

		const [bookendBuffer, bulletinBuffer] = await Promise.all([
			bookendBlob.arrayBuffer().then(ab => audioContext.decodeAudioData(ab)),
			bulletinBlob.arrayBuffer().then(ab => audioContext.decodeAudioData(ab))
		]);

		// Get timing from config
		const { firstHalfEnd, secondHalfStart, secondHalfEnd } = bookendConfig;

		// Concatenate: bookend intro (0-14s) + bulletin (full) + bookend outro (13s-end)
		const combinedBuffer = this.concatenateAudioBuffers(audioContext, [
			{ buffer: bookendBuffer, start: 0, end: firstHalfEnd },
			{ buffer: bulletinBuffer, start: 0, end: null },
			{ buffer: bookendBuffer, start: secondHalfStart, end: secondHalfEnd }
		]);

		// Convert to WAV blob
		const combinedBlob = this.audioBufferToWav(combinedBuffer);
		const combinedBlobUrl = URL.createObjectURL(combinedBlob);

		audioContext.close();

		// Play the combined audio
		this.currentAudio = new Audio(combinedBlobUrl);
		this.audioBlobUrl = combinedBlobUrl;
		this.currentType = 'bulletin';
		this.currentWorldName = worldName;
		this.isPlaying = true;
		this.isPaused = false;
		this.currentAudio.volume = gameContext.volume.briefings || 0.5;

		// Setup ended listener
		this.currentAudio.addEventListener('ended', () => {
			this.stop();
		});

		// Start playback
		await this.currentAudio.play();
		this.updateUI();
	}

	/**
	 * Fade audio to target volume
	 * @param {HTMLAudioElement} audio - Audio element
	 * @param {number} targetVolume - Target volume (0-1)
	 * @param {number} duration - Fade duration in ms
	 */
	fadeAudio(audio, targetVolume, duration) {
		const startVolume = audio.volume;
		const volumeChange = targetVolume - startVolume;
		const steps = 50; // 50 steps for smooth fade
		const stepDuration = duration / steps;
		let currentStep = 0;

		const fadeInterval = setInterval(() => {
			currentStep++;
			audio.volume = startVolume + (volumeChange * currentStep / steps);

			if (currentStep >= steps) {
				clearInterval(fadeInterval);
				audio.volume = targetVolume;
			}
		}, stepDuration);
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
	 * Skip forward or backward by seconds
	 * @param {number} seconds - Number of seconds to skip (negative for backward)
	 */
	skip(seconds) {
		if (!this.currentAudio) return;

		const audioElement = this.currentAudio;

		// Wait for audio to be fully loaded (readyState 4 = HAVE_ENOUGH_DATA)
		if (audioElement.readyState < 4) {
			console.warn('[AudioPlayer] Audio not fully loaded yet, cannot skip');
			return;
		}

		const currentTime = audioElement.currentTime || 0;
		const duration = audioElement.duration || 0;
		const newTime = currentTime + seconds;

		// Clamp to valid range
		const clampedTime = Math.max(0, Math.min(newTime, duration));

		console.log('[AudioPlayer] Skip from', currentTime, 'to', clampedTime, 'readyState:', audioElement.readyState);

		// Simply set the time - it should work if the audio is fully loaded
		try {
			audioElement.currentTime = clampedTime;
			console.log('[AudioPlayer] After setting, currentTime is:', audioElement.currentTime);
		} catch (e) {
			console.error('[AudioPlayer] Error setting currentTime:', e);
		}
	}

	/**
	 * Stop playback and hide UI
	 */
	stop() {
		if (this.currentAudio) {
			// Remove event listeners before clearing audio reference
			if (this.timeupdateHandler) {
				this.currentAudio.removeEventListener('timeupdate', this.timeupdateHandler);
				this.timeupdateHandler = null;
			}

			this.currentAudio.pause();
			this.currentAudio.currentTime = 0;
			this.currentAudio = null;
		}

		// Clean up blob URL if we created one
		if (this.audioBlobUrl) {
			URL.revokeObjectURL(this.audioBlobUrl);
			this.audioBlobUrl = null;
		}

		this.isPlaying = false;
		this.isPaused = false;
		this.currentType = null;
		this.currentWorldName = null;
		this.outroStarted = false;

		this.elem.remove();
	}

	/**
	 * Update the UI to reflect current state
	 */
	updateUI() {
		if (!this.titleElem) return;

		// Update title
		this.titleElem.content = `${this.currentType === 'briefing' ? '📡 Briefing' : '📋 Bulletin'} Audio`;

		// Update play/pause button icon by setting the icon property
		this.playPauseBtn.options.icon = this.isPlaying ? 'pause' : 'play';

		// Update visualizer - always show bars, but only animate when playing
		this.visualizerElem.empty();
		for (let i = 0; i < 3; i++) {
			new Elem({
				appendTo: this.visualizerElem,
				className: 'audio-bar',
				style: {
					animationDelay: `${i * 0.1}s`,
					animationPlayState: this.isPlaying ? 'running' : 'paused',
				},
			});
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
		const path = `docs/briefings/audio/${fileName}_${type}.wav`;
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
