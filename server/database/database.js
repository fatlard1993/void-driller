/* eslint-disable import/no-unresolved */
// TODO: figure out why eslint is complaining about not finding these
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const database = {
	default: {
		games: {},
	},
	async init({ path }) {
		database.db = new Low(new JSONFile(path), database.default);

		await database.db.read();

		database.db.data = Object.assign(database.default, database.db.data || {});

		await database.db.write();
	},
};

export default database;
