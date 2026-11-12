import {
	Button,
	Content,
	Elem,
	EmptyState,
	Icon,
	Input,
	Label,
	SectionLabel,
	Select,
	capitalize,
	debounce,
	styled,
	Oxject as Context,
	theme,
} from '@vanilla-bean/components';

import { MineralImage, ItemImage } from '../shared/SpriteSheetImage';
import { act } from '@fatlard1993/web-game-framework/client';
import BaseDialog from '../shared/BaseDialog';
import { subPanelOptions } from '../shared/frame';
import gameContext from '../shared/gameContext';
import { minerals } from '../../constants';

const TradeItemRow = styled.Component`
	display: flex;
	align-items: center;
	gap: ${({ space }) => space.md};
	padding: ${({ space }) => space.sm};
	background: ${({ colors }) => colors.alpha(colors.white, 0.02)};
	border-radius: ${({ radius }) => radius.sm};
	margin-bottom: ${({ space }) => space.sm};

	& .item-image {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	& .item-info {
		flex: 1;
		min-width: 0;
	}

	& .item-name {
		font-weight: bold;
		font-size: ${theme.fontSize.sm};
	}

	& .item-available {
		font-size: ${theme.fontSize.sm};
		color: ${({ colors }) => colors.muted};
		margin-top: ${({ space }) => space.xs};
	}

	& .quantity-controls {
		display: flex;
		align-items: center;
		gap: ${({ space }) => space.sm};
		flex-shrink: 0;
	}

	& .quantity-input {
		width: 60px;
		text-align: center;
	}

	& .quantity-button {
		width: 32px;
		height: 32px;
		font-size: ${theme.fontSize.sm};
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
`;

class TradeItemsList extends (styled(Content)`
	flex: 1;
	max-height: 280px;
	margin-bottom: ${({ space }) => space.md};
`) {
	build() {
		const { offer, editable, tradeDialog } = this.options;
		this.renderContent(offer, editable, tradeDialog);
	}

	static schema = {
		offer: {
			set(value) {
				if (this.elem) {
					this.elem.innerHTML = '';
					const { editable, tradeDialog } = this.options;
					this.renderContent(value, editable, tradeDialog);
				}
			},
		},
		editable: {},
		tradeDialog: {},
	};

	renderContent(offer, editable, tradeDialog) {
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
						? tradeDialog.renderQuantityControls(null, 'credits', 'Credits')
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
						? tradeDialog.renderQuantityControls('items', itemName, capitalize(itemName.replaceAll('_', ' '), true))
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
						? tradeDialog.renderQuantityControls('minerals', mineralName, capitalize(displayName))
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
				new EmptyState({
					icon: 'box-open',
					title: 'Nothing offered',
					message: editable ? 'Add items below.' : '',
				}),
			);
		}
	}
}

