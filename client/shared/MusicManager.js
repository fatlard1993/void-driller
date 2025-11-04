import gameContext from './gameContext.js';

/**
 * MusicManager - Handles level music with intro/loop/outro sections
 *
 * Features:
 * - Intro/Outro sections that play once
 * - Multiple composeable loop sections that can be chained and repeated
 * - Smooth transitions between sections
 * - Transport transitions with outro + transition music
 * - Volume control tied to gameContext.volume.music
 */
export default class MusicManager {
	constructor(scene) {
		this.scene = scene;
		this.currentTrack = null;
		this.currentSound = null;
		this.isPlaying = false;
		this.currentSection = null; // 'intro', 'loop', 'outro'
		this.loopIndex = 0; // Which loop section we're in
		this.updateTimer = null;
		this.queuedOutro = false; // Flag for when outro is queued
	}

	/**
	 * Start playing a level's music
	 * @param {string} levelName - e.g., 'L1_Training_Shallows'
	 * @param {object} config - Music timing configuration
	 */
	async play(levelName, config) {
		console.log('[MusicManager] play() called:', levelName, config);

		// Stop any currently playing music
		this.stop();

		this.currentTrack = levelName;
		const soundKey = `music/${levelName}`;

		console.log('[MusicManager] Looking for sound key:', soundKey);

		// Load music on-demand if needed
		try {
			await this.scene.loadMusicIfNeeded(soundKey);
		} catch (error) {
			console.error('[MusicManager] Failed to load music:', error);
			return;
		}

		// Check if sound exists
		if (!this.scene.sound.get(soundKey)) {
			console.warn(`[MusicManager] Music track not found: ${soundKey}`);
			console.log('[MusicManager] Available sounds:', Object.keys(gameContext.sounds));
			return;
		}

		this.config = config;
		this.currentSound = this.scene.sound.add(soundKey);
		this.isPlaying = true;
		this.queuedOutro = false;

		console.log('[MusicManager] Starting intro, config:', this.config.intro);

		// Start with intro
		this._playIntro();
	}

	/**
	 * Play the intro section
	 */
	_playIntro() {
		if (!this.config.intro) {
			// No intro, go straight to loop
			this._playLoop();
			return;
		}

		this.currentSection = 'intro';
		const { start, end } = this.config.intro;

		this.currentSound.play({
			volume: gameContext.volume.music,
			seek: start / 1000, // Convert ms to seconds
		});

		// If end is undefined/null, play until audio ends naturally
		if (end === null || end === undefined) {
			this.currentSound.once('complete', () => {
				if (this.queuedOutro) {
					this._playOutro();
				} else {
					this._playLoop();
				}
			});
		} else {
			// Schedule loop to start when intro ends
			const introDuration = end - start;
			this.updateTimer = this.scene.time.delayedCall(introDuration, () => {
				if (this.queuedOutro) {
					this._playOutro();
				} else {
					this._playLoop();
				}
			});
		}
	}

	/**
	 * Play loop sections (composeable, repeating)
	 */
	_playLoop() {
		if (!this.config.loops || this.config.loops.length === 0) {
			console.warn('No loop sections defined');
			return;
		}

		this.currentSection = 'loop';

		// Start with first loop section
		this.loopIndex = 0;
		this._playCurrentLoopSection();
	}

	/**
	 * Play the current loop section
	 */
	_playCurrentLoopSection() {
		const loopSection = this.config.loops[this.loopIndex];
		const { start, end } = loopSection;

		// Stop current playback and seek to loop start
		if (this.currentSound.isPlaying) {
			this.currentSound.stop();
		}

		this.currentSound.play({
			volume: gameContext.volume.music,
			seek: start / 1000,
		});

		// If end is undefined/null, play until audio ends naturally
		if (end === null || end === undefined) {
			this.currentSound.once('complete', () => {
				if (this.queuedOutro) {
					this._playOutro();
				} else {
					this._advanceLoop();
				}
			});
		} else {
			// Schedule next section when this one ends
			const loopDuration = end - start;
			this.updateTimer = this.scene.time.delayedCall(loopDuration, () => {
				if (this.queuedOutro) {
					this._playOutro();
				} else {
					this._advanceLoop();
				}
			});
		}
	}

	/**
	 * Advance to next loop section or wrap around
	 */
	_advanceLoop() {
		this.loopIndex = (this.loopIndex + 1) % this.config.loops.length;
		this._playCurrentLoopSection();
	}

	/**
	 * Queue the outro to play after current section
	 */
	queueOutro() {
		this.queuedOutro = true;
	}

