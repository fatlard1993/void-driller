/**
 * Example implementation showing how to use the byod-web-game framework
 * for creating a simple card game
 */

import BaseGame from '../server/Game.js';

export default class SimpleCardGame extends BaseGame {
	constructor({ saveState = {}, server, ...options }) {
		super({ saveState, server, ...options });

		// Initialize game-specific state
		this.gameState = saveState.gameState || this.initializeGameState();
	}

	initializeGameState() {
		return {
			deck: this.shuffleDeck(this.createDeck()),
			currentTurn: 0,
			phase: 'waiting', // waiting, playing, finished
			turnCount: 0,
			winner: null,
		};
	}

	createDeck() {
		const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
		const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
		const deck = [];

		for (const suit of suits) {
			for (const value of values) {
				deck.push({ suit, value, id: `${value}-${suit}` });
			}
		}
		return deck;
	}

	shuffleDeck(deck) {
		const shuffled = [...deck];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	/**
	 * Override framework method to provide card game state data
	 * @param {string[]} additionalFields - Extra fields to include in game state
	 * @returns {object} Game state object
	 */
	createGameStateData(additionalFields = []) {
		const baseState = {
			phase: this.gameState.phase,
			currentTurn: this.gameState.currentTurn,
			turnCount: this.gameState.turnCount,
			deckCount: this.gameState.deck.length,
		};

		// Add extra fields as requested
		additionalFields.forEach(field => {
			if (this.gameState[field] !== undefined) {
				baseState[field] = this.gameState[field];
			}
		});

		return baseState;
	}

	addPlayer(name) {
		const newPlayer = super.addPlayer(name);

		// Initialize player with cards
		this.players.update(newPlayer.id, current => ({
			...current,
			hand: this.dealCards(5), // Deal 5 cards to new player
			score: 0,
			isReady: false,
		}));

		// Broadcast enhanced player data
		this.broadcastWithGameState('playerJoined', {
			player: this.players.get(newPlayer.id),
		});

		// Start game if we have enough players
		if (this.players.size >= 2 && this.gameState.phase === 'waiting') {
			this.startGame();
		}

		return this.players.get(newPlayer.id);
	}

	dealCards(count) {
		const cards = [];
		for (let i = 0; i < count && this.gameState.deck.length > 0; i++) {
			cards.push(this.gameState.deck.pop());
		}
		return cards;
	}

	startGame() {
		this.gameState.phase = 'playing';
		this.gameState.currentTurn = 0;

		this.broadcastWithGameState('gameStarted', {
			message: 'Game has started!',
			currentPlayer: [...this.players.values()][0]?.id,
		});
	}

	playCard(playerId, cardId) {
		const player = this.players.get(playerId);
		if (!player) return { success: false, error: 'Player not found' };

		const cardIndex = player.hand.findIndex(card => card.id === cardId);
		if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

		// Remove card from hand
		const playedCard = player.hand.splice(cardIndex, 1)[0];

		// Update player
		this.players.update(playerId, current => ({
			...current,
			hand: player.hand,
			score: current.score + this.getCardValue(playedCard),
		}));

		// Broadcast the card play with game state
		this.broadcastWithGameState(
			'cardPlayed',
			{
				playerId,
				card: playedCard,
				player: this.players.get(playerId),
			},
			['turnCount'],
		);

		this.nextTurn();
		return { success: true };
	}

	getCardValue(card) {
		const faceValues = { J: 11, Q: 12, K: 13, A: 14 };
		return faceValues[card.value] || parseInt(card.value);
	}

	nextTurn() {
		this.gameState.turnCount++;

		const playerIds = [...this.players.keys()];
		this.gameState.currentTurn = (this.gameState.currentTurn + 1) % playerIds.length;

		this.broadcastWithGameState('turnChanged', {
			currentPlayer: playerIds[this.gameState.currentTurn],
			turnCount: this.gameState.turnCount,
		});
	}

	toSaveState() {
		return {
			...super.toSaveState(),
			gameState: this.gameState,
		};
	}
}
