import gameContext from '../../shared/gameContext';
import Notify from '../../shared/Notify';
import TradeDialog from '../TradeDialog';

export default data => {
	if (data.update === 'tradeSessionStarted') {
		const { trade, player1Name, player2Name } = data;

		// Determine which player is "other" from our perspective
		const isPlayer1 = trade.player1Id === gameContext.playerId;
		const isPlayer2 = trade.player2Id === gameContext.playerId;

		if (isPlayer1) {
			// Player 1 (initiator) - open dialog immediately
			const otherPlayer = gameContext.players.get(trade.player2Id);

			if (gameContext.openDialog?.elem?.open) {
				gameContext.openDialog.close();
			}

			gameContext.openDialog = new TradeDialog({
				otherPlayer,
				tradeSession: trade,
			});

			new Notify({
				type: 'info',
				content: `Trade session started with ${player2Name}`,
				timeout: 3000,
			});
		} else if (isPlayer2) {
			// Player 2 (invited) - just show notification, they need to press Trade button
			// Store the pending trade session on the player for later
			gameContext.pendingTradeInvitation = trade;

			new Notify({
				type: 'info',
				content: `${player1Name} wants to trade! Press their Trade button to accept.`,
				timeout: 5000,
			});

			// Play trade alert sound
			gameContext.scene.sound.play('alert_trade', { volume: gameContext.volume.interfaces });

			// Force check for nearby players to show the trade button
			const currentPlayerSprite = gameContext.players.currentPlayer?.sprite;
			if (currentPlayerSprite && currentPlayerSprite.checkForNearbyPlayers) {
				currentPlayerSprite.checkForNearbyPlayers();
			}
		}

		return true;
	} else if (data.update === 'tradeUpdated') {
		const { trade, updatedBy } = data;

		console.log('📦 tradeUpdated received:', {
			tradeId: trade.id,
			updatedBy,
			currentPlayerId: gameContext.playerId,
			dialogOpen: gameContext.openDialog instanceof TradeDialog,
			dialogTradeId: gameContext.openDialog?.tradeSession?.id,
			player1Offer: trade.player1Offer,
			player2Offer: trade.player2Offer,
		});

		// Update the dialog if it's open and matches this trade
		if (
			gameContext.openDialog instanceof TradeDialog &&
			gameContext.openDialog.tradeSession?.id === trade.id
		) {
			console.log('✅ Updating dialog with new trade data');
			gameContext.openDialog.updateFromSocketEvent(trade);

			// Show notification if other player updated
			if (updatedBy !== gameContext.playerId) {
				const otherPlayerName = gameContext.openDialog.otherPlayer.name;
				console.log('🔔 Showing update notification to:', gameContext.playerId, 'about:', updatedBy);
				new Notify({
					type: 'info',
					content: `${otherPlayerName} updated their offer`,
					timeout: 2000,
				});
			}
		} else {
			console.log('❌ Dialog not open or trade ID mismatch');
		}

		return true;
	} else if (data.update === 'tradeAcceptanceChanged') {
		const { tradeId, playerId, player1Accepted, player2Accepted } = data;

		// Update the dialog if it's open and matches this trade
		if (
			gameContext.openDialog instanceof TradeDialog &&
			gameContext.openDialog.tradeSession?.id === tradeId
		) {
			const trade = {
				...gameContext.openDialog.tradeSession,
				player1Accepted,
				player2Accepted,
			};
			gameContext.openDialog.updateFromSocketEvent(trade);

			// Show notification if other player accepted
			if (playerId !== gameContext.playerId) {
				const otherPlayerName = gameContext.openDialog.otherPlayer.name;
				new Notify({
					type: 'success',
					content: `${otherPlayerName} accepted the trade!`,
					timeout: 2000,
				});
			}
		}

		return true;
	} else if (data.update === 'tradeCompleted') {
		const { player1Id, player2Id, player1Updates, player2Updates } = data;

		// Update local player state
		if (player1Id === gameContext.playerId) {
			gameContext.players.update(player1Id, player => ({
				...player,
				...player1Updates,
			}));

			new Notify({
				type: 'success',
				content: 'Trade completed successfully!',
				timeout: 3000,
			});
		} else if (player2Id === gameContext.playerId) {
			gameContext.players.update(player2Id, player => ({
				...player,
				...player2Updates,
			}));

			new Notify({
				type: 'success',
				content: 'Trade completed successfully!',
				timeout: 3000,
			});
		}

		// Update other player's state if visible
		if (player1Id !== gameContext.playerId) {
			gameContext.players.update(player1Id, player => ({
				...player,
				...player1Updates,
			}));
		}
		if (player2Id !== gameContext.playerId) {
			gameContext.players.update(player2Id, player => ({
				...player,
				...player2Updates,
			}));
		}

		// Clear pending invitation if it matches this trade
		if (gameContext.pendingTradeInvitation?.id === data.tradeId) {
			gameContext.pendingTradeInvitation = null;
		}

		// Close the trade dialog
		if (gameContext.openDialog instanceof TradeDialog) {
			gameContext.openDialog.close();
		}

		return true;
	} else if (data.update === 'tradeFailed') {
		const { error, player1Id, player2Id } = data;

		if (player1Id === gameContext.playerId || player2Id === gameContext.playerId) {
			new Notify({
				type: 'error',
				content: `Trade failed: ${error}`,
				timeout: 4000,
			});

			// Close the trade dialog
			if (gameContext.openDialog instanceof TradeDialog) {
				gameContext.openDialog.close();
			}
		}

		return true;
	} else if (data.update === 'tradeCancelled') {
		const { cancelledBy, player1Id, player2Id } = data;

		if (cancelledBy === gameContext.playerId) {
			new Notify({
				type: 'info',
				content: 'You cancelled the trade',
				timeout: 2000,
			});
		} else if (player1Id === gameContext.playerId || player2Id === gameContext.playerId) {
			new Notify({
				type: 'warning',
				content: 'Trade was cancelled',
				timeout: 3000,
			});
		}

		// Clear pending invitation if it matches this trade
		if (gameContext.pendingTradeInvitation?.id === data.tradeId) {
			gameContext.pendingTradeInvitation = null;
		}

		// Close the trade dialog
		if (gameContext.openDialog instanceof TradeDialog) {
			gameContext.openDialog.close();
		}

		return true;
	}

	return false;
};
