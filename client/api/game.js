import { GET, POST, DELETE } from 'vanilla-bean-components';

export const getGames = async options => await GET('/games', { id: 'games', ...options });

export const getGame = async (id, options) =>
	await GET('/games/:id', { id: ['games', id], urlParameters: { id }, ...options });

export const createGame = async options => await POST('/games', { invalidates: ['games'], ...options });

export const joinGame = async (id, options) =>
	await POST('/games/:id/join', { invalidates: ['games'], urlParameters: { id }, ...options });

export const exitGame = async ({ gameId, playerId }, options) =>
	await POST('/games/:gameId/:playerId/exit', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		...options,
	});

export const move = async ({ gameId, playerId, path }, options) =>
	await POST('/games/:gameId/:playerId/move', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { path },
		...options,
	});

export const spacecoSell = async ({ gameId, playerId }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/sell', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		...options,
	});

export const spacecoRefuel = async ({ gameId, playerId, amount }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/refuel', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { amount },
		...options,
	});

export const spacecoRepair = async ({ gameId, playerId, amount }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/repair', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { amount },
		...options,
	});

export const spacecoBuyItem = async ({ gameId, playerId, item }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/item', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { item },
		...options,
	});

export const spacecoBuyUpgrade = async ({ gameId, playerId, upgrade }, options) =>
	await POST('/games/:gameId/:playerId/spaceco/upgrade', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { upgrade },
		...options,
	});

export const useItem = async ({ gameId, playerId, item }, options) =>
	await POST('/games/:gameId/:playerId/useItem', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { item },
		...options,
	});

export const triggerEffect = async ({ gameId, playerId, position, effect }, options) =>
	await POST('/games/:gameId/:playerId/triggerEffect', {
		invalidates: ['games'],
		urlParameters: { gameId, playerId },
		body: { position, effect },
		...options,
	});

export const deleteGame = async (id, options) =>
	await DELETE('/games/:id', { invalidates: ['games'], urlParameters: { id }, ...options });
