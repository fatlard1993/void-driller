import { Context } from 'vanilla-bean-components';

class Players extends Map {
	constructor() {
		super();
	}

	update(id, updater = current => current) {
		this.set(id, updater(this.get(id)));
	}

	get currentPlayer() {
		return gameContext.players.get(gameContext.playerId);
	}
}

/**
 * @type {{
 * 	players: Players,
 * 	gameId: '',
 * 	playerId: ''
 * }}
 */
const gameContext = new Context({
	players: new Players(),
});

export default gameContext;
