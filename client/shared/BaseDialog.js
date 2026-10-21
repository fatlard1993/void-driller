import { Dialog, styled } from '@vanilla-bean/components';
import gameContext from './gameContext';
import { InfoButton } from './InfoButton';

/**
 * Base dialog class that provides common functionality and styling for game dialogs
 */
const StyledDialog = styled(Dialog)`
	@media (max-width: 480px) {
		box-sizing: border-box;
		margin: 0;
		width: 100% !important;
		max-width: 100%;
		height: 100% !important;
		max-height: 100%;

		&:after {
			background: none;
		}

		& .content {
			padding: 0 3px;

			&:before {
				content: none;
			}
		}

		& .menuBody {
			padding: 3px 6px;
		}
	}
`;

/**
 * Gives game input back once a dialog closes, however it closes. openDialog stays set a moment longer, so the press that
 * closed the dialog doesn't reach the game behind it.
 * @param {object} dialog - A dialog assigned to gameContext.openDialog
 * @returns {object} The dialog
 */
export const releaseInputOnClose = dialog => {
	dialog.on({
		targetEvent: 'close',
		id: 'releaseInput',
		callback: () =>
			setTimeout(() => {
				if (gameContext.openDialog === dialog) gameContext.openDialog = null;
			}, 100),
	});

	return dialog;
};

export default class BaseDialog extends StyledDialog {
	constructor(options = {}) {
		// Default configuration for all game dialogs
		const defaultConfig = {
			style: {
				width: 'clamp(420px, 90vw, 1700px)',
				height: 'clamp(420px, 72vh, 1200px)',
			},
			'data-augmented-ui': 'tl-clip tr-2-clip-x br-clip bl-2-clip-y border',
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

		// Prevent dialog clicks from propagating to Phaser canvas
		// Use the same pattern as Achievement
		this.options.onPointerDown = event => {
			if (event) {
				event.stopPropagation();
				// Don't preventDefault - we need buttons to work
			}
		};

		releaseInputOnClose(this);

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
