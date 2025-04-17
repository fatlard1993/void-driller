#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import Argi from 'argi';

import Game, { games } from './Game';
import database from './database';
import server, { spawnBuild } from './server';

import './exit';
import gamesDatabase from './database/games';

const { options } = new Argi({
	options: {
		database: {
			type: 'string',
			alias: 'd',
			defaultValue: path.join(os.homedir(), '.phaserload.json'),
			description: 'Database json file to use',
		},
		port: {
			type: 'number',
			alias: 'p',
			defaultValue: 1040,
		},
	},
});

console.log('Options', options);

await database.init({ persistent: options.persistent, path: options.database });

Object.values(gamesDatabase.read()).forEach(saveState => {
	games[saveState.id] = new Game({ saveState });
});

await server.init({ port: options.port });

if (process.env.NODE_ENV === 'development') {
	try {
		for await (const line of console) {
			if ({ stop: 1, close: 1, exit: 1 }[line]) process.kill(process.pid, 'SIGTERM');
			else if (line === 'b') {
				console.log('>> Building...');
				spawnBuild();
			}
		}
	} catch (error) {
		console.error('Build Error', error);
	}
}
