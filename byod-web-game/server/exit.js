import { serverLog } from '../../utils/logger.js';

process.on('SIGINT', () => {
	serverLog.warn('Clean Exit - SIGINT received');

	process.exit(130);
});

process.on('uncaughtException', error => {
	serverLog.error('Uncaught Exception', { error: error.message, stack: error.stack });

	process.exit(99);
});
