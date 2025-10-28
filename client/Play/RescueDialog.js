import { Elem, Button, capitalize, theme, styled } from 'vanilla-bean-components';

import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { exitGame, spacecoBuyRescue, useItem } from '../api';
import Notify from '../shared/Notify';
import { Card } from '../shared/Card';
import { CardGrid } from '../shared/CardGrid';
import { ItemImage } from '../shared/SpriteSheetImage';
import { DescriptionText } from '../shared/DescriptionText';
import { items, engines } from '../../constants';

export default class RescueDialog extends (styled(BaseDialog)`
	button {
		white-space: initial;
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

	p.description {
		color: ${({ colors }) => colors.lighter(colors.gray)};
		border-left: 3px solid;
		padding-left: 6px;
		word-wrap: break-word;
	}
`) {
	constructor(options = {}) {
		super({
			header: 'Spaceco Rescue',
			view: 'rescue',
			...options,
		});
	}

	renderMenu() {
		new Elem(
			{ className: 'menu', appendTo: this._body },
			['Rescue', 'Inventory'].map(
				view =>
					new Button({
						content: view,
						onPointerPress: () => {
							this.options.view = view.toLowerCase();
						},
						disabled: this.options.view === view.toLowerCase(),
					}),
			),
		);

		this._menuBody = new Elem({ className: 'menuBody', appendTo: this._body });
	}

	render_rescue() {
		const player = gameContext.players.currentPlayer;

		this._menuBody.append(
			new Elem({
				tag: 'p',
				content:
					"You have ceased functioning. SpaceCo regrets your inconvenience - and reminds you that your suffering is covered under clause 7B: 'Expected Operational Failures.'\n\nPlease await retrieval or initiate teleportation, assuming your limbs still operate.\n\nCheck the Inventory tab for any life-saving items. You may also scream, but we're not listening.",
			}),

			new Button({
				content: 'Buy Remote Teleport ($50)',
				disabled: player.credits < 50,
				onPointerPress: () => {
					spacecoBuyRescue();

					this.close();
				},
			}),
			new Button({
				content: 'Abort Contract ($0)',
				onPointerPress: async () => {
					const { response, body } = await exitGame();

					if (response.status !== 200) {
						new Notify({ type: 'error', content: body?.message || response.statusText });
					}

					window.location.href = `#/join/${gameContext.gameId}`;

					this.close();
				},
			}),
		);
	}

	render_inventory() {
		const player = gameContext.players.currentPlayer;

		const hasItems = Object.values(player.items).some(count => count > 0);

		if (!hasItems) {
			this._menuBody.append(
				new Elem({
					tag: 'p',
					content: 'No items in inventory. You should have prepared better.',
					className: 'description',
				}),
			);
			return;
		}

		new CardGrid({
			appendTo: this._menuBody,
			content: Object.entries(player.items).flatMap(([key, count]) => {
				if (!count) return [];

				let imageName = key;

				if (key.startsWith('detonator')) imageName = 'detonator';
				else if (key === 'advanced_teleporter') imageName = 'teleport_station';
				else if (key.startsWith('activated_teleporter')) imageName = 'advanced_teleporter';

				// Check if player can use item
				const canUse = this.canUseItem(key, player);
				const disabledReason = this.getItemDisabledReason(key, player);

				return [
					new Card({
						header: `${capitalize(key.replaceAll('_', ' '), true)}`,
						style: {
							opacity: canUse ? 1 : 0.6,
						},
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new ItemImage(imageName, { displaySize: 96 }),
								new Elem({
									tag: 'p',
									content: `Quantity: ${count}`,
									style: { margin: '4px 0', fontSize: '14px' },
								}),
								new DescriptionText({
									summary: items[key]?.summary || '',
									description: items[key]?.description || 'No description available.',
									title: items[key]?.name || capitalize(key.replaceAll('_', ' '), true),
								}),
								!canUse &&
									disabledReason &&
									new Elem({
										tag: 'p',
										content: disabledReason,
										className: 'description',
										style: {
											color: theme.colors.red,
											fontSize: '13px',
											marginTop: '4px',
										},
									}),
							],
						}),
						footerButtons: true,
						footer: [
							new Button({
								content: 'Use',
								onPointerPress: () => {
									if (canUse) {
										useItem({ item: key });
										this.close();
									}
								},
								disabled: !canUse,
							}),
						],
					}),
				];
			}),
		});
	}

	canUseItem(itemKey, player) {
		// Fuel items require compatible engine
		if (['oil', 'battery', 'super_oxygen_liquid_nitrogen'].includes(itemKey)) {
			const engineConfig = engines[player.configuration.engine];
			return engineConfig.fuelType === itemKey && player.fuel < player.maxFuel;
		}

		// Repair nanites require damaged health - THIS IS THE KEY LIFE-SAVING ITEM
		if (itemKey === 'repair_nanites') {
			return player.health < player.maxHealth;
		}

		// Players can always use SpaceCo teleport station (relocates outpost)
		if (itemKey === 'spaceco_teleport_station') {
			return true;
		}

		// Players can always use most other items
		return true;
	}

	getItemDisabledReason(itemKey, player) {
		if (['oil', 'battery', 'super_oxygen_liquid_nitrogen'].includes(itemKey)) {
			const engineConfig = engines[player.configuration.engine];
			if (engineConfig.fuelType !== itemKey) {
				return 'Incompatible fuel type';
			}
			if (player.fuel >= player.maxFuel) {
				return 'Fuel tank full';
			}
		}

		if (itemKey === 'repair_nanites' && player.health >= player.maxHealth) {
			return 'Health already full';
		}

		// SpaceCo teleport station never has disabled reasons
		if (itemKey === 'spaceco_teleport_station') {
			return null;
		}

		return null;
	}

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();

			this.renderMenu();

			this[`render_${value.toLowerCase()}`]();
		} else super._setOption(key, value);
	}
}