	/**
	 * Play the outro section
	 */
	_playOutro() {
		console.log('[MusicManager] _playOutro called', {
			hasOutro: !!this.config?.outro,
			outroConfig: this.config?.outro
		});

		if (!this.config.outro) {
			console.log('[MusicManager] No outro config, stopping');
			this.stop();
			return;
		}

		this.currentSection = 'outro';
		const { start, end } = this.config.outro;

		console.log('[MusicManager] Playing outro section', { start, end });

		if (this.currentSound.isPlaying) {
			console.log('[MusicManager] Stopping current sound before outro');
			this.currentSound.stop();
		}

		this.currentSound.play({
			volume: gameContext.volume.music,
			seek: start / 1000,
		});

		console.log('[MusicManager] Outro started playing');

		// If end is undefined/null, play until audio ends naturally
		if (end === null || end === undefined) {
			this.currentSound.once('complete', () => {
				this.stop();
			});
		} else {
			// Schedule cleanup when outro ends
			const outroDuration = end - start;
			this.updateTimer = this.scene.time.delayedCall(outroDuration, () => {
				this.stop();
			});
		}
	}

	/**
	 * Stop all music playback
	 */
	stop() {
		if (this.updateTimer) {
			this.updateTimer.destroy();
			this.updateTimer = null;
		}

		if (this.currentSound) {
			this.currentSound.stop();
			this.currentSound = null;
		}

		this.isPlaying = false;
		this.currentSection = null;
		this.currentTrack = null;
		this.loopIndex = 0;
		this.queuedOutro = false;
	}

	/**
	 * Update volume (call when gameContext.volume.music changes)
	 */
	updateVolume() {
		if (this.currentSound && this.currentSound.isPlaying) {
			this.currentSound.setVolume(gameContext.volume.music);
		}
	}

	/**
	 * Fade out current music over duration (ms)
	 */
	fadeOut(duration = 1000) {
		if (!this.currentSound || !this.currentSound.isPlaying) return;

		this.scene.tweens.add({
			targets: this.currentSound,
			volume: 0,
			duration: duration,
			onComplete: () => {
				this.stop();
			}
		});
	}

	/**
	 * Fade in current music over duration (ms)
	 */
	fadeIn(duration = 1000, targetVolume = null) {
		if (!this.currentSound || !this.currentSound.isPlaying) return;

		const target = targetVolume !== null ? targetVolume : gameContext.volume.music;

		this.currentSound.setVolume(0);
		this.scene.tweens.add({
			targets: this.currentSound,
			volume: target,
			duration: duration
		});
	}

	/**
	 * Handle transport transition
	 * - Queue outro for current music
	 * - Play transport transition sound
	 * - Wait for both to finish before callback
	 */
	async playTransportTransition(callback) {
		console.log('[MusicManager] playTransportTransition called', {
			isPlaying: this.isPlaying,
			currentSection: this.currentSection,
			hasOutro: !!this.config?.outro
		});

		// Load transition music if needed
		try {
			await this.scene.loadMusicIfNeeded('music/transport_transition');
		} catch (error) {
			console.error('[MusicManager] Failed to load transition music:', error);
			// Continue anyway - callback still needs to be called
		}

		// Track which sounds have completed
		let outroCompleted = false;
		let transitionCompleted = false;
		let callbackCalled = false;

		const checkBothComplete = () => {
			console.log('[MusicManager] Checking completion', { outroCompleted, transitionCompleted, callbackCalled });
			if (outroCompleted && transitionCompleted && !callbackCalled) {
				console.log('[MusicManager] Both sounds completed, calling callback');
				callbackCalled = true;
				callback();
			}
		};

		// Immediately stop current music and play outro (don't just queue it)
		if (this.isPlaying && this.config?.outro) {
			console.log('[MusicManager] Stopping current loop and playing level outro');

			// Cancel any pending timers
			if (this.updateTimer) {
				this.updateTimer.destroy();
				this.updateTimer = null;
			}

			// Force stop the current sound immediately
			if (this.currentSound && this.currentSound.isPlaying) {
				console.log('[MusicManager] Force stopping current sound');
				this.currentSound.stop();
			}

			// Store original stop function and replace with completion tracker
			const originalStop = this.stop.bind(this);
			this.stop = () => {
				console.log('[MusicManager] Outro completed');
				outroCompleted = true;
				originalStop();
				checkBothComplete();
				// Restore original stop
				this.stop = originalStop;
			};

			// Play the outro immediately (will call our wrapped stop when done)
			this._playOutro();
		} else {
			// No outro, just stop current music
			console.log('[MusicManager] No outro, stopping music');
			this.stop();
			outroCompleted = true; // No outro to wait for
		}

		// Play transport transition sound (overlapping with outro if it exists)
		const transitionSound = this.scene.sound.add('music/transport_transition');

		// Use event listener to ensure we wait for the actual sound to complete
		transitionSound.once('complete', () => {
			console.log('[MusicManager] Transport transition sound completed');
			transitionCompleted = true;
			checkBothComplete();
		});

		transitionSound.play({
			volume: gameContext.volume.music
		});

		console.log('[MusicManager] Transport transition sound started, duration:', transitionSound.duration);

		// Call callback 5 seconds before transition sound ends to start fade-in early
		if (transitionSound.duration > 5) {
			const earlyCallbackTime = (transitionSound.duration - 5) * 1000; // Convert to ms
			setTimeout(() => {
				console.log('[MusicManager] Early callback - starting fade-in 5s before music ends');
				if (callback && !callbackCalled) {
					callbackCalled = true;
					callback();
				}
			}, earlyCallbackTime);
		}
	}
}
