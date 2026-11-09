import gameContext from '../shared/gameContext';
import { post } from './request';

const apiContext = {
	get gameId() {
		return gameContext.gameId;
	},
	get playerId() {
		return gameContext.playerId;
	},
};

export const repairPlayerPosition = async (playerId, options) =>
	await post('/games/:gameId/:playerId/repair-position', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, playerId },
		...options,
	});
