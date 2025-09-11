#!/usr/bin/env bun

import '../byod-web-game/server/exit';
import { serverLog } from '../utils/logger.js';

import server from './server';

const spawnBuild = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

	for await (const chunk of buildProcess.stdout) {
		const line = new TextDecoder().decode(chunk);

		serverLog.debug('Build output', { output: line.trim() });

		if (line === 'build.success\n') server.reloadClients();
	}
};

if (process.env.NODE_ENV === 'development') {
	try {
		spawnBuild();

		for await (const line of console) {
			if ({ stop: 1, close: 1, exit: 1 }[line]) process.kill(process.pid, 'SIGTERM');
			else if (line === 'b') {
				serverLog.info('Manual build triggered');
				spawnBuild();
			}
		}
	} catch (error) {
		serverLog.error('Build process error', { error: error.message });
	}
}
