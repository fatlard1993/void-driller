import { Dialog, styled } from '@vanilla-bean/components';
import { DialogTabs } from './DialogTabs';
import { frameAttributes, frameCorner, frameDialogStyles } from './frame';
import gameContext from './gameContext';

/**
 * Base dialog class that provides common functionality and styling for game dialogs
 */
const StyledDialog = styled(Dialog)`
	${frameDialogStyles()}

	/* The content's padding, named so whatever bleeds to its edges can follow it; clear of the bottom left notch */
	--content-pad-block: ${({ space }) => space.md};
	--content-pad-inline: var(--frame-inset);

	& .content {
		padding: var(--content-pad-block) var(--content-pad-inline);
	}

	@media ${({ media }) => media.phone} {
		--frame-corner: ${frameCorner.small};
		--content-pad-block: 0px;

		box-sizing: border-box;
		margin: 0;
		width: 100% !important;
		max-width: 100%;
		height: 100% !important;
		max-height: 100%;

		& .menuBody {
			padding: ${({ space }) => space.xs} ${({ space }) => space.sm};
		}
	}
`;

/** A yes-or-no question in the game's frame: `ConfirmDialog.confirm({ ...frameAttributes, header, confirmLabel })` */
export const ConfirmDialog = styled(Dialog)`
	${frameDialogStyles(frameCorner.small)}
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
			// Viewers and tabbed panes: they need the width
			size: 'large',
			...frameAttributes,
			buttons: ['Close'],
			onButtonPress: () => {
				this.handleClose();
			},
		};

		// Merge defaults with provided options
		const mergedConfig = { ...defaultConfig, ...options };

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
	 * Shows a view as its tab in the dialog's one row, building the row the first time (or once the body was redrawn
	 * under it), then builds the view through its render_ method in this._menuBody
	 * @param {string} view - The view, which is its tab's id
	 * @param {Array<{ id: string, label: string, disabled?: boolean }>} tabs - The dialog's tabs as they stand now
	 */
	showTab(view, tabs) {
		if (this._tabs && this._body.elem.contains(this._tabs.row.elem)) this._tabs.update(tabs);
		else {
			this._body.empty();
			this._tabs = new DialogTabs({
				appendTo: this._body,
				tabs,
				onChange: id => {
					this.options.view = id;
				},
			});
		}

		this._menuBody = this._tabs.show(view);
		this[`render_${view}`]();
	}

	/**
	 * Handle dialog close action - override in subclasses for custom behavior
	 */
	handleClose() {
		// Default close behavior - subclasses can override
		const player = gameContext.players.currentPlayer;
		if (player?.sprite) {
			player.sprite.move(player.position, 0, player.orientation);
		}
		this.close();
	}
}
