/* eslint-disable import/no-unresolved */
// TODO: figure out why eslint is complaining about not finding these
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import Log from 'log';

export const games = {};

export default class GameSaveDatabase extends Low {
	constructor(options) {
		const { filePath, logger } = options;

		super(new JSONFile(filePath), { games: {} });

		this.options = options;
		this.collections = {};

		// Create default logger if none provided
		this.logger =
			logger ||
			new Log({
				tag: 'byod-database',
				defaults: {
					verbosity: process.env.NODE_ENV === 'production' ? 1 : 3,
					color: true,
					silentTag: false,
					methodTag: true,
				},
			});

		this.logger.info(`Database connected to ${filePath}`);

		this.init();
	}

	async init() {
		const startTime = performance.now();
		try {
			this.logger.info('Database initialization started', { filePath: this.options.filePath });
			await this.read();

			const collections = Object.keys(this.data);
			this.logger.info('Database loaded', {
				collections: collections.length,
				collectionNames: collections,
			});

			const results = await Promise.allSettled(collections.map(key => this.addCollection(key)));
			const failed = results.filter(r => r.status === 'rejected').length;

			if (failed > 0) {
				this.logger.warning('Some collections failed to initialize', { failed, total: collections.length });
			}

			const duration = performance.now() - startTime;
			this.logger.info('Database initialization completed', {
				duration: `${duration.toFixed(2)}ms`,
				collectionsLoaded: collections.length - failed,
			});

			if (this.options.done) this.options.done(this);
		} catch (error) {
			this.logger.error('Database initialization failed', {
				error: error.message,
				stack: error.stack,
				filePath: this.options.filePath,
			});
			throw error;
		}
	}

	async addCollection(key) {
		await this.read();

		if (!this.data[key]) this.data[key] = {};

		this.logger.debug('db.addCollection', key, this.data);

		const db = this;

		this.collections[key] = {
			create(data) {
				const startTime = performance.now();
				try {
					db.logger.debug('Database create operation', { collection: key, id: data.id });

					db.data[key][data.id] = data;
					db.write();

					const duration = performance.now() - startTime;
					db.logger.info('Database record created', {
						collection: key,
						id: data.id,
						duration: `${duration.toFixed(2)}ms`,
					});

					return data;
				} catch (error) {
					db.logger.error('Database create failed', {
						collection: key,
						id: data.id,
						error: error.message,
					});
					throw error;
				}
			},
			read({ id } = {}) {
				try {
					const result = id ? db.data[key][id] || false : db.data[key];

					if (id) {
						db.logger.debug('Database read operation', {
							collection: key,
							id,
							found: !!result,
						});
					}

					return result;
				} catch (error) {
					db.logger.error('Database read failed', {
						collection: key,
						id,
						error: error.message,
					});
					throw error;
				}
			},
			update({ id, update }) {
				const startTime = performance.now();
				try {
					if (!db.data[key][id]) {
						db.logger.warning('Database update failed - record not found', { collection: key, id });
						return false;
					}

					db.logger.debug('Database update operation', { collection: key, id, fields: Object.keys(update) });

					const updated = { ...db.data[key][id], ...update };
					db.data[key][id] = updated;
					db.write();

					const duration = performance.now() - startTime;
					db.logger.info('Database record updated', {
						collection: key,
						id,
						fields: Object.keys(update),
						duration: `${duration.toFixed(2)}ms`,
					});

					return updated;
				} catch (error) {
					db.logger.error('Database update failed', {
						collection: key,
						id,
						error: error.message,
					});
					throw error;
				}
			},
			delete({ id }) {
				const startTime = performance.now();
				try {
					if (!db.data[key][id]) {
						db.logger.warning('Database delete failed - record not found', { collection: key, id });
						return false;
					}

					db.logger.debug('Database delete operation', { collection: key, id });

					delete db.data[key][id];
					db.write();

					const duration = performance.now() - startTime;
					db.logger.info('Database record deleted', {
						collection: key,
						id,
						duration: `${duration.toFixed(2)}ms`,
					});

					return id;
				} catch (error) {
					db.logger.error('Database delete failed', {
						collection: key,
						id,
						error: error.message,
					});
					throw error;
				}
			},
			set({ id, data }) {
				const startTime = performance.now();
				try {
					if (!db.data[key][id]) {
						db.logger.warning('Database set failed - record not found', { collection: key, id });
						return false;
					}

					db.logger.debug('Database set operation', { collection: key, id });

					db.data[key][id] = data;
					db.write();

					const duration = performance.now() - startTime;
					db.logger.info('Database record set', {
						collection: key,
						id,
						duration: `${duration.toFixed(2)}ms`,
					});

					return data;
				} catch (error) {
					db.logger.error('Database set failed', {
						collection: key,
						id,
						error: error.message,
					});
					throw error;
				}
			},
		};

		await this.write();
	}
}
