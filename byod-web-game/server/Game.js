import { debounce } from 'vanilla-bean-components/utils';
import Log from 'log';
import { simpleId } from '../utils';

class Players extends Map {
	constructor() {
		super();
	}

	update(playerId, updater = current => current) {
		this.set(playerId, updater(this.get(playerId)));
	}
}

export default class Game {
	constructor({ saveState = {}, server, logger, ...options }) {
		this.id = saveState.id || simpleId();
		this.name = saveState.name || options.name || simpleId();
		this.options = saveState.options || options;

		this.server = server;
		
		// Create default logger if none provided
		this.logger = logger || new Log({ 
			tag: 'byod-game',
			defaults: {
				verbosity: process.env.NODE_ENV === 'production' ? 1 : 3,
				color: true,
				silentTag: false,
				methodTag: true
			}
		});

		this.players = new Players();

		this.save = debounce(() => server.database.collections.games.set({ id: this.id, data: this.toSaveState() }), 5000);

		if (saveState.players) saveState.players.map(player => this.players.set(player.id, player));

		if (!saveState) server.database.collections.games.create(this.toSaveState());

		server.games[this.id] = this;
	}

	toClient() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,
			players: [...this.players.values()],
		};
	}

	toSaveState() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,
			players: [...this.players.values()],
		};
	}

	broadcast(key, data) {
		const safeData = { id: this.id, update: key };
		
		// Copy properties from data, avoiding potential cyclic references
		if (data && typeof data === 'object') {
			Object.keys(data).forEach(prop => {
				try {
					// Test if the property serializes correctly
					JSON.stringify(data[prop]);
					safeData[prop] = data[prop];
				} catch (error) {
					if (error.message.includes('cyclic')) {
						this.logger.warning(`Skipping cyclic property '${prop}' in broadcast '${key}'`);
						// For complex objects, try to get a safe representation
						if (data[prop] && typeof data[prop].toClient === 'function') {
							safeData[prop] = data[prop].toClient();
						} else {
							this.logger.warning(`No safe serialization available for property '${prop}'`);
						}
					} else {
						throw error;
					}
				}
			});
		}
		this.server.socketBroadcast(safeData);
		this.save();
	}

	addPlayer(name) {
		const id = simpleId();

		this.players.set(id, {
			name,
			id,
		});

		const newPlayer = this.players.get(id);

		this.broadcast('addPlayer', { newPlayer });

		return newPlayer;
	}

	removePlayer(id) {
		this.players.delete(id);

		this.broadcast('removePlayer', { id });

		return id;
	}

	/**
	 * Creates standardized game state data for client synchronization
	 * Override this method in your game-specific class to provide game state
	 * @param {Array<string>} additionalFields - Extra state fields to include
	 * @returns {object} Game state object
	 */
	createGameStateData(additionalFields = []) {
		// Default implementation - game-specific logic overrides this
		const baseState = {};

		// Add extra fields as requested
		additionalFields.forEach(field => {
			if (this.gameState && this.gameState[field] !== undefined) {
				baseState[field] = this.gameState[field];
			}
		});

		return baseState;
	}

	/**
	 * Enhanced broadcast method that automatically includes game state data
	 * @param {string} event - The event name
	 * @param {object} data - The event data
	 * @param {Array<string>} stateFields - Additional game state fields to include
	 * @param {string} stateKey - Key name for the game state object (default: 'gameState')
	 */
	broadcastWithGameState(event, data, stateFields = [], stateKey = 'gameState') {
		const gameStateData = this.createGameStateData(stateFields);
		
		// Only include game state if there's actual data
		const enhancedData = Object.keys(gameStateData).length > 0 
			? { ...data, [stateKey]: gameStateData }
			: data;
			
		this.broadcast(event, enhancedData);
	}
}
