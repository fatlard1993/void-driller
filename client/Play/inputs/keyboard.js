import gameContext from '../../shared/gameContext';
import ConsoleDialog from '../ConsoleDialog';

export const onKeyDown = () => {};

export const onKeyUp = event => {
	if (
		event.key === 'Escape' &&
		!gameContext.openDialog?.elem?.open &&
		!gameContext.openDialog?.elem?.getAnimations?.()?.length
	) {
		gameContext.openDialog = new ConsoleDialog();
	}
};
