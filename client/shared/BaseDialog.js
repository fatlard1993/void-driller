import { Dialog } from 'vanilla-bean-components';
import gameContext from './gameContext';
import { InfoButton } from './InfoButton';

// (styled.Dialog`
// 	@media (max-width: 768px) {
// 		height: 90vh !important;
// 		width: 90vh !important;
// 	}
// `)

/**
 * Base dialog class that provides common functionality and styling for game dialogs
 */
export default class BaseDialog extends Dialog {
	constructor(options = {}) {
		// Default configuration for all game dialogs
		const defaultConfig = {
			style: {
				width: 'clamp(420px, 80vw, 1700px)',
				height: 'clamp(420px, 60vh, 1200px)',
			},
			buttons: ['Close'],
			onButtonPress: () => {
				this.handleClose();
			},
		};

		// Merge defaults with provided options
		const mergedConfig = {
			...defaultConfig,
			...options,
			style: {
				...defaultConfig.style,
				...options.style,
			},
		};

		super(mergedConfig);

		// Play dialog sound effect
		this.playDialogSound();
	}

	/**
	 * Play the standard dialog opening sound
	 */
	playDialogSound() {
		if (gameContext.sounds?.alert2) {
			gameContext.sounds.alert2.play({ volume: gameContext.volume.alerts });
		}
	}

	/**
	 * Handle dialog close action - override in subclasses for custom behavior
	 */
	handleClose() {
		// Close any open popovers when dialog closes
		InfoButton.closeAllPopovers();

		// Default close behavior - subclasses can override
		const player = gameContext.players.currentPlayer;
		if (player?.sprite) {
			player.sprite.move(player.position, 0, player.orientation);
		}
		this.close();
	}
}
