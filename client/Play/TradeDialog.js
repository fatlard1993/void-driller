import { Button, Elem, Input, Label, Select, capitalize, styled, theme, Context } from 'vanilla-bean-components';

import { MineralImage, ItemImage } from '../shared/SpriteSheetImage';
import { updateTradeOffer, acceptTrade, cancelTrade } from '../api';
import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { minerals, items } from '../../constants';
import Notify from '../shared/Notify';

const TradeItemRow = styled.Component`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 6px;
	background: ${({ colors }) => colors.white.setAlpha(0.02)};
	border-radius: 3px;
	margin-bottom: 6px;

	.item-image {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-weight: bold;
		font-size: 0.9em;
	}

	.item-available {
		font-size: 0.8em;
		color: ${({ colors }) => colors.lighter(colors.gray)};
		margin-top: 2px;
	}

	.quantity-controls {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.quantity-input {
		width: 60px;
		text-align: center;
	}

	.quantity-button {
		width: 24px;
		height: 24px;
		font-size: 14px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
`;

class TradeItemsList extends (styled.Component`
	flex: 1;
	max-height: 280px;
	overflow-y: auto;
	margin-bottom: 12px;

	.empty-trade {
		color: ${({ colors }) => colors.lighter(colors.gray)};
		text-align: center;
		font-style: italic;
		padding: 24px 12px;
	}
`) {
	render() {
		super.render();

		const { offer, editable, tradeDialog } = this.options;
		this.renderContent(offer, editable, tradeDialog);
	}

	_setOption(key, value) {
		if (key === 'offer') {
			// Don't call super._setOption to avoid recursion
			// Just clear and re-render the content
			if (this.elem) {
				this.elem.innerHTML = '';
				const { editable, tradeDialog } = this.options;
				this.renderContent(value, editable, tradeDialog);
			}
		} else {
			super._setOption(key, value);
		}
	}

	renderContent(offer, editable, tradeDialog) {
		console.log(`🎨 TradeItemsList renderContent:`, offer);

		let hasItems = false;

		// Credits
		if ((offer.credits || 0) > 0) {
			hasItems = true;

			this.append(
				new TradeItemRow(
					{},
					new ItemImage('credits', { className: 'item-image' }),
					new Elem(
						{ tag: 'div', className: 'item-info' },
						new Elem({ tag: 'div', className: 'item-name', content: 'Credits' }),
						editable &&
							new Elem({
								tag: 'div',
								className: 'item-available',
								content: `Available: ${tradeDialog.currentPlayer.credits}`,
							}),
					),
					editable
						? tradeDialog.renderQuantityControls(offer, 'credits')
						: new Elem({
								tag: 'div',
								content: offer.credits.toString(),
								style: { fontWeight: 'bold', minWidth: '40px', textAlign: 'right' },
							}),
				),
			);
		}

		// Items
		Object.entries(offer.items || {}).forEach(([itemName, quantity]) => {
			if (quantity <= 0) return;
			hasItems = true;

			this.append(
				new TradeItemRow(
					{},
					new ItemImage(itemName, { className: 'item-image' }),
					new Elem(
						{ tag: 'div', className: 'item-info' },
						new Elem({
							tag: 'div',
							className: 'item-name',
							content: capitalize(itemName.replaceAll('_', ' '), true),
						}),
						editable &&
							new Elem({
								tag: 'div',
								className: 'item-available',
								content: `Available: ${tradeDialog.currentPlayer.items[itemName] || 0}`,
							}),
					),
					editable
						? tradeDialog.renderQuantityControls(offer.items, itemName)
						: new Elem({
								tag: 'div',
								content: `x${quantity}`,
								style: { fontWeight: 'bold', minWidth: '40px', textAlign: 'right' },
							}),
				),
			);
		});

		// Minerals
		Object.entries(offer.minerals || {}).forEach(([mineralName, quantity]) => {
			if (quantity <= 0) return;
			hasItems = true;

			const displayName = mineralName.startsWith('mineral_')
				? `Pure ${minerals[mineralName.replace('mineral_', '')].name}`
				: minerals[mineralName].name;

			this.append(
				new TradeItemRow(
					{},
					new MineralImage(mineralName.replace('mineral_', ''), { className: 'item-image' }),
					new Elem(
						{ tag: 'div', className: 'item-info' },
						new Elem({ tag: 'div', className: 'item-name', content: capitalize(displayName) }),
						editable &&
							new Elem({
								tag: 'div',
								className: 'item-available',
								content: `Available: ${tradeDialog.currentPlayer.hull[mineralName] || 0}`,
							}),
					),
					editable
						? tradeDialog.renderQuantityControls(offer.minerals, mineralName)
						: new Elem({
								tag: 'div',
								content: `x${quantity}`,
								style: { fontWeight: 'bold', minWidth: '40px', textAlign: 'right' },
							}),
				),
			);
		});

		if (!hasItems) {
			this.append(
				new Elem({
					tag: 'div',
					className: 'empty-trade',
					content: editable ? 'Add items below' : 'Nothing offered',
				}),
			);
		}
	}
}

