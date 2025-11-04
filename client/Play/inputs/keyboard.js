import gameContext from '../../shared/gameContext';
import ConsoleDialog from '../ConsoleDialog';

let escapeUsedForClose = false;
let clearEscapeTimeout = null;

export const onKeyDown = event => {
	if (event.key === 'Escape') {
		// If ANY dialog is open (check both elem.open and existence), mark escape as used for closing
		if (gameContext.openDialog?.elem?.open || gameContext.openDialog) {
			escapeUsedForClose = true;

			// Clear any existing timeout
			if (clearEscapeTimeout) {
				clearTimeout(clearEscapeTimeout);
			}

			// Clear flag after dialog close animation completes
			clearEscapeTimeout = setTimeout(() => {
				escapeUsedForClose = false;
				clearEscapeTimeout = null;
			}, 600); // Increased to 600ms for safety
		}
	}
};

export const onKeyUp = event => {
	if (event.key === 'Escape') {
		// Don't open console if escape was used to close a dialog
		if (escapeUsedForClose) {
			return;
		}

		// No dialog open - open console
		if (!gameContext.openDialog?.elem?.open && !gameContext.openDialog?.elem?.getAnimations?.()?.length) {
			gameContext.openDialog = new ConsoleDialog();
		}
	}
};
