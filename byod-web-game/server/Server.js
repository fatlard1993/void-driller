import Log from 'log';
import GameSaveDatabase, { games } from './GameSaveDatabase';

export default class Server {
	constructor({ port, databasePath, verbosity, Game, router, logger }) {
		this.clients = {};

		// Create default logger if none provided
		this.logger =
			logger ||
			new Log({
				tag: 'byod-server',
				defaults: {
					verbosity: verbosity ?? (process.env.NODE_ENV === 'production' ? 1 : 3),
					color: true,
					silentTag: false,
					methodTag: true,
				},
			});

		if (verbosity !== undefined && this.logger.options) {
			this.logger.options.verbosity = verbosity;
			this.logger.info(`Logging verbosity set to level ${verbosity}`);
		}

		const server = this;

		// eslint-disable-next-line no-undef
		this.httpServer = Bun.serve({
			port,
			hostname: '0.0.0.0', // Bind to all interfaces for mobile access
			fetch: router(server),
			websocket: {
				open(socket) {
					const clientId = socket.data.clientId;
					server.clients[clientId] = socket;
					server.logger.info('WebSocket connection opened', {
						clientId,
						remoteAddress: socket.remoteAddress,
						totalConnections: Object.keys(server.clients).length,
					});
				},
				close(socket, code, reason) {
					const clientId = socket.data.clientId;
					delete server.clients[clientId];
					server.logger.info('WebSocket connection closed', {
						clientId,
						code,
						reason: reason?.toString(),
						totalConnections: Object.keys(server.clients).length,
					});
				},
				message(socket, message) {
					const clientId = socket.data.clientId;
					try {
						const parsed = typeof message === 'string' ? JSON.parse(message) : message;
						server.logger.debug('WebSocket message received', {
							clientId,
							type: parsed.type || 'unknown',
							size: message.length || 0,
						});
					} catch (parseError) {
						server.logger.warning('Invalid WebSocket message format', {
							clientId,
							error: parseError.message,
							messageSize: message.length || 0,
						});
					}
				},
			},
		});

		this.port = this.httpServer.port;
		this.url = this.httpServer.url;
		this.games = games;
		this.Game = Game;

		this.database = new GameSaveDatabase({
			filePath: databasePath,
			logger: this.logger,
			done: database => {
				Object.values(database.collections.games.read()).forEach(saveState => {
					new Game({ saveState });
				});
			},
		});

		this.logger.info(`Listening on ${this.httpServer.hostname}:${this.httpServer.port}`);

		// Start periodic health monitoring
		this.startHealthMonitoring();
	}

	startHealthMonitoring() {
		// Log system health every 5 minutes
		const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

		const logSystemHealth = () => {
			const memUsage = process.memoryUsage();
			const uptime = process.uptime();

			this.logger.info('System health check', {
				uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
				memory: {
					rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
					heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
					heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
				},
				connections: {
					websockets: Object.keys(this.clients).length,
					games: Object.keys(this.games).length,
				},
				players: Object.values(this.games).reduce((total, game) => total + game.players.size, 0),
			});
		};

		// Initial health log
		logSystemHealth();

		// Set up periodic health logging
		setInterval(logSystemHealth, HEALTH_CHECK_INTERVAL);
	}

	socketBroadcast(data) {
		let serializedData;
		try {
			serializedData = JSON.stringify(data);
		} catch (error) {
			if (error.message.includes('cyclic')) {
				this.logger.error('Cyclic structure detected in broadcast data:', error);
				this.logger.error('Data keys:', Object.keys(data));
				// Try to broadcast without the problematic data
				serializedData = JSON.stringify({ error: 'Cyclic structure in broadcast data' });
			} else {
				throw error;
			}
		}

		Object.values(this.clients).forEach(socket => {
			socket.send(serializedData);
		});
	}

	reloadClients() {
		Object.entries(this.clients).forEach(([clientId, socket]) => {
			this.logger.info(`[dev] Reloading ${clientId}`);

			socket.send('hotReload');
		});
	}
}
