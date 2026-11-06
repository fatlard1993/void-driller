import gameContext from '../shared/gameContext';
import { post, del } from './request';

const apiContext = {
	get gameId() {
		return gameContext.gameId;
	},
	get playerId() {
		return gameContext.playerId;
	},
};

export const initiateTrade = async ({ targetPlayerId }, options) =>
	await post('/games/:gameId/:playerId/trade', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { targetPlayerId },
		...options,
	});

export const updateTradeOffer = async ({ tradeId, offer }, options) =>
	await post('/games/:gameId/:playerId/trade/:tradeId/offer', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, tradeId },
		body: { offer },
		...options,
	});

export const acceptTrade = async ({ tradeId }, options) =>
	await post('/games/:gameId/:playerId/trade/:tradeId/accept', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, tradeId },
		...options,
	});

export const cancelTrade = async ({ tradeId }, options) =>
	await del('/games/:gameId/:playerId/trade/:tradeId', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, tradeId },
		...options,
	});