export default class TradeDialog extends (styled(BaseDialog)`
	& .trade-container {
		display: flex;
		gap: ${({ space }) => space.md};
		min-height: 400px;

		@media ${({ media }) => media.phone} {
			flex-direction: column;
		}
	}

	& .trade-side {
		flex: 1;
		padding: ${({ space }) => space.md};
		display: flex;
		flex-direction: column;
	}

	& .add-item-section {
		border-top: 1px solid ${({ colors }) => colors.border};
		padding-top: ${({ space }) => space.md};
		margin-top: auto;
	}

	& .credits-section {
		display: flex;
		align-items: center;
		gap: ${({ space }) => space.sm};
		margin-bottom: ${({ space }) => space.md};
	}

	& .credits-input {
		flex: 1;
		min-width: 80px;
	}

	& .menu {
		display: flex;
		gap: ${({ space }) => space.sm};
		margin: ${({ space }) => space.sm};
		justify-content: space-between;
		align-items: center;

		& .left-buttons {
			display: flex;
			gap: ${({ space }) => space.sm};
		}

		& .right-buttons {
			display: flex;
			gap: ${({ space }) => space.sm};
		}
	}

	& .menuBody {
		background-color: ${({ colors }) => colors.alpha(colors.white, 0.04)};
		padding: ${({ space }) => `${space.md} ${space.lg}`};
	}

	& .acceptance-bar {
		display: flex;
		gap: ${({ space }) => space.md};
		padding: ${({ space }) => space.md};
		background: ${({ colors }) => colors.alpha(colors.white, 0.05)};
		border-bottom: 2px solid ${({ colors }) => colors.border};
		margin: calc(-1 * var(--content-pad-block)) calc(-1 * var(--content-pad-inline)) ${({ space }) => space.md};
		align-items: center;
		justify-content: space-between;

		@media ${({ media }) => media.phone} {
			flex-wrap: wrap;
		}
	}

	& .acceptance-player {
		flex: 1;
		display: flex;
		align-items: center;
		gap: ${({ space }) => space.sm};
	}

	& .player-name {
		font-weight: bold;
		font-size: ${theme.fontSize.sm};
	}

	& .accept-indicator {
		display: inline-flex;
		align-items: center;
		gap: ${({ space }) => space.xs};
		padding: ${({ space }) => `${space.xs} ${space.md}`};
		border-radius: ${({ radius }) => radius.sm};
		font-size: ${theme.fontSize.sm};
		font-weight: bold;
	}

	& .accept-indicator.accepted {
		background: ${({ colors }) => colors.success};
		color: ${({ colors }) => colors.black};
	}

	& .accept-indicator.waiting {
		background: ${({ colors }) => colors.alpha(colors.gray, 0.3)};
		color: ${({ colors }) => colors.muted};
	}

	& .accept-button {
		padding: ${({ space }) => `${space.sm} ${space.lg}`};

		@media ${({ media }) => media.phone} {
			/* Improve button rendering on mobile by using simpler styles */
			box-shadow: none;
			border: 1px solid ${({ colors }) => colors.alpha(colors.white, 0.2)};
		}
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

		// Rapid edits to the offer reach the server once they settle
		this.sendOffer = debounce(offer => act('updateTradeOffer', { tradeId: this.tradeSession.id, offer }), 500);

		// Component references for updating
		this.myOfferList = null;
		this.theirOfferList = null;
		this.acceptanceBar = null;

		// Set view after initialization is complete
		this.options.view = 'trade';
	}

	handleClose() {
		if (this.tradeSession && this.tradeSession.status === 'active') {
			// Quiet: the trade may already be completed or cancelled
			act('cancelTrade', { tradeId: this.tradeSession.id }, { quiet: true });
		}
		super.handleClose();
	}

	updateFromSocketEvent(trade) {
		// Update trade session data
		this.tradeSession = trade;
		this.myOffer = this.isPlayer1 ? trade.player1Offer : trade.player2Offer;
		this.theirOffer = this.isPlayer1 ? trade.player2Offer : trade.player1Offer;
		this.iAccepted = this.isPlayer1 ? trade.player1Accepted : trade.player2Accepted;
		this.theyAccepted = this.isPlayer1 ? trade.player2Accepted : trade.player1Accepted;

		// Update context to trigger re-render - must be new object reference
		this.tradeContext.myOffer = { ...this.myOffer };
		this.tradeContext.theirOffer = { ...this.theirOffer };
		this.tradeContext.iAccepted = this.iAccepted;
		this.tradeContext.theyAccepted = this.theyAccepted;

		if (this.myOfferList) this.myOfferList.options.offer = this.tradeContext.myOffer;
		if (this.theirOfferList) this.theirOfferList.options.offer = this.tradeContext.theirOffer;

		// Update acceptance bar
		this.updateAcceptanceBar();
	}

	renderAcceptanceBar() {
		this.theirAcceptIndicator = new Icon({
			className: `accept-indicator ${this.theyAccepted ? 'accepted' : 'waiting'}`,
			icon: this.theyAccepted ? 'check' : undefined,
			textContent: this.theyAccepted ? 'Accepted' : 'Not Accepted',
		});

		this.myAcceptButton = new Button({
			className: 'accept-button',
			icon: this.iAccepted ? 'check' : undefined,
			textContent: this.iAccepted ? 'You Accepted' : 'Accept Trade',
			onPointerPress: () => {
				if (!this.iAccepted) act('acceptTrade', { tradeId: this.tradeSession.id });
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
		if (this.theirAcceptIndicator) {
			this.theirAcceptIndicator.elem.classList.toggle('accepted', this.theyAccepted);
			this.theirAcceptIndicator.elem.classList.toggle('waiting', !this.theyAccepted);
			this.theirAcceptIndicator.options.icon = this.theyAccepted ? 'check' : undefined;
			this.theirAcceptIndicator.options.textContent = this.theyAccepted ? 'Accepted' : 'Not Accepted';
		}

		if (this.myAcceptButton) {
			this.myAcceptButton.options.icon = this.iAccepted ? 'check' : undefined;
			this.myAcceptButton.options.textContent = this.iAccepted ? 'You Accepted' : 'Accept Trade';
			this.myAcceptButton.options.disabled = this.iAccepted;
		}
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
					{ className: 'trade-side your-offer', ...subPanelOptions },
					new SectionLabel({ textContent: 'Your Offer' }),
					this.myOfferList,
					this.renderAddItemSection(),
				),

				// Their Offer (read-only)
				new Elem(
					{ className: 'trade-side their-offer', ...subPanelOptions },
					new SectionLabel({ textContent: `${this.otherPlayer.name}'s Offer` }),
					this.theirOfferList,
				),
			),
		);
	}

	// How much of a key the offer holds: credits at the root, items and minerals in their sections
	offered(section, key) {
		return (section ? this.tradeContext.myOffer[section]?.[key] : this.tradeContext.myOffer.credits) || 0;
	}

	// The offer is replaced, not mutated: the list redraws now, the server hears once the edits settle
	setOffered(section, key, value) {
		const offer = { ...this.tradeContext.myOffer };

		if (section) {
			offer[section] = { ...offer[section] };
			if (value > 0) offer[section][key] = value;
			else delete offer[section][key];
		} else offer.credits = value;

		this.tradeContext.myOffer = offer;
		if (this.myOfferList) this.myOfferList.options.offer = offer;
		this.sendOffer(offer);
	}

	renderQuantityControls(section, key, name) {
		const current = this.offered(section, key);
		const maxValue = section
			? this.currentPlayer[section === 'items' ? 'items' : 'hull'][key] || 0
			: this.currentPlayer.credits;
		const set = value => this.setOffered(section, key, Math.max(0, Math.min(value, maxValue)));

		return new Elem(
			{ className: 'quantity-controls' },
			new Button({
				content: '-',
				className: 'quantity-button',
				onPointerPress: () => set(this.offered(section, key) - 1),
				disabled: current <= 0,
			}),
			new Input({
				className: 'quantity-input',
				type: 'number',
				'aria-label': `Quantity of ${name}`,
				min: 0,
				max: maxValue,
				value: current,
				onChange: ({ value }) => set(parseInt(value, 10) || 0),
			}),
			new Button({
				content: '+',
				className: 'quantity-button',
				onPointerPress: () => set(this.offered(section, key) + 1),
				disabled: current >= maxValue,
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
					onChange: ({ value }) => {
						const credits = parseInt(value, 10) || 0;
						this.setOffered(null, 'credits', Math.max(0, Math.min(credits, this.currentPlayer.credits)));
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
					onChange: ({ value }) => {
						if (value) this.setOffered('items', value, this.offered('items', value) + 1);
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
					onChange: ({ value }) => {
						if (value) this.setOffered('minerals', value, this.offered('minerals', value) + 1);
					},
				}),
			),
		);
	}

	getAvailableItems() {
		if (!this.currentPlayer || !this.currentPlayer.items) return [];
		return Object.keys(this.currentPlayer.items).filter(item => (this.currentPlayer.items[item] || 0) > 0);
	}

	getAvailableMinerals() {
		if (!this.currentPlayer || !this.currentPlayer.hull) return [];
		return Object.keys(this.currentPlayer.hull).filter(mineral => (this.currentPlayer.hull[mineral] || 0) > 0);
	}

	static schema = {
		view: {
			set(value) {
				this._body.empty();
				this[`render_${value.toLowerCase()}`]();
			},
		},
	};
}
