import { failureReason } from '@vanilla-bean/components';

import { getGame } from '../api';
import gameContext from '../shared/gameContext';
import Notify from '../shared/Notify';
import { gridToPxPosition } from '../../utils';
import { Gas, Ground, Item, Lava, Mineral } from './GameObjects';
import { createAlien } from './GameObjects/aliens';
import { addDrill } from './eventRouter';
import { gridChanges, playerChanges } from './gameDiff';
import TradeDialog from './TradeDialog';

export const leave = (reason, gameId = gameContext.gameId) => {
	new Notify({ intent: 'warning', content: reason, timeout: 6000 });
	// A player's stored id is for a contract that no longer holds them; a watcher stored nothing
	if (!gameContext.isWatchMode) localStorage.removeItem(gameId);
	window.location.href = '#/hub';
};

const fetchAndReconcile = async () => {
	const { gameId } = gameContext;
	const wanted = () => Boolean(gameContext.game) && gameContext.gameId === gameId;
	const result = await getGame(gameId, { cache: false });

	// The view may have gone, or moved to another game, while the answer was on its way: that answer is for no one
	if (!wanted()) return;

	if (result.status === 'error') {
		return leave(result.response?.status === 404 ? 'This contract is gone.' : failureReason(result));
	}

	if (!gameContext.isWatchMode && !result.body.players.some(({ id }) => id === gameContext.playerId)) {
		return leave('Your contract was closed while you were away.');
	}

	reconcileGame(result.body);
};

let inFlight = null;
let again = false;

/**
 * After the socket comes back, or when the view names another asteroid: ask the server for the whole game (the views
 * leave the grid out) and bring the scene to it, or leave for the hub when the game is gone, or this player is (a
 * watcher has no player to miss). A socket that flaps asks more than once; the asks run one after another, and a later
 * one always runs last, since a later open means a later gap.
 * @returns {Promise<void>} Settles when this ask, and any it queued, are done
 */
export const refetchGame = () => {
	if (!gameContext.game) return Promise.resolve();

	if (inFlight) {
		again = true;
		return inFlight;
	}

	inFlight = fetchAndReconcile().finally(() => {
		inFlight = null;
		if (again) {
			again = false;
			return refetchGame();
		}
	});

	return inFlight;
};

const spriteFor = (scene, x, y, { name }) =>
	name.startsWith('mineral_') ? new Mineral(scene, x, y, name.replace('mineral_', '')) : new Item(scene, x, y, name);

const hazardSprite = (scene, x, y, hazard) => {
	if (hazard.type === 'lava') return new Lava(scene, x, y, 'full');
	if (hazard.type === 'gas') return new Gas(scene, x, y, 'full');
	return createAlien(scene, x, y, hazard.name, hazard.orientation || 'right');
};

/**
 * Each view of the game the server sends (enterGame's onState, after every change): the players, the outpost and the
 * trades come to it. Before the scene is drawn, it's the state the scene will draw from; a view of another asteroid
 * (a transport this page missed) fetches the whole game.
 * @param {object} view - Game.viewFor: the game without its grid
 */
export const applyView = view => {
	const local = gameContext.serverState;

	if (!local || view.id !== gameContext.gameId) return;
	if (!gameContext.isWatchMode && !view.players.some(({ id }) => id === gameContext.playerId)) {
		// Aborting the contract is on its way out already
		if (!gameContext.exiting) leave('Your contract was closed.');
		return;
	}
	if (view.world.name !== local.world.name) return refetchGame();

	if (!gameContext.spaceco) {
		Object.assign(local.world, view.world);
		local.players = view.players;
		local.trades = view.trades;
		return;
	}

	reconcileGame(view);
};

/**
 * Bring the scene to the server's state: players moved or gone, the outpost, every cell that changed (when the state
 * carries the grid), and a trade that did not survive. A different asteroid altogether is rebuilt whole.
 * @param {object} state - The game as the server sends it, or a view of it without the grid
 */
export const reconcileGame = state => {
	const { scene, sceneLayers } = gameContext;
	const local = gameContext.serverState;

	if (!scene || state.world.name !== local.world.name) {
		gameContext.serverState = state;
		scene?.rebuildWorld({ world: state.world, players: state.players });
		return;
	}

	const { gone, added, updated } = playerChanges(gameContext.players, state.players);

	gone.forEach(id => {
		gameContext.players.get(id)?.sprite?.destroy();
		gameContext.players.delete(id);
		scene.playerLabels?.get(id)?.destroy();
		scene.playerLabels?.delete(id);
	});
	// Watch draws a rig with a name label through its own addPlayer; Play draws the other rigs' drills
	added.forEach(player => {
		if (scene.addPlayer) scene.addPlayer(player);
		else if (player.id !== gameContext.playerId) addDrill(player);
	});
	updated.forEach(player => {
		const before = gameContext.players.get(player.id);
		const moved = before.position.x !== player.position.x || before.position.y !== player.position.y;

		gameContext.players.set(player.id, { ...before, ...player, sprite: before.sprite, _stuckClickCount: 0 });
		if (moved) {
			before.sprite?.move(player.position, 0, player.orientation);
			scene.updatePlayerLabel?.(player.id, player.position);
		}
	});

	const { spaceco } = state.world;
	const outpostMoved =
		spaceco.position.x !== local.world.spaceco.position.x || spaceco.position.y !== local.world.spaceco.position.y;

	Object.assign(local.world.spaceco, spaceco);
	if (gameContext.spaceco) {
		if (outpostMoved) {
			const { x, y } = gridToPxPosition(spaceco.position);
			gameContext.spaceco.setPosition(x, y);
			gameContext.spaceco.hidePrompt();
		}
		gameContext.spaceco.updateStatusBars({ position: spaceco.position });
		gameContext.spaceco.checkForNearbyPlayer();
	}

	gridChanges(local.world.grid, state.world.grid ?? []).forEach(({ x, y, ground, items, hazards }) => {
		const cell = local.world.grid[x][y];

		if (ground !== undefined) {
			cell.ground?.sprite?.dig();
			cell.ground = ground ? { type: ground, sprite: new Ground(scene, x, y, ground) } : {};
			if (ground) sceneLayers.ground.add(cell.ground.sprite);
		}

		if (items) {
			cell.items.forEach(item => item.sprite?.destroy());
			cell.items = items.map(item => {
				const sprite = spriteFor(scene, x, y, item);
				sceneLayers.items.add(sprite);
				return { ...item, sprite };
			});
		}

		if (hazards) {
			cell.hazards.forEach(hazard => hazard.sprite?.destroy());
			cell.hazards = hazards.map(hazard => {
				const sprite = hazardSprite(scene, x, y, hazard);
				if (sprite) sceneLayers.hazards.add(sprite);
				return { ...hazard, sprite };
			});
		}
	});

	const trades = state.trades || [];
	const dialog = gameContext.openDialog;

	if (dialog instanceof TradeDialog && dialog.tradeSession && !trades.some(trade => trade.id === dialog.tradeSession?.id)) {
		dialog.tradeSession = null;
		dialog.close();
		new Notify({ intent: 'warning', content: 'The trade is over.', timeout: 4000 });
	}
	if (gameContext.pendingTradeInvitation && !trades.some(trade => trade.id === gameContext.pendingTradeInvitation.id)) {
		gameContext.pendingTradeInvitation = null;
	}

	local.players = state.players;
	local.world.transports = state.world.transports;

	const me = gameContext.players.currentPlayer;
	if (me) gameContext.statusBarHUD?.update(me);
	me?.sprite?.checkForNearbyPlayers?.();
	me?.sprite?.checkForNearbyItems?.();
};
