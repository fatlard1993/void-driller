import { Elem, Button, theme, styled } from '@vanilla-bean/components';
import { failureReason } from '@vanilla-bean/hypertether';

import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { exitGame, spacecoBuyRescue, useItem } from '../api';
import Notify from '../shared/Notify';
import { Card } from '../shared/Card';
import { CardGrid } from '../shared/CardGrid';
import { ItemImage } from '../shared/SpriteSheetImage';
import { DescriptionText } from '../shared/DescriptionText';
import { inventoryItem } from '../shared/inventoryItem';
import PriceDisplay from '../shared/PriceDisplay';
import { engines } from '../../constants';
import { getScaledServiceCosts } from '../../utils';
import { Tab, TabRow } from '../shared/BurgerTabs';

export default class RescueDialog extends (styled(BaseDialog)`
	& button {
		white-space: initial;
	}

	& .menuBody {
		background-color: ${({ colors }) => colors.alpha(colors.white, 0.04)};
		padding: ${({ space }) => `${space.md} ${space.lg}`};
	}

	& p.description {
		color: ${({ colors }) => colors.lighter(colors.gray)};
		border-left: 3px solid;
		padding-left: ${({ space }) => space.sm};
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
		new TabRow(
			{ addClass: 'menu', appendTo: this._body },
			['Rescue', 'Inventory'].map(view =>
				Tab({
					content: view,
					onPointerPress: () => {
						this.options.view = view.toLowerCase();
					},
					selected: this.options.view === view.toLowerCase(),
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
				content: new Elem(
					{ style: { display: 'flex', alignItems: 'center', gap: theme.space.sm, justifyContent: 'center' } },
					new Elem({ content: 'Buy Remote Teleport (' }),
					new PriceDisplay({
						amount: getScaledServiceCosts(gameContext.serverState.world.spaceco.xp).rescueCost,
						size: 14,
					}),
					new Elem({ content: ')' }),
				),
				disabled: player.credits < getScaledServiceCosts(gameContext.serverState.world.spaceco.xp).rescueCost,
				onPointerPress: () => {
					spacecoBuyRescue();

					this.close();
				},
			}),
			new Button({
				content: 'Abort Contract ($0)',
				onPointerPress: async () => {
					const result = await exitGame();

					if (result.status === 'error') new Notify({ type: 'error', content: failureReason(result) });

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

				const { name: itemName, image: imageName, summary, description } = inventoryItem(key);

				// Check if player can use item
				const canUse = this.canUseItem(key, player);
				const disabledReason = this.getItemDisabledReason(key, player);

				return [
					new Card({
						state: 'owned',
						header: itemName,
						style: {
							opacity: canUse ? 1 : 0.6,
						},
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: theme.space.xs,
							},
							append: [
								new ItemImage(imageName, { displaySize: 96 }),
								new Elem({
									tag: 'p',
									content: `Quantity: ${count}`,
									style: { margin: `${theme.space.xs} 0`, fontSize: '14px' },
								}),
								new DescriptionText({
									summary,
									description,
									title: itemName,
								}),
								!canUse &&
									disabledReason &&
									new Elem({
										tag: 'p',
										content: disabledReason,
										className: 'description',
										style: {
											color: theme.colors.danger,
											fontSize: '13px',
											marginTop: theme.space.xs,
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

	static schema = {
		view: {
			set(value) {
				this._body.empty();

				this.renderMenu();

				this[`render_${value.toLowerCase()}`]();
			},
		},
	};
}
