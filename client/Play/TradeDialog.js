import { Button, Elem, Input, Label, Select, capitalize, styled, theme, Context } from 'vanilla-bean-components';

import { MineralImage, ItemImage } from '../shared/SpriteSheetImage';
import { Card } from '../shared/Card';
import { initiateTrade, respondToTrade, cancelTrade } from '../api';
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

export default class TradeDialog extends (styled(BaseDialog)`
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

	.menu {
		display: flex;
		flex-wrap: wrap-reverse;
		gap: 6px;
		margin: 6px;

		button {
			flex: 1;
		}

		button:disabled {
			background: transparent;

			&:before {
				content: '';
				background-color: ${({ colors }) => colors.white.setAlpha(0.02)};
				width: calc(100% - 3px);
				height: calc(100% + 17px);
				position: absolute;
				top: -12px;
				left: -3px;
			}

			&:after {
				content: none;
			}
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

		super({
			header: pendingTrade
				? `Trade Request from ${targetPlayer?.name || 'Unknown'}`
				: `Trade with ${targetPlayer?.name || 'Unknown'}`,
			buttons: pendingTrade ? [] : ['Close'],
			view: pendingTrade ? 'pending' : 'create',
			onButtonPress: () => {
				this.handleClose();
			},
			...options,
		});

		this.targetPlayer = targetPlayer;
		this.currentPlayer = gameContext.players.currentPlayer;
		this.pendingTrade = pendingTrade;
		this.activeTrade = pendingTrade;

		// Create reactive context for trade state
		this.tradeContext = new Context({
			offer: {
				credits: pendingTrade?.request?.credits || 0,
				items: { ...(pendingTrade?.request?.items || {}) },
				minerals: { ...(pendingTrade?.request?.minerals || {}) },
			},
			request: {
				credits: pendingTrade?.offer?.credits || 0,
				items: { ...(pendingTrade?.offer?.items || {}) },
				minerals: { ...(pendingTrade?.offer?.minerals || {}) },
			},
		});
	}

	handleClose() {
		if (this.activeTrade && !this.pendingTrade) {
			cancelTrade({ tradeId: this.activeTrade.id });
		}
		super.handleClose();
	}

	renderMenu() {
		if (this.pendingTrade) {
			// No menu needed for pending trades
			return;
		}

		new Elem(
			{ className: 'menu', appendTo: this._body },
			['Offer', 'Request'].map(
				view =>
					new Button({
						content: `Your ${view}`,
						onPointerPress: () => {
							this.options.view = view.toLowerCase();
						},
						disabled: this.options.view === view.toLowerCase(),
					}),
			),
		);

		this._menuBody = new Elem({ className: 'menuBody', appendTo: this._body });
	}

	render_pending() {
		// Show what they're offering vs what they want
		new Elem(
			{ className: 'trade-container', appendTo: this._body },

			// What they're offering (what we'd receive)
			new Card({
				header: `${this.targetPlayer.name} offers:`,
				style: {
					flex: '1',
					border: `2px solid ${theme.colors.green.setAlpha(0.3)}`,
				},
				body: this.renderTradeItems(this.tradeContext.request, false),
			}),

			// What they want (what we'd give)
			new Card({
				header: `${this.targetPlayer.name} wants:`,
				style: {
					flex: '1',
					border: `2px solid ${theme.colors.blue.setAlpha(0.3)}`,
				},
				body: this.renderTradeItems(this.tradeContext.offer, false),
			}),
		);

		// Action buttons for pending trade
		new Elem(
			{ className: 'pending-actions', appendTo: this._body },
			new Elem({
				className: 'pending-message',
				content: 'Do you accept this trade?',
			}),
			new Elem(
				{ style: { display: 'flex', gap: '12px', justifyContent: 'center' } },
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

	render_create() {
		this.options.view = 'offer';
	}

	render_offer() {
		this.renderMenu();

		this._menuBody.append(
			new Card({
				header: 'Items You Will Give',
				body: new Elem({
					append: [this.renderTradeItems(this.tradeContext.offer, true, 'offer'), this.renderAddItemSection('offer')],
				}),
			}),

			new Button({
				content: 'Send Trade Offer',
				style: {
					backgroundColor: theme.colors.green,
					marginTop: '12px',
					width: '100%',
				},
				onPointerPress: () => this.sendTradeOffer(),
				disabled: this.tradeContext.subscriber(
					['offer', 'request'],
					(offer, request) => !this.isValidTrade(offer, request),
				),
			}),
		);
	}

	render_request() {
		this.renderMenu();

		this._menuBody.append(
			new Card({
				header: 'Items You Want to Receive',
				body: new Elem({
					append: [
						this.renderTradeItems(this.tradeContext.request, true, 'request'),
						this.renderAddItemSection('request'),
					],
				}),
			}),

			new Button({
				content: 'Send Trade Offer',
				style: {
					backgroundColor: theme.colors.green,
					marginTop: '12px',
					width: '100%',
				},
				onPointerPress: () => this.sendTradeOffer(),
				disabled: this.tradeContext.subscriber(
					['offer', 'request'],
					(offer, request) => !this.isValidTrade(offer, request),
				),
			}),
		);
	}

	renderTradeItems(tradeData, editable = false, section = null) {
		const container = new Elem({ className: 'trade-items' });

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
					editable &&
						new Elem({
							className: 'item-available',
							content: `Available: ${this.getAvailableCredits(section)}`,
						}),
				),
				editable
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
					editable &&
						new Elem({
							className: 'item-available',
							content: `Available: ${this.getAvailableQuantity(itemName, 'items', section)}`,
						}),
				),
				editable
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
					editable &&
						new Elem({
							className: 'item-available',
							content: `Available: ${this.getAvailableQuantity(mineralName, 'minerals', section)}`,
						}),
				),
				editable
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
				content: editable ? 'Add items below' : 'Nothing offered',
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
						// Trigger reactive update
						this.tradeContext[section] = { ...this.tradeContext[section] };
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
					// Trigger reactive update
					this.tradeContext[section] = { ...this.tradeContext[section] };
				},
			}),
			new Button({
				content: '+',
				className: 'quantity-button',
				onPointerPress: () => {
					if (currentValue < maxValue) {
						dataObject[key] = currentValue + 1;
						// Trigger reactive update
						this.tradeContext[section] = { ...this.tradeContext[section] };
					}
				},
				disabled: currentValue >= maxValue,
			}),
		);
	}

	renderAddItemSection(section) {
		const tradeData = this.tradeContext[section];

		return new Elem(
			{ className: 'add-item-section' },

			// Credits section
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
						const maxCredits = this.getMaxQuantity('credits', 'credits', section);
						this.tradeContext[section] = {
							...this.tradeContext[section],
							credits: Math.max(0, Math.min(numValue, maxCredits)),
						};
					},
				}),
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
							const currentItems = { ...this.tradeContext[section].items };
							currentItems[value] = (currentItems[value] || 0) + 1;
							this.tradeContext[section] = {
								...this.tradeContext[section],
								items: currentItems,
							};
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
							const currentMinerals = { ...this.tradeContext[section].minerals };
							currentMinerals[value] = (currentMinerals[value] || 0) + 1;
							this.tradeContext[section] = {
								...this.tradeContext[section],
								minerals: currentMinerals,
							};
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

	isValidTrade(offer, request) {
		const hasOffer =
			(offer?.credits || 0) > 0 ||
			Object.values(offer?.items || {}).some(q => q > 0) ||
			Object.values(offer?.minerals || {}).some(q => q > 0);

		const hasRequest =
			(request?.credits || 0) > 0 ||
			Object.values(request?.items || {}).some(q => q > 0) ||
			Object.values(request?.minerals || {}).some(q => q > 0);

		return hasOffer && hasRequest;
	}

	async sendTradeOffer() {
		const offer = this.tradeContext.offer;
		const request = this.tradeContext.request;

		if (!this.isValidTrade(offer, request)) {
			new Notify({
				type: 'error',
				content: 'Both players must offer something in the trade',
			});
			return;
		}

		try {
			const result = await initiateTrade({
				targetPlayerId: this.targetPlayer.id,
				offer,
				request,
			});

			if (result.tradeId) {
				new Notify({
					type: 'success',
					content: 'Trade offer sent! Waiting for response...',
				});
				this.activeTrade = { id: result.tradeId };
				this.close();
			} else {
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

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();

			if (this.pendingTrade) {
				this.render_pending();
			} else {
				this.renderMenu();
				this[`render_${value.toLowerCase()}`]();
			}
		} else {
			super._setOption(key, value);
		}
	}
}
