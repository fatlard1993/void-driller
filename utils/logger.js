import Log from 'log';

const loggerDefaults = {
	verbosity: process.env.NODE_ENV === 'production' ? 1 : 3,
	color: true,
	silentTag: false,
	methodTag: true,
	colorMap: {
		server: '\u001B[32m', // green
		client: '\u001B[36m', // cyan
		game: '\u001B[35m', // magenta
		socket: '\u001B[33m', // yellow
		database: '\u001B[34m', // blue
		player: '\u001B[37m', // white
		world: '\u001B[90m', // bright black
		trade: '\u001B[92m', // bright green
		spaceco: '\u001B[96m', // bright cyan
	},
};

export const serverLog = new Log({ tag: 'server', defaults: loggerDefaults });
export const clientLog = new Log({ tag: 'client', defaults: loggerDefaults });
export const gameLog = new Log({ tag: 'game', defaults: loggerDefaults });
export const socketLog = new Log({ tag: 'socket', defaults: loggerDefaults });
export const databaseLog = new Log({ tag: 'database', defaults: loggerDefaults });
export const playerLog = new Log({ tag: 'player', defaults: loggerDefaults });
export const worldLog = new Log({ tag: 'world', defaults: loggerDefaults });
export const tradeLog = new Log({ tag: 'trade', defaults: loggerDefaults });
export const spacecoLog = new Log({ tag: 'spaceco', defaults: loggerDefaults });

export const log = new Log({ tag: 'void-driller', defaults: loggerDefaults });

export const setVerbosity = level => {
	loggerDefaults.verbosity = level;

	const loggers = [
		serverLog,
		clientLog,
		gameLog,
		socketLog,
		databaseLog,
		playerLog,
		worldLog,
		tradeLog,
		spacecoLog,
		log,
	];
	loggers.forEach(logger => {
		if (logger && logger.options) {
			logger.options.verbosity = level;
		}
	});
};

export { Log };
export default log;
