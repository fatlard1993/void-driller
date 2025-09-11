import { POST, DELETE } from 'vanilla-bean-components';
import gameContext from '../shared/gameContext';

const apiContext = {
	get gameId() {
		return gameContext.gameId;
	},
	get playerId() {
		return gameContext.playerId;
	},
};

export const initiateTrade = async ({ targetPlayerId, offer, request }, options) =>
	await POST('/games/:gameId/:playerId/trade', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { targetPlayerId, offer, request },
		...options,
	});

export const respondToTrade = async ({ tradeId, accept }, options) =>
	await POST('/games/:gameId/:playerId/trade/:tradeId/respond', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, tradeId },
		body: { accept },
		...options,
	});

export const cancelTrade = async ({ tradeId }, options) =>
	await DELETE('/games/:gameId/:playerId/trade/:tradeId', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, tradeId },
		...options,
	});
