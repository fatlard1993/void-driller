import { GET, POST, DELETE } from 'vanilla-bean-components';

import gameContext from '../gameContext';

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

export const deleteGame = async (id, options) =>
	await DELETE('/games/:id', { invalidates: ['games'], urlParameters: { id }, ...options });
