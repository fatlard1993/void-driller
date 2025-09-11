import { Button, Elem, Input, Label, Select, capitalize, styled, theme } from 'vanilla-bean-components';

import { MineralImage, ItemImage } from '../shared/SpriteSheetImage';
import { initiateTrade, respondToTrade, cancelTrade } from '../api';
import gameContext from '../shared/gameContext';
import { minerals, items } from '../../constants';
import Notify from '../shared/Notify';

const TradeItemRow = styled.Component`
	@media (max-width: 768px) {
		height: 90vh !important;
		width: 90vh !important;
	}

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

export default class TradeDialog extends (styled.Dialog`
	.trade-container {
		display: flex;
		gap: 12px;
		height: 400px;
	}

	.trade-side {
		flex: 1;
		border: 2px solid ${({ colors }) => colors.white.setAlpha(0.1)};
		border-radius: 6px;
		padding: 12px;
		background: ${({ colors }) => colors.white.setAlpha(0.02)};
	}

	.trade-side.offering {
		border-color: ${({ colors }) => colors.blue.setAlpha(0.3)};
	}

	.trade-side.requesting {
		border-color: ${({ colors }) => colors.green.setAlpha(0.3)};
	}

	.trade-side.pending {
		border-color: ${({ colors }) => colors.yellow.setAlpha(0.5)};
		background: ${({ colors }) => colors.yellow.setAlpha(0.05)};
	}

	.trade-header {
		font-weight: bold;
		margin-bottom: 12px;
		padding-bottom: 6px;
		border-bottom: 1px solid ${({ colors }) => colors.white.setAlpha(0.1)};
	}

	.trade-items {
		max-height: 280px;
		overflow-y: auto;
		margin-bottom: 12px;
	}

	.add-item-section {
		border-top: 1px solid ${({ colors }) => colors.white.setAlpha(0.1)};
		padding-top: 12px;
		margin-top: 12px;
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

	.trade-actions {
		display: flex;
		gap: 6px;
		justify-content: center;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid ${({ colors }) => colors.white.setAlpha(0.1)};
	}

	.empty-trade {
		color: ${({ colors }) => colors.lighter(colors.gray)};
		text-align: center;
		font-style: italic;
		padding: 24px 12px;
	}

	.trade-summary {
		background: ${({ colors }) => colors.white.setAlpha(0.05)};
		border: 1px solid ${({ colors }) => colors.white.setAlpha(0.1)};
		border-radius: 3px;
		padding: 12px;
		margin: 12px 0;
	}

	.pending-actions {
		background: ${({ colors }) => colors.yellow.setAlpha(0.1)};
		border: 2px solid ${({ colors }) => colors.yellow.setAlpha(0.3)};
		border-radius: 6px;
		padding: 12px;
		margin-top: 12px;
		text-align: center;
	}

	.pending-message {
		color: ${({ colors }) => colors.yellow};
		font-weight: bold;
		margin-bottom: 12px;
	}
`) {
	constructor(options = {}) {
		const { targetPlayer, pendingTrade } = options;
		const currentPlayer = gameContext.players.currentPlayer;

		super({
			header: pendingTrade
				? `Trade Request from ${targetPlayer?.name || 'Unknown'}`
				: `Trade with ${targetPlayer?.name || 'Unknown'}`,
			buttons: pendingTrade ? [] : ['Cancel'],
			onButtonPress: () => {
				if (this.activeTrade) {
					cancelTrade({ tradeId: this.activeTrade.id });
				}
				this.close();
			},
			...options,
		});

		this.targetPlayer = targetPlayer;
		this.currentPlayer = currentPlayer;
		this.pendingTrade = pendingTrade;
		this.activeTrade = pendingTrade;

		// Initialize trade state with proper defaults
		this.offer = {
			credits: 0,
			items: {},
			minerals: {},
		};

		this.request = {
			credits: 0,
			items: {},
			minerals: {},
		};

		// If we have a pending trade, populate the request/offer from it
		if (pendingTrade) {
			// What we're offering is what they requested from us
			this.offer = {
				credits: pendingTrade.request?.credits || 0,
				items: { ...(pendingTrade.request?.items || {}) },
				minerals: { ...(pendingTrade.request?.minerals || {}) },
			};
			// What we're requesting is what they offered to us
			this.request = {
				credits: pendingTrade.offer?.credits || 0,
				items: { ...(pendingTrade.offer?.items || {}) },
				minerals: { ...(pendingTrade.offer?.minerals || {}) },
			};
		}
	}

	render() {
		super.render();

		if (this.pendingTrade) {
			this.renderPendingTrade();
		} else {
			this.renderTradeCreation();
		}
	}

	renderPendingTrade() {
		// Show what they're offering vs what they want
		new Elem(
			{ className: 'trade-container', appendTo: this._body },

			// What they're offering (what we'd receive)
			new Elem(
				{ className: 'trade-side requesting' },
				new Elem({
					className: 'trade-header',
					content: `${this.targetPlayer.name} offers:`,
				}),
				this.renderTradeItems(this.request, 'static'),
			),

			// What they want (what we'd give)
			new Elem(
				{ className: 'trade-side offering' },
				new Elem({
					className: 'trade-header',
					content: `${this.targetPlayer.name} wants:`,
				}),
				this.renderTradeItems(this.offer, 'static'),
			),
		);

		// Action buttons for pending trade
		new Elem(
			{ className: 'pending-actions', appendTo: this._body },
			new Elem({
				className: 'pending-message',
				content: 'Do you accept this trade?',
			}),
			new Elem(
				{ className: 'trade-actions' },
				new Button({
					content: 'Accept Trade',
					style: { backgroundColor: theme.colors.green },
					onPointerPress: async () => {
						try {
							await respondToTrade({
								tradeId: this.pendingTrade.id,
								accept: true,
							});
							this.close();
						} catch (error) {
							new Notify({
								type: 'error',
								content: error.message || 'Failed to accept trade',
							});
						}
					},
				}),
				new Button({
					content: 'Decline Trade',
					style: { backgroundColor: theme.colors.red },
					onPointerPress: async () => {
						try {
							await respondToTrade({
								tradeId: this.pendingTrade.id,
								accept: false,
							});
							this.close();
						} catch (error) {
							new Notify({
								type: 'error',
								content: error.message || 'Failed to decline trade',
							});
						}
					},
				}),
			),
		);
	}

	renderTradeCreation() {
		new Elem(
			{ className: 'trade-container', appendTo: this._body },

			// What we're offering
			new Elem(
				{ className: 'trade-side offering' },
				new Elem({
					className: 'trade-header',
					content: 'You offer:',
				}),
				this.renderTradeItems(this.offer, 'editable', 'offer'),
				this.renderAddItemSection('offer'),
			),

			// What we want
			new Elem(
				{ className: 'trade-side requesting' },
				new Elem({
					className: 'trade-header',
					content: 'You request:',
				}),
				this.renderTradeItems(this.request, 'editable', 'request'),
				this.renderAddItemSection('request'),
			),
		);

		// Trade action buttons
		new Elem(
			{ className: 'trade-actions', appendTo: this._body },
			new Button({
				content: 'Send Trade Offer',
				style: { backgroundColor: theme.colors.green },
				onPointerPress: () => this.sendTradeOffer(),
				disabled: !this.isValidTrade(),
			}),
			new Button({
				content: 'Cancel',
				onPointerPress: () => this.close(),
			}),
		);
	}

	renderTradeItems(tradeData, mode = 'static', section = null) {
		const container = new Elem({ className: 'trade-items' });

		// Ensure tradeData has proper structure
		if (!tradeData) {
			tradeData = { credits: 0, items: {}, minerals: {} };
		}

		let hasItems = false;

		// Credits
		if ((tradeData.credits || 0) > 0) {
			hasItems = true;
			new TradeItemRow(
				{ appendTo: container },
				new Elem({
					className: 'item-image',
					content: '$',
					style: {
						backgroundColor: theme.colors.yellow,
						color: theme.colors.black,
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontWeight: 'bold',
					},
				}),
				new Elem(
					{ className: 'item-info' },
					new Elem({ className: 'item-name', content: 'Credits' }),
					mode === 'editable' &&
						new Elem({
							className: 'item-available',
							content: `Available: ${this.getAvailableCredits(section)}`,
						}),
				),
				mode === 'editable'
					? this.renderQuantityControls(tradeData, 'credits', section)
					: new Elem({
							content: tradeData.credits.toString(),
							style: { fontWeight: 'bold', minWidth: '40px', textAlign: 'right' },
						}),
			);
		}

		// Items
		Object.entries(tradeData.items || {}).forEach(([itemName, quantity]) => {
			if (quantity <= 0) return;
			hasItems = true;

			new TradeItemRow(
				{ appendTo: container },
				new ItemImage(itemName, { className: 'item-image' }),
				new Elem(
					{ className: 'item-info' },
					new Elem({
						className: 'item-name',
						content: capitalize(itemName.replaceAll('_', ' '), true),
					}),
					mode === 'editable' &&
						new Elem({
							className: 'item-available',
							content: `Available: ${this.getAvailableQuantity(itemName, 'items', section)}`,
						}),
				),
				mode === 'editable'
					? this.renderQuantityControls(tradeData.items, itemName, section)
					: new Elem({
							content: `x${quantity}`,
							style: { fontWeight: 'bold', minWidth: '40px', textAlign: 'right' },
						}),
			);
		});

		// Minerals
		Object.entries(tradeData.minerals || {}).forEach(([mineralName, quantity]) => {
			if (quantity <= 0) return;
			hasItems = true;

			const displayName = mineralName.startsWith('mineral_')
				? `Pure ${minerals[mineralName.replace('mineral_', '')].name}`
				: minerals[mineralName].name;

			new TradeItemRow(
				{ appendTo: container },
				new MineralImage(mineralName.replace('mineral_', ''), { className: 'item-image' }),
				new Elem(
					{ className: 'item-info' },
					new Elem({ className: 'item-name', content: capitalize(displayName) }),
					mode === 'editable' &&
						new Elem({
							className: 'item-available',
							content: `Available: ${this.getAvailableQuantity(mineralName, 'minerals', section)}`,
						}),
				),
				mode === 'editable'
					? this.renderQuantityControls(tradeData.minerals, mineralName, section)
					: new Elem({
							content: `x${quantity}`,
							style: { fontWeight: 'bold', minWidth: '40px', textAlign: 'right' },
						}),
			);
		});

		if (!hasItems) {
			new Elem({
				className: 'empty-trade',
				content: mode === 'editable' ? 'Add items below' : 'Nothing offered',
				appendTo: container,
			});
		}

		return container;
	}

	renderQuantityControls(dataObject, key, section) {
		const currentValue = dataObject[key] || 0;
		let resourceType;
		if (key === 'credits') {
			resourceType = 'credits';
		} else if (Object.keys(items).includes(key)) {
			resourceType = 'items';
		} else {
			resourceType = 'minerals';
		}

		const maxValue = this.getMaxQuantity(key, resourceType, section);

		return new Elem(
			{ className: 'quantity-controls' },
			new Button({
				content: '-',
				className: 'quantity-button',
				onPointerPress: () => {
					if (currentValue > 0) {
						if (currentValue === 1) {
							delete dataObject[key];
						} else {
							dataObject[key] = currentValue - 1;
						}
						this.refresh();
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
				onChange: ({ value }) => {
					const numValue = parseInt(value, 10) || 0;
					if (numValue <= 0) {
						delete dataObject[key];
					} else {
						dataObject[key] = Math.min(numValue, maxValue);
					}
					this.refresh();
				},
			}),
			new Button({
				content: '+',
				className: 'quantity-button',
				onPointerPress: () => {
					if (currentValue < maxValue) {
						dataObject[key] = currentValue + 1;
						this.refresh();
					}
				},
				disabled: currentValue >= maxValue,
			}),
		);
	}

	renderAddItemSection(section) {
		const tradeData = section === 'offer' ? this.offer : this.request;

		return new Elem(
			{ className: 'add-item-section' },

			// Credits section
			new Elem(
				{ className: 'credits-section' },
				new Label(
					'Credits:',
					new Input({
						className: 'credits-input',
						type: 'number',
						min: 0,
						max: this.getMaxQuantity('credits', 'credits', section),
						value: tradeData.credits || 0,
						onChange: ({ value }) => {
							const numValue = parseInt(value, 10) || 0;
							if (numValue <= 0) {
								tradeData.credits = 0;
							} else {
								tradeData.credits = Math.min(numValue, this.getMaxQuantity('credits', 'credits', section));
							}
							this.refresh();
						},
					}),
				),
			),

			// Item selection
			new Label(
				'Add Item:',
				new Select({
					options: [
						{ label: 'Select item', value: '' },
						...this.getAvailableItems(section).map(item => ({
							label: capitalize(item.replaceAll('_', ' '), true),
							value: item,
						})),
					],
					onChange: ({ value }) => {
						if (value) {
							if (!tradeData.items) tradeData.items = {};
							tradeData.items[value] = (tradeData.items[value] || 0) + 1;
							this.refresh();
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
						...this.getAvailableMinerals(section).map(mineral => ({
							label: mineral.startsWith('mineral_')
								? `Pure ${minerals[mineral.replace('mineral_', '')].name}`
								: capitalize(minerals[mineral].name),
							value: mineral,
						})),
					],
					onChange: ({ value }) => {
						if (value) {
							if (!tradeData.minerals) tradeData.minerals = {};
							tradeData.minerals[value] = (tradeData.minerals[value] || 0) + 1;
							this.refresh();
						}
					},
				}),
			),
		);
	}

	getAvailableItems(section) {
		const sourcePlayer = section === 'offer' ? this.currentPlayer : this.targetPlayer;
		if (!sourcePlayer || !sourcePlayer.items) return [];

		return Object.keys(sourcePlayer.items).filter(item => (sourcePlayer.items[item] || 0) > 0);
	}

	getAvailableMinerals(section) {
		const sourcePlayer = section === 'offer' ? this.currentPlayer : this.targetPlayer;
		if (!sourcePlayer || !sourcePlayer.hull) return [];

		return Object.keys(sourcePlayer.hull).filter(mineral => (sourcePlayer.hull[mineral] || 0) > 0);
	}

	getAvailableQuantity(key, type, section) {
		const sourcePlayer = section === 'offer' ? this.currentPlayer : this.targetPlayer;
		if (!sourcePlayer) return 0;

		if (type === 'items') {
			return sourcePlayer.items?.[key] || 0;
		} else if (type === 'minerals') {
			return sourcePlayer.hull?.[key] || 0;
		}
		return 0;
	}

	getAvailableCredits(section) {
		const sourcePlayer = section === 'offer' ? this.currentPlayer : this.targetPlayer;
		return sourcePlayer?.credits || 0;
	}

	getMaxQuantity(key, type, section) {
		if (type === 'credits') {
			return this.getAvailableCredits(section);
		}
		return this.getAvailableQuantity(key, type, section);
	}

	isValidTrade() {
		const hasOffer =
			(this.offer.credits || 0) > 0 ||
			Object.values(this.offer.items || {}).some(q => q > 0) ||
			Object.values(this.offer.minerals || {}).some(q => q > 0);

		const hasRequest =
			(this.request.credits || 0) > 0 ||
			Object.values(this.request.items || {}).some(q => q > 0) ||
			Object.values(this.request.minerals || {}).some(q => q > 0);

		return hasOffer && hasRequest;
	}

	async sendTradeOffer() {
		if (!this.isValidTrade()) {
			new Notify({
				type: 'error',
				content: 'Both players must offer something in the trade',
			});
			return;
		}

		try {
			const result = await initiateTrade({
				targetPlayerId: this.targetPlayer.id,
				offer: this.offer,
				request: this.request,
			});

			// For successful HTTP responses (200), the result will contain the tradeId
			if (result.tradeId) {
				new Notify({
					type: 'success',
					content: 'Trade offer sent! Waiting for response...',
				});
				this.activeTrade = { id: result.tradeId };
				this.close();
			} else {
				// Handle case where server returned an error message
				new Notify({
					type: 'error',
					content: result.message || 'Failed to send trade offer',
				});
			}
		} catch (error) {
			new Notify({
				type: 'error',
				content: error.message || 'Failed to send trade offer',
			});
		}
	}

	refresh() {
		this._body.empty();
		if (this.pendingTrade) {
			this.renderPendingTrade();
		} else {
			this.renderTradeCreation();
		}
	}
}
