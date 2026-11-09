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

export const spacecoBuyRescue = async options =>
	await post('/games/:gameId/:playerId/spaceco/rescue', {
		invalidates: ['games'],
		urlParameters: apiContext,
		...options,
	});

export const useItem = async ({ item }, options) =>
	await post('/games/:gameId/:playerId/useItem', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { item },
		...options,
	});

export const repairPlayerPosition = async (playerId, options) =>
	await post('/games/:gameId/:playerId/repair-position', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, playerId },
		...options,
	});

export const disarmBomb = async ({ x, y }, options) =>
	await post('/games/:gameId/:playerId/disarm-bomb', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { x, y },
		...options,
	});

export const deactivateTeleporter = async ({ x, y }, options) =>
	await post('/games/:gameId/:playerId/deactivate-teleporter', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { x, y },
		...options,
	});
