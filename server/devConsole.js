import { serverLog } from '../utils/logger.js';
import server from './server.js';

const spawnBuild = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

	for await (const chunk of buildProcess.stdout) {
		const line = new TextDecoder().decode(chunk);

		serverLog.debug('Build output', { output: line.trim() });

		if (line === 'build.success\n') server.reloadClients();
	}
};

export const handleDevCommand = async (command, server, spawnBuild) => {
	if ({ stop: 1, close: 1, exit: 1 }[command]) {
		process.kill(process.pid, 'SIGTERM');
		return;
	}

	if (command === 'b' || command === 'build') {
		serverLog.info('Manual build triggered');
		spawnBuild();
		return;
	}

	// Enhanced dev queries
	if (command === 'help') {
		console.log('\n=== DEV SERVER COMMANDS ===');
		console.log('=== Basic ===');
		console.log('build|b      - Trigger manual build');
		console.log('help         - Show this help');
		console.log('stats        - Show server statistics');
		console.log('stop/exit    - Stop server');
		console.log('fuck         - Emergency failure detection & recovery');
		console.log('\n=== Game Data ===');
		console.log('games        - List active games');
		console.log('world        - Show world overview');
		console.log('players      - Show player info');
		console.log('aliens       - Show alien info');
		console.log('aliens-full  - Show detailed alien info');
		console.log('inventory    - Show player inventories');
		console.log('spaceco      - Show SpaceCo detailed info');
		console.log('grid <x> <y> - Show detailed cell info');
		console.log('area <x> <y> <r> - Show area around position');
		console.log('\n=== Advanced ===');
		console.log('query <js>   - Execute JavaScript query');
		console.log('inspect <obj>- Deep inspect object (players, world, spaceco, etc.)');
		console.log('find <type>  - Find items/hazards (e.g., find aliens, find bombs)');
		console.log('count <type> - Count specific things in world\n');
		return;
	}

	if (command === 'games') {
		const gameIds = Object.keys(server.games);
		console.log(`\n=== ACTIVE GAMES (${gameIds.length}) ===`);
		gameIds.forEach(gameId => {
			const game = server.games[gameId];
			console.log(`Game ${gameId}: ${game.players.size} players, world: ${game.world.name}`);
		});
		console.log();
		return;
	}

	if (command === 'aliens') {
		console.log('\n=== ALIEN COUNTS ===');
		Object.entries(server.games).forEach(([gameId, game]) => {
			const alienCount = game.world.aliens ? Object.keys(game.world.aliens).length : 0;
			console.log(`Game ${gameId}: ${alienCount} aliens (world: ${game.world.name})`);
		});
		console.log();
		return;
	}

	if (command === 'players') {
		console.log('\n=== PLAYERS ===');
		Object.entries(server.games).forEach(([gameId, game]) => {
			console.log(`Game ${gameId}: ${game.players.size} players`);
			game.players.forEach((player, playerId) => {
				console.log(`  ${playerId}: ${player.health}/${player.maxHealth} HP, pos: (${player.position.x}, ${player.position.y})`);
			});
		});
		console.log();
		return;
	}

	if (command === 'world') {
		const firstGame = Object.values(server.games)[0];
		if (firstGame) {
			const world = firstGame.world;
			console.log('\n=== WORLD INFO ===');
			console.log(`Name: ${world.name}`);
			console.log(`Size: ${world.width}x${world.depth}`);
			console.log(`Aliens: ${world.aliens ? Object.keys(world.aliens).length : 0}`);
			console.log(`SpaceCo Health: ${world.spaceco.health}`);
			console.log(`SpaceCo Position: (${world.spaceco.position.x}, ${world.spaceco.position.y})`);
			console.log(`SpaceCo XP: ${world.spaceco.xp}`);

			// Count total items and hazards in world
			let totalItems = 0;
			let totalHazards = 0;
			let totalGround = 0;

			world.grid.forEach(column => {
				column.forEach(cell => {
					if (cell.ground?.type) totalGround++;
					if (cell.items?.length) totalItems += cell.items.length;
					if (cell.hazards?.length) totalHazards += cell.hazards.length;
				});
			});

			console.log(`Total Ground: ${totalGround}`);
			console.log(`Total Items: ${totalItems}`);
			console.log(`Total Hazards: ${totalHazards}`);
			console.log();
		} else {
			console.log('\nNo active games found.\n');
		}
		return;
	}

	if (command === 'stats') {
		console.log('\n=== SERVER STATS ===');
		console.log(`Node.js version: ${process.version}`);
		console.log(`Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
		console.log(`Uptime: ${Math.round(process.uptime())}s`);
		console.log(`Active games: ${Object.keys(server.games).length}`);

		let totalPlayers = 0;
		Object.values(server.games).forEach(game => {
			totalPlayers += game.players.size;
		});
		console.log(`Total players: ${totalPlayers}`);
		console.log();
		return;
	}

	if (command === 'aliens-full') {
		console.log('\n=== DETAILED ALIEN INFO ===');
		Object.entries(server.games).forEach(([gameId, game]) => {
			const aliens = game.world.aliens;
			console.log(`Game ${gameId} (${game.world.name}):`);
			if (!aliens || Object.keys(aliens).length === 0) {
				console.log('  No aliens found');
			} else {
				Object.entries(aliens).forEach(([alienId, alien]) => {
					console.log(`  ${alienId}: ${alien.type} at (${alien.position.x}, ${alien.position.y})`);
					console.log(`    Health: ${alien.health}/${alien.maxHealth}, State: ${alien.state}`);
					console.log(`    Awake: ${alien.awake}, Last Action: ${alien.lastActionTime || 'none'}`);
				});
			}
		});
		console.log();
		return;
	}

	if (command === 'inventory') {
		console.log('\n=== PLAYER INVENTORIES ===');
		Object.entries(server.games).forEach(([gameId, game]) => {
			console.log(`Game ${gameId}:`);
			game.players.forEach((player, playerId) => {
				console.log(`  ${playerId}:`);
				console.log(`    Credits: ${player.credits}`);
				console.log(`    Fuel: ${player.fuel}/${player.maxFuel}`);

				// Items
				const items = Object.entries(player.items || {}).filter(([, count]) => count > 0);
				console.log(`    Items (${items.length}): ${items.map(([name, count]) => `${name}:${count}`).join(', ') || 'none'}`);

				// Minerals in hull
				const minerals = Object.entries(player.hull || {}).filter(([, count]) => count > 0);
				console.log(`    Minerals (${minerals.length}): ${minerals.map(([name, count]) => `${name}:${count}`).join(', ') || 'none'}`);
			});
		});
		console.log();
		return;
	}

	if (command === 'spaceco') {
		const firstGame = Object.values(server.games)[0];
		if (firstGame) {
			const spaceco = firstGame.world.spaceco;
			console.log('\n=== SPACECO DETAILED INFO ===');
			console.log(`Health: ${spaceco.health}/${spaceco.maxHealth || 100}`);
			console.log(`Position: (${spaceco.position.x}, ${spaceco.position.y})`);
			console.log(`XP: ${spaceco.xp}`);
			console.log(`Credits Earned: ${spaceco.stats?.creditsEarned || 0}`);
			console.log(`Items Sold: ${spaceco.stats?.itemsSold || 0}`);

			// Shop inventory
			console.log('\nShop Inventory:');
			Object.entries(spaceco.shop || {}).forEach(([item, stock]) => {
				console.log(`  ${item}: ${stock} units`);
			});

			// Hull inventory
			console.log('\nHull Storage:');
			Object.entries(spaceco.hull || {}).forEach(([mineral, count]) => {
				if (count > 0) console.log(`  ${mineral}: ${count}`);
			});
			console.log();
		} else {
			console.log('\nNo active games found.\n');
		}
		return;
	}

	if (command.startsWith('grid ')) {
		const parts = command.split(' ');
		const x = parseInt(parts[1]);
		const y = parseInt(parts[2]);

		const firstGame = Object.values(server.games)[0];
		if (firstGame && !isNaN(x) && !isNaN(y)) {
			const cell = firstGame.world.grid[x]?.[y];
			console.log(`\n=== GRID CELL (${x}, ${y}) ===`);
			if (!cell) {
				console.log('Cell not found or out of bounds');
			} else {
				console.log(`Ground: ${cell.ground?.type || 'none'}`);
				console.log(`Items (${cell.items?.length || 0}): ${cell.items?.map(item => item.name).join(', ') || 'none'}`);
				console.log(`Hazards (${cell.hazards?.length || 0}): ${cell.hazards?.map(h => `${h.type}(${h.id || 'no-id'})`).join(', ') || 'none'}`);

				// Check if any players are here
				const playersHere = [];
				firstGame.players.forEach((player, playerId) => {
					if (player.position.x === x && player.position.y === y) {
						playersHere.push(playerId);
					}
				});
				if (playersHere.length > 0) {
					console.log(`Players here: ${playersHere.join(', ')}`);
				}
			}
			console.log();
		} else {
			console.log('\nUsage: grid <x> <y>\n');
		}
		return;
	}

	if (command.startsWith('area ')) {
		const parts = command.split(' ');
		const x = parseInt(parts[1]);
		const y = parseInt(parts[2]);
		const radius = parseInt(parts[3]) || 2;

		const firstGame = Object.values(server.games)[0];
		if (firstGame && !isNaN(x) && !isNaN(y)) {
			console.log(`\n=== AREA AROUND (${x}, ${y}) RADIUS ${radius} ===`);
			for (let dy = -radius; dy <= radius; dy++) {
				for (let dx = -radius; dx <= radius; dx++) {
					const checkX = x + dx;
					const checkY = y + dy;
					const cell = firstGame.world.grid[checkX]?.[checkY];

					let cellDisplay = '·';
					if (cell) {
						if (cell.ground?.type) cellDisplay = 'G';
						else if (cell.hazards?.length > 0) cellDisplay = 'H';
						else if (cell.items?.length > 0) cellDisplay = 'I';
						else cellDisplay = ' ';
					}

					// Mark center position
					if (dx === 0 && dy === 0) cellDisplay = 'X';

					process.stdout.write(cellDisplay);
				}
				console.log(` ${y + dy}`);
			}
			console.log('Legend: G=Ground, H=Hazard, I=Item, X=Center, ·=OOB, space=Empty\n');
		} else {
			console.log('\nUsage: area <x> <y> [radius]\n');
		}
		return;
	}

	if (command.startsWith('inspect ')) {
		const objName = command.substring(8).trim();
		const firstGame = Object.values(server.games)[0];

		try {
			let obj;
			switch (objName) {
				case 'world':
					obj = firstGame?.world;
					break;
				case 'players':
					obj = firstGame ? Object.fromEntries(firstGame.players.entries()) : null;
					break;
				case 'spaceco':
					obj = firstGame?.world?.spaceco;
					break;
				case 'aliens':
					obj = firstGame?.world?.aliens;
					break;
				case 'games':
					obj = Object.keys(server.games).reduce((acc, gameId) => {
						acc[gameId] = {
							playerCount: server.games[gameId].players.size,
							worldName: server.games[gameId].world.name,
						};
						return acc;
					}, {});
					break;
				default:
					console.log(`\nUnknown object: ${objName}. Available: world, players, spaceco, aliens, games\n`);
					return;
			}

			console.log(`\n=== INSPECT ${objName.toUpperCase()} ===`);
			console.log(JSON.stringify(obj, null, 2));
			console.log();
		} catch (error) {
			console.log(`\nInspect error: ${error.message}\n`);
		}
		return;
	}

	if (command.startsWith('find ')) {
		const searchType = command.substring(5).trim();
		const firstGame = Object.values(server.games)[0];

		if (firstGame) {
			console.log(`\n=== FIND ${searchType.toUpperCase()} ===`);
			const results = [];

			firstGame.world.grid.forEach((column, x) => {
				column.forEach((cell, y) => {
					// Search based on type
					if (searchType === 'aliens' && cell.hazards?.some(h => h.type === 'alien')) {
						const alien = cell.hazards.find(h => h.type === 'alien');
						results.push(`Alien ${alien.id || 'unknown'} at (${x}, ${y})`);
					}
					else if (searchType === 'bombs' && cell.items?.some(i => i.name.includes('charge') || i.name.includes('implosion'))) {
						const bombs = cell.items.filter(i => i.name.includes('charge') || i.name.includes('implosion'));
						bombs.forEach(bomb => results.push(`${bomb.name} at (${x}, ${y})`));
					}
					else if (searchType === 'items' && cell.items?.length > 0) {
						cell.items.forEach(item => results.push(`${item.name} at (${x}, ${y})`));
					}
					else if (searchType === 'hazards' && cell.hazards?.length > 0) {
						cell.hazards.forEach(hazard => results.push(`${hazard.type} at (${x}, ${y})`));
					}
					else if (searchType.includes('mineral') && cell.ground?.type?.includes(searchType.replace('mineral_', ''))) {
						results.push(`${cell.ground.type} ground at (${x}, ${y})`);
					}
				});
			});

			console.log(`Found ${results.length} results:`);
			results.slice(0, 50).forEach(result => console.log(`  ${result}`));
			if (results.length > 50) {
				console.log(`  ... and ${results.length - 50} more`);
			}
			console.log();
		} else {
			console.log('\nNo active games found.\n');
		}
		return;
	}

	if (command.startsWith('count ')) {
		const countType = command.substring(6).trim();
		const firstGame = Object.values(server.games)[0];

		if (firstGame) {
			console.log(`\n=== COUNT ${countType.toUpperCase()} ===`);
			let count = 0;
			const breakdown = {};

			firstGame.world.grid.forEach((column) => {
				column.forEach((cell) => {
					if (countType === 'all') {
						if (cell.ground?.type) {
							breakdown['ground'] = (breakdown['ground'] || 0) + 1;
							count++;
						}
						if (cell.items?.length) {
							breakdown['items'] = (breakdown['items'] || 0) + cell.items.length;
							count += cell.items.length;
						}
						if (cell.hazards?.length) {
							breakdown['hazards'] = (breakdown['hazards'] || 0) + cell.hazards.length;
							count += cell.hazards.length;
						}
					}
					else if (countType === 'aliens' && cell.hazards?.some(h => h.type === 'alien')) {
						count += cell.hazards.filter(h => h.type === 'alien').length;
					}
					else if (countType === 'items' && cell.items?.length > 0) {
						count += cell.items.length;
						cell.items.forEach(item => {
							breakdown[item.name] = (breakdown[item.name] || 0) + 1;
						});
					}
					else if (countType === 'hazards' && cell.hazards?.length > 0) {
						count += cell.hazards.length;
						cell.hazards.forEach(hazard => {
							breakdown[hazard.type] = (breakdown[hazard.type] || 0) + 1;
						});
					}
					else if (countType === 'ground' && cell.ground?.type) {
						count++;
						breakdown[cell.ground.type] = (breakdown[cell.ground.type] || 0) + 1;
					}
				});
			});

			console.log(`Total ${countType}: ${count}`);
			if (Object.keys(breakdown).length > 0) {
				console.log('Breakdown:');
				Object.entries(breakdown).sort(([,a], [,b]) => b - a).forEach(([type, total]) => {
					console.log(`  ${type}: ${total}`);
				});
			}
			console.log();
		} else {
			console.log('\nNo active games found.\n');
		}
		return;
	}

	if (command.startsWith('query ')) {
		// Advanced query system for custom data access
		const query = command.substring(6).trim();
		try {
			const result = eval(`(function() {
				const games = server.games;
				const firstGame = Object.values(games)[0];
				return ${query};
			})()`);
			console.log(`\n=== QUERY RESULT ===`);
			console.log(JSON.stringify(result, null, 2));
			console.log();
		} catch (error) {
			console.log(`\nQuery error: ${error.message}\n`);
		}
		return;
	}

	// Emergency failure detection and recovery command
	if (command === 'fuck' || command === '/fuck') {
		console.log('\n=== EMERGENCY FAILURE DETECTION & RECOVERY ===');
		
		// 1. Check for zombie build processes
		const zombieProcesses = [];
		try {
			const psOutput = Bun.spawn(['ps', 'aux']).stdout;
			const processes = new TextDecoder().decode(await psOutput).split('\n');
			
			processes.forEach(line => {
				if (line.includes('bun run client/build.js') && !line.includes('grep')) {
					const pid = line.trim().split(/\s+/)[1];
					zombieProcesses.push({ pid, line: line.trim() });
				}
			});
			
			if (zombieProcesses.length > 1) {
				console.log(`🚨 PROBLEM DETECTED: ${zombieProcesses.length} zombie build processes found!`);
				console.log('Killing excess build processes...');
				
				// Keep only the most recent build process, kill the rest
				const sortedProcesses = zombieProcesses.sort((a, b) => parseInt(b.pid) - parseInt(a.pid));
				
				for (let i = 1; i < sortedProcesses.length; i++) {
					try {
						process.kill(parseInt(sortedProcesses[i].pid), 'SIGTERM');
						console.log(`✅ Killed zombie process PID ${sortedProcesses[i].pid}`);
					} catch (error) {
						console.log(`❌ Failed to kill PID ${sortedProcesses[i].pid}: ${error.message}`);
					}
				}
			} else {
				console.log('✅ No zombie build processes detected');
			}
		} catch (error) {
			console.log(`❌ Failed to check for zombie processes: ${error.message}`);
		}
		
		// 2. Check git status for uncommitted changes
		try {
			const gitStatusOutput = Bun.spawn(['git', 'status', '--porcelain']).stdout;
			const gitStatus = new TextDecoder().decode(await gitStatusOutput).trim();
			
			if (gitStatus) {
				console.log('🚨 PROBLEM DETECTED: Uncommitted changes found');
				console.log('Modified/untracked files:');
				gitStatus.split('\n').forEach(line => {
					if (line.trim()) console.log(`  ${line}`);
				});
				
				// Check for common problematic files
				if (gitStatus.includes('package.json') || gitStatus.includes('bun.lock')) {
					console.log('⚠️  Package files modified - you may need to run: bun install');
				}
			} else {
				console.log('✅ Git status clean');
			}
		} catch (error) {
			console.log(`❌ Failed to check git status: ${error.message}`);
		}
		
		// 3. Check if main server is running
		try {
			const lsofOutput = Bun.spawn(['lsof', '-i', ':3000']).stdout;
			const lsofResult = new TextDecoder().decode(await lsofOutput).trim();
			
			if (!lsofResult) {
				console.log('🚨 PROBLEM DETECTED: Main server not running on port 3000');
				console.log('💡 FIX: Run "bun run dev" to start the main server');
			} else {
				console.log('✅ Main server running on port 3000');
			}
		} catch {
			console.log('⚠️  Could not check port 3000 status');
		}
		
		// 4. Check disk space
		try {
			const dfOutput = Bun.spawn(['df', '-h', '.']).stdout;
			const dfResult = new TextDecoder().decode(await dfOutput).trim();
			const lines = dfResult.split('\n');
			
			if (lines.length > 1) {
				const diskLine = lines[1];
				const usage = diskLine.split(/\s+/)[4]; // Usage percentage
				const usagePercent = parseInt(usage.replace('%', ''));
				
				if (usagePercent > 90) {
					console.log('🚨 PROBLEM DETECTED: Low disk space');
					console.log(`Disk usage: ${usage}`);
					console.log('💡 FIX: Clean up old files, empty trash, or free up space');
				} else {
					console.log(`✅ Disk space OK (${usage} used)`);
				}
			}
		} catch (error) {
			console.log(`❌ Failed to check disk space: ${error.message}`);
		}
		
		// 5. Check for common Node.js/Bun issues
		console.log('\n=== QUICK HEALTH CHECK ===');
		console.log(`Node.js version: ${process.version}`);
		console.log(`Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
		console.log(`Uptime: ${Math.round(process.uptime())}s`);
		console.log(`Active games: ${Object.keys(server.games).length}`);
		
		// 6. Provide recovery suggestions
		console.log('\n=== SUGGESTED RECOVERY ACTIONS ===');
		console.log('1. If build issues: ctrl+c, then run "bun run dev"');
		console.log('2. If git issues: "git add ." then "git commit -m "fix: recovery commit""');
		console.log('3. If dependency issues: "bun install"');
		console.log('4. If port conflicts: "lsof -ti:3000 | xargs kill -9"');
		console.log('5. If memory issues: restart terminal and try again');
		console.log('6. Nuclear option: "git stash && bun run dev:clean"\n');
		
		return;
	}

	if (command && command !== '') {
		console.log(`Unknown command: ${command}. Type 'help' for available commands.\n`);
	}
};

if (process.env.NODE_ENV === 'development') {
	try {
		spawnBuild();

		for await (const line of console) {
			const command = line.trim();
			await handleDevCommand(command, server, spawnBuild);
		}
	} catch (error) {
		serverLog.error('Build process error', { error: error.message });
	}
}