import { POST } from 'vanilla-bean-components';

import gameContext from '../shared/gameContext';

const apiContext = {
	get gameId() {
		return gameContext.gameId;
	},
	get playerId() {
		return gameContext.playerId;
	},
};

export const playerMove = async ({ path }, options) =>
	await POST('/games/:gameId/:playerId/move', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { path },
		...options,
	});

export const spacecoSell = async options =>
	await POST('/games/:gameId/:playerId/spaceco/sell', {
		invalidates: ['games'],
		urlParameters: apiContext,
		...options,
	});

export const spacecoRefuel = async ({ amount } = {}, options) =>
	await POST('/games/:gameId/:playerId/spaceco/refuel', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { amount },
		...options,
	});

export const spacecoRepair = async ({ amount, type }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/repair', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { amount, type },
		...options,
	});

export const spacecoBuyItem = async ({ item }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/item', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { item },
		...options,
	});

export const spacecoSellItem = async ({ item, count = 1 }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/sellitem', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { item, count },
		...options,
	});

export const spacecoBuyUpgrade = async ({ upgrade, type }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/upgrade', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { upgrade, type },
		...options,
	});

export const spacecoBuyRescue = async options =>
	await POST('/games/:gameId/:playerId/spaceco/rescue', {
		invalidates: ['games'],
		urlParameters: apiContext,
		...options,
	});

export const spacecoBuyTransport = async ({ world }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/transport', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { world },
		...options,
	});

export const useItem = async ({ item }, options) =>
	await POST('/games/:gameId/:playerId/useItem', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { item },
		...options,
	});

export const repairPlayerPosition = async (playerId, options) =>
	await POST('/games/:gameId/:playerId/repair-position', {
		invalidates: ['games'],
		urlParameters: { ...apiContext, playerId },
		...options,
	});

export const fixPlayerMovement = async (options) =>
	await POST('/games/:gameId/:playerId/fix-movement', {
		invalidates: ['games'],
		urlParameters: apiContext,
		...options,
	});
