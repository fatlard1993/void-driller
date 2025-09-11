#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import Argi from 'argi';

import Server from '../byod-web-game/server/Server';
import { serverLog, setVerbosity } from '../utils/logger.js';

import Game from './Game';
import router from './router';

const { options } = new Argi({
	options: {
		database: {
			type: 'string',
			alias: 'd',
			defaultValue: path.join(os.homedir(), '.void-driller.json'),
			description: 'Database json file to use',
		},
		port: {
			type: 'number',
			alias: 'p',
			defaultValue: 1040,
		},
		verbosity: {
			type: 'number',
			alias: 'v',
			defaultValue: process.env.NODE_ENV === 'production' ? 1 : 3,
			description: 'Logging verbosity level (0=all, 1=production, 2=development, 3=debug)',
		},
	},
});

// Set logger verbosity based on options
setVerbosity(options.verbosity);

serverLog.info('Server starting', { 
	port: options.port, 
	database: options.database, 
	verbosity: options.verbosity,
	nodeEnv: process.env.NODE_ENV 
});

export default new Server({ 
	port: options.port, 
	databasePath: options.database, 
	verbosity: options.verbosity, 
	Game, 
	router,
	logger: serverLog 
});
