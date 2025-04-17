import database from './index.js';

const games = {
	get data() {
		return database.db.data.games;
	},
	create(game) {
		console.log('createGame', game.id);

		games.data[game.id] = game;

		database.db.write();

		return game;
	},
	read({ id } = {}) {
		if (id) return games.data[id] || false;

		return games.data;
	},
	update({ id, update }) {
		if (!games.data[id]) return false;

		const updatedGame = { ...games.data[id], ...update };

		games.data[id] = updatedGame;

		database.db.write();

		return updatedGame;
	},
	set({ id, game }) {
		console.log('saveGame', id);

		if (!games.data[id]) return false;

		games.data[id] = game;

		database.db.write();

		return game;
	},
	delete({ id }) {
		if (!games.data[id]) return false;

		delete games.data[id];

		database.db.write();

		return id;
	},
};

export default games;
