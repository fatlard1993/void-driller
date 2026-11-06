#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import Argi from 'argi-cli';

import { handleExit } from '@vanilla-bean/components/app';
import { Server } from '@fatlard1993/web-game-framework';
import { serverLog, setVerbosity } from '../utils/logger.js';

import { handleDevCommand } from './devConsole.js';
import Game from './Game';
import router from './router';

// bun --hot evaluates this module again on every change; the server it replaces lands its saves and goes quiet first,
// so the new one reads a complete database and no stale instance writes over it later. Its sockets stay open through
// the reload, so the new server inherits them: its own open handler never runs for a connection already made.
const live = (globalThis[Symbol.for('void-driller/server')] ??= {});

const retire = async server => {
	Object.values(server.games).forEach(game => game.retire());
	await server.database?.write();
};

if (live.server) await retire(live.server);

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

const server = new Server({
	port: options.port,
	database: options.database,
	verbosity: options.verbosity,
	Game,
	router,
	logger: serverLog,
	devConsole: handleDevCommand,
});

if (live.server) Object.assign(server.clients, live.server.clients);
live.server = server;

await server.ready;

// A stop writes every game's pending save before the process ends
handleExit({ flush: () => retire(server) });

serverLog.info('Server started', {
	url: server.url.href,
	database: options.database,
	verbosity: options.verbosity,
	nodeEnv: process.env.NODE_ENV,
});

export default server;
