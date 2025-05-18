import { GET, POST, DELETE } from 'vanilla-bean-components';

import gameContext from '../shared/gameContext';

const apiContext = {
	get gameId() {
		return gameContext.gameId;
	},
	get playerId() {
		return gameContext.playerId;
	},
};

export const getGames = async options => await GET('/games', { id: 'games', ...options });

export const getGame = async (id, options) =>
	await GET('/games/:id', { id: ['games', id], urlParameters: { id }, ...options });

export const createGame = async options => await POST('/games', { invalidates: ['games'], ...options });

export const joinGame = async (id, options) =>
	await POST('/games/:id/join', { invalidates: ['games'], urlParameters: { id }, ...options });

export const exitGame = async options =>
	await POST('/games/:gameId/:playerId/exit', {
		invalidates: ['games'],
		urlParameters: apiContext,
		...options,
	});

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

export const spacecoBuyUpgrade = async ({ upgrade, type }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/upgrade', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { upgrade, type },
		...options,
	});

export const spacecoBuyTransport = async options =>
	await POST('/games/:gameId/:playerId/spaceco/transport', {
		invalidates: ['games'],
		urlParameters: apiContext,
		...options,
	});

export const useItem = async ({ item }, options) =>
	await POST('/games/:gameId/:playerId/useItem', {
		invalidates: ['games'],
		urlParameters: apiContext,
		body: { item },
		...options,
	});

export const deleteGame = async (id, options) =>
	await DELETE('/games/:id', { invalidates: ['games'], urlParameters: { id }, ...options });
