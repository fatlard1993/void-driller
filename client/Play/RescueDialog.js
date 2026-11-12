import { Elem, Button, failureReason, theme, styled } from '@vanilla-bean/components';

import BaseDialog, { ConfirmDialog } from '../shared/BaseDialog';
import { frameAttributes } from '../shared/frame';
import gameContext from '../shared/gameContext';
import { act } from '@fatlard1993/web-game-framework/client';
import { exitGame } from '../api';
import Notify from '../shared/Notify';
import { Card } from '../shared/Card';
import { CardGrid } from '../shared/CardGrid';
import { ItemImage } from '../shared/SpriteSheetImage';
import { DescriptionText } from '../shared/DescriptionText';
import { inventoryItem, itemUseBlocker } from '../shared/inventoryItem';
import PriceDisplay from '../shared/PriceDisplay';
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
					act('spacecoRescue');

					this.close();
				},
			}),
			new Button({
				content: 'Abort Contract ($0)',
				onPointerPress: async () => {
					const confirmed = await ConfirmDialog.confirm({
						...frameAttributes,
						intent: 'danger',
						header: 'Abort this contract?',
						body: 'Terminating this drilling contract will remove you from the operation. This action cannot be undone.',
						confirmLabel: 'Abort Contract',
					});

					if (!confirmed) return;

					// Said first, so the view that drops this driller isn't taken for being dropped
					gameContext.exiting = true;
					const result = await exitGame();

					if (result.status === 'error') new Notify({ intent: 'danger', content: failureReason(result) });

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
				const disabledReason = itemUseBlocker(key, player);
				const canUse = !disabledReason;

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
										act('useItem', { item: key });
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