export default class TradeDialog extends (styled(BaseDialog)`
	.trade-container {
		display: flex;
		gap: 12px;
		min-height: 400px;
	}

	.trade-side {
		flex: 1;
		border: 2px solid ${({ colors }) => colors.white.setAlpha(0.1)};
		border-radius: 6px;
		padding: 12px;
		background: ${({ colors }) => colors.white.setAlpha(0.02)};
		display: flex;
		flex-direction: column;
	}

	.trade-side.your-offer {
		border-color: ${({ colors }) => colors.blue.setAlpha(0.3)};
	}

	.trade-side.their-offer {
		border-color: ${({ colors }) => colors.green.setAlpha(0.3)};
	}

	.trade-header {
		font-weight: bold;
		margin-bottom: 12px;
		padding-bottom: 6px;
		border-bottom: 1px solid ${({ colors }) => colors.white.setAlpha(0.1)};
	}

	.trade-items {
		flex: 1;
		max-height: 280px;
		overflow-y: auto;
		margin-bottom: 12px;
	}

	.add-item-section {
		border-top: 1px solid ${({ colors }) => colors.white.setAlpha(0.1)};
		padding-top: 12px;
		margin-top: auto;
	}

	.credits-section {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 12px;
	}

	.credits-input {
		flex: 1;
		min-width: 80px;
	}

	.menu {
		display: flex;
		gap: 6px;
		margin: 6px;
		justify-content: space-between;
		align-items: center;

		.left-buttons {
			display: flex;
			gap: 6px;
		}

		.right-buttons {
			display: flex;
			gap: 6px;
		}
	}

	.menuBody {
		background-color: ${({ colors }) => colors.white.setAlpha(0.04)};
		padding: 9px 18px;
	}

	.empty-trade {
		color: ${({ colors }) => colors.lighter(colors.gray)};
		text-align: center;
		font-style: italic;
		padding: 24px 12px;
	}

	.acceptance-bar {
		display: flex;
		gap: 12px;
		padding: 12px;
		background: ${({ colors }) => colors.white.setAlpha(0.05)};
		border-bottom: 2px solid ${({ colors }) => colors.white.setAlpha(0.1)};
		margin: -12px -18px 12px -18px;
		align-items: center;
		justify-content: space-between;
	}

	.acceptance-player {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.player-name {
		font-weight: bold;
		font-size: 0.9em;
	}

	.accept-indicator {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 0.85em;
		font-weight: bold;
	}

	.accept-indicator.accepted {
		background: ${({ colors }) => colors.green};
		color: ${({ colors }) => colors.black};
	}

	.accept-indicator.waiting {
		background: ${({ colors }) => colors.gray.setAlpha(0.3)};
		color: ${({ colors }) => colors.lighter(colors.gray)};
	}

	.accept-button {
		padding: 6px 16px;
	}
`) {
	constructor(options = {}) {
		const { otherPlayer, tradeSession } = options;

		super({
			header: `Trade with ${otherPlayer?.name || 'Unknown'}`,
			buttons: ['Close'],
			onButtonPress: () => {
				this.handleClose();
			},
			...options,
		});

		this.otherPlayer = otherPlayer;
		this.currentPlayer = gameContext.players.currentPlayer;
		this.tradeSession = tradeSession;

		// Determine which player we are in the trade
		this.isPlayer1 = tradeSession.player1Id === gameContext.playerId;
		this.myOffer = this.isPlayer1 ? tradeSession.player1Offer : tradeSession.player2Offer;
		this.theirOffer = this.isPlayer1 ? tradeSession.player2Offer : tradeSession.player1Offer;
		this.iAccepted = this.isPlayer1 ? tradeSession.player1Accepted : tradeSession.player2Accepted;
		this.theyAccepted = this.isPlayer1 ? tradeSession.player2Accepted : tradeSession.player1Accepted;

		// Create reactive context for trade state
		this.tradeContext = new Context({
			myOffer: { ...this.myOffer },
			theirOffer: { ...this.theirOffer },
			iAccepted: this.iAccepted,
			theyAccepted: this.theyAccepted,
		});

		// Debounce timer for offer updates
		this.updateDebounceTimer = null;
		this.pendingOffer = null;

		// Component references for updating
		this.myOfferList = null;
		this.theirOfferList = null;
		this.acceptanceBar = null;

		// Set view after initialization is complete
		this.options.view = 'trade';
	}

	handleClose() {
		if (this.tradeSession && this.tradeSession.status === 'active') {
			cancelTrade({ tradeId: this.tradeSession.id }).catch(() => {
				// Ignore errors on close - trade may already be completed/cancelled
			});
		}
		super.handleClose();
	}

	updateFromSocketEvent(trade) {
		console.log('🔄 TradeDialog.updateFromSocketEvent called:', {
			isPlayer1: this.isPlayer1,
			oldMyOffer: this.myOffer,
			oldTheirOffer: this.theirOffer,
			newPlayer1Offer: trade.player1Offer,
			newPlayer2Offer: trade.player2Offer,
		});

		// Update trade session data
		this.tradeSession = trade;
		this.myOffer = this.isPlayer1 ? trade.player1Offer : trade.player2Offer;
		this.theirOffer = this.isPlayer1 ? trade.player2Offer : trade.player1Offer;
		this.iAccepted = this.isPlayer1 ? trade.player1Accepted : trade.player2Accepted;
		this.theyAccepted = this.isPlayer1 ? trade.player2Accepted : trade.player1Accepted;

		console.log('🔄 After update:', {
			myOffer: this.myOffer,
			theirOffer: this.theirOffer,
		});

		console.log('📝 About to update context with:', {
			myOffer: { ...this.myOffer },
			theirOffer: { ...this.theirOffer },
		});

		// Update context to trigger re-render - must be new object reference
		this.tradeContext.myOffer = { ...this.myOffer };
		this.tradeContext.theirOffer = { ...this.theirOffer };
		this.tradeContext.iAccepted = this.iAccepted;
		this.tradeContext.theyAccepted = this.theyAccepted;

		console.log('✅ Context updated. Current context values:', {
			myOffer: this.tradeContext.myOffer,
			theirOffer: this.tradeContext.theirOffer,
			iAccepted: this.tradeContext.iAccepted,
			theyAccepted: this.tradeContext.theyAccepted,
		});

		// Manually update the list components
		if (this.myOfferList) {
			this.myOfferList.options.offer = this.myOffer;
		}
		if (this.theirOfferList) {
			this.theirOfferList.options.offer = this.theirOffer;
		}

		// Update acceptance bar
		this.updateAcceptanceBar();

		console.log('🔄 Updated list components');
	}

	renderAcceptanceBar() {
		this.theirAcceptIndicator = new Elem({
			className: `accept-indicator ${this.theyAccepted ? 'accepted' : 'waiting'}`,
			content: this.theyAccepted ? '✓ Accepted' : 'Not Accepted',
		});

		this.myAcceptButton = new Button({
			className: 'accept-button',
			content: this.iAccepted ? '✓ You Accepted' : 'Accept Trade',
			style: {
				backgroundColor: this.iAccepted ? theme.colors.green : theme.colors.blue,
			},
			onPointerPress: async () => {
				if (!this.iAccepted) {
					try {
						await acceptTrade({ tradeId: this.tradeSession.id });
					} catch (error) {
						new Notify({
							type: 'error',
							content: error.message || 'Failed to accept trade',
						});
					}
				}
			},
			disabled: this.iAccepted,
		});

		return new Elem(
			{ className: 'acceptance-bar' },

			// Other player's status
			new Elem(
				{ className: 'acceptance-player' },
				new Elem({ className: 'player-name', content: this.otherPlayer.name }),
				this.theirAcceptIndicator,
			),

			// Your accept button
			this.myAcceptButton,
		);
	}

	updateAcceptanceBar() {
		console.log('🔄 Updating acceptance bar:', {
			iAccepted: this.iAccepted,
			theyAccepted: this.theyAccepted,
		});

		if (this.theirAcceptIndicator) {
			this.theirAcceptIndicator.elem.className = `accept-indicator ${this.theyAccepted ? 'accepted' : 'waiting'}`;
			this.theirAcceptIndicator.elem.textContent = this.theyAccepted ? '✓ Accepted' : 'Not Accepted';
		}

		if (this.myAcceptButton) {
			this.myAcceptButton.elem.textContent = this.iAccepted ? '✓ You Accepted' : 'Accept Trade';
			this.myAcceptButton.elem.style.backgroundColor = this.iAccepted ? theme.colors.green.toRgbString() : theme.colors.blue.toRgbString();
			this.myAcceptButton.elem.disabled = this.iAccepted;
		}

		console.log('✅ Acceptance bar updated');
	}

	render_trade() {
		// Add acceptance bar at the top
		this._body.append(this.renderAcceptanceBar());

		// Create TradeItemsList components
		this.myOfferList = new TradeItemsList({
			offer: this.tradeContext.myOffer,
			editable: true,
			tradeDialog: this,
		});

		this.theirOfferList = new TradeItemsList({
			offer: this.tradeContext.theirOffer,
			editable: false,
			tradeDialog: this,
		});

		this._body.append(
			new Elem(
				{ className: 'trade-container' },

				// Your Offer (editable)
				new Elem(
					{ className: 'trade-side your-offer' },
					new Elem({ className: 'trade-header', content: 'Your Offer' }),
					this.myOfferList,
					this.renderAddItemSection(),
				),

				// Their Offer (read-only)
				new Elem(
					{ className: 'trade-side their-offer' },
					new Elem({ className: 'trade-header', content: `${this.otherPlayer.name}'s Offer` }),
					this.theirOfferList,
				),
			),
		);
	}


	renderQuantityControls(dataObject, key) {
		const currentValue = dataObject[key] || 0;
		let maxValue;

		if (key === 'credits') {
			maxValue = this.currentPlayer.credits;
		} else if (Object.keys(items).includes(key)) {
			maxValue = this.currentPlayer.items[key] || 0;
		} else {
			maxValue = this.currentPlayer.hull[key] || 0;
		}

		return new Elem(
			{ className: 'quantity-controls' },
			new Button({
				content: '-',
				className: 'quantity-button',
				onPointerPress: async () => {
					if (currentValue > 0) {
						if (currentValue === 1) {
							delete dataObject[key];
						} else {
							dataObject[key] = currentValue - 1;
						}
						await this.sendOfferUpdate();
					}
				},
				disabled: currentValue <= 0,
			}),
			new Input({
				className: 'quantity-input',
				type: 'number',
				min: 0,
				max: maxValue,
				value: currentValue,
				onChange: async ({ value }) => {
					const numValue = parseInt(value, 10) || 0;
					if (numValue <= 0) {
						delete dataObject[key];
					} else {
						dataObject[key] = Math.min(numValue, maxValue);
					}
					await this.sendOfferUpdate();
				},
			}),
			new Button({
				content: '+',
				className: 'quantity-button',
				onPointerPress: async () => {
					if (currentValue < maxValue) {
						dataObject[key] = currentValue + 1;
						await this.sendOfferUpdate();
					}
				},
				disabled: currentValue >= maxValue,
			}),
		);
	}

	renderAddItemSection() {
		return new Elem(
			{ className: 'add-item-section' },

			// Credits section
			new Label(
				'Credits:',
				new Input({
					className: 'credits-input',
					type: 'number',
					min: 0,
					max: this.currentPlayer.credits,
					value: this.tradeContext.myOffer.credits || 0,
					onChange: async ({ value }) => {
						const numValue = parseInt(value, 10) || 0;
						this.tradeContext.myOffer = {
							...this.tradeContext.myOffer,
							credits: Math.max(0, Math.min(numValue, this.currentPlayer.credits)),
						};
						await this.sendOfferUpdate();
					},
				}),
			),

			// Item selection
			new Label(
				'Add Item:',
				new Select({
					options: [
						{ label: 'Select item', value: '' },
						...this.getAvailableItems().map(item => ({
							label: capitalize(item.replaceAll('_', ' '), true),
							value: item,
						})),
					],
					onChange: async ({ value }) => {
						if (value) {
							const currentItems = { ...(this.tradeContext.myOffer.items || {}) };
							currentItems[value] = (currentItems[value] || 0) + 1;
							this.tradeContext.myOffer = {
								...this.tradeContext.myOffer,
								items: currentItems,
							};
							await this.sendOfferUpdate();
						}
					},
				}),
			),

			// Mineral selection
			new Label(
				'Add Mineral:',
				new Select({
					options: [
						{ label: 'Select mineral', value: '' },
						...this.getAvailableMinerals().map(mineral => ({
							label: mineral.startsWith('mineral_')
								? `Pure ${minerals[mineral.replace('mineral_', '')].name}`
								: capitalize(minerals[mineral].name),
							value: mineral,
						})),
					],
					onChange: async ({ value }) => {
						if (value) {
							const currentMinerals = { ...(this.tradeContext.myOffer.minerals || {}) };
							currentMinerals[value] = (currentMinerals[value] || 0) + 1;
							this.tradeContext.myOffer = {
								...this.tradeContext.myOffer,
								minerals: currentMinerals,
							};
							await this.sendOfferUpdate();
						}
					},
				}),
			),
		);
	}

	async sendOfferUpdate() {
		// Clear any existing debounce timer
		if (this.updateDebounceTimer) {
			clearTimeout(this.updateDebounceTimer);
		}

		// Store the current offer as pending
		this.pendingOffer = { ...this.tradeContext.myOffer };

		// Debounce the actual API call
		this.updateDebounceTimer = setTimeout(async () => {
			try {
				await updateTradeOffer({
					tradeId: this.tradeSession.id,
					offer: this.pendingOffer,
				});
			} catch (error) {
				new Notify({
					type: 'error',
					content: error.message || 'Failed to update offer',
				});
			}
		}, 500); // 500ms debounce
	}

	getAvailableItems() {
		if (!this.currentPlayer || !this.currentPlayer.items) return [];
		return Object.keys(this.currentPlayer.items).filter(item => (this.currentPlayer.items[item] || 0) > 0);
	}

	getAvailableMinerals() {
		if (!this.currentPlayer || !this.currentPlayer.hull) return [];
		return Object.keys(this.currentPlayer.hull).filter(mineral => (this.currentPlayer.hull[mineral] || 0) > 0);
	}

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();
			this[`render_${value.toLowerCase()}`]();
		} else {
			super._setOption(key, value);
		}
	}
}
