import { Dialog, Label, Button, Elem, capitalize, theme } from 'vanilla-bean-components';

import SpriteSheetImage from '../shared/SpriteSheetImage';
import { spacecoBuyItem, spacecoBuyUpgrade, spacecoRefuel, spacecoRepair, spacecoSell } from '../api';
import gameContext from './gameContext';

export default class SpacecoDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			header: 'Spaceco',
			buttons: ['Close'],
			view: gameContext.serverState.world.spaceco.health > 0 ? 'Sell' : 'destroyed',
			onButtonPress: () => {
				const player = gameContext.players.get(gameContext.playerId);

				player.sprite.move(player.position, 0, player.orientation);

				this.close();
			},
			...options,
		});

		gameContext.sounds.alert2.play({ volume: gameContext.volume.alerts });
	}

	renderPlayerInfo() {
		const player = gameContext.players.get(gameContext.playerId);

		this._body.append(new Label('Credits', `$${player.credits.toFixed(2)}`));
	}

	renderMenu() {
		if (this.options.view === 'destroyed') return;

		new Elem(
			{ style: { display: 'flex', flexWrap: 'wrap-reverse', gap: '6px', margin: '6px' }, appendTo: this._body },
			['Sell', 'Refuel', 'Repair', 'Upgrade', 'Shop'].map(
				view =>
					new Button({
						content: view,
						style: { flex: '1' },
						onPointerPress: () => {
							this.options.view = view;
						},
						disabled: this.options.view === view,
					}),
			),
		);
	}

	render_destroyed() {
		new Elem({
			tag: 'p',
			content:
				'This Spaceco outpost is nearly destroyed, it needs to be repaired before its regular services are available again.',
			appendTo: this._body,
		});

		const player = gameContext.players.get(gameContext.playerId);

		const spacecoRepairCost = (9 - gameContext.serverState.world.spaceco.health) * 10;

		new Button({
			content: `Full Repair ($${spacecoRepairCost})`,
			appendTo: this._body,
			onPointerPress: () =>
				spacecoRepair({ gameId: gameContext.serverState.id, playerId: gameContext.playerId, type: 'outpost' }),
			disabled: spacecoRepairCost > player.credits,
		});
	}

	render_sell() {
		const player = gameContext.players.get(gameContext.playerId);

		if (Object.keys(player.hull).length === 0) {
			this._body.append(new Elem({ tag: 'p', content: 'No minerals to sell' }));

			return;
		}

		const sellButton = new Button({
			style: { marginBottom: '9px' },
			content: `Sell All`,
			onPointerPress: () => spacecoSell({ gameId: gameContext.serverState.id, playerId: gameContext.playerId }),
			appendTo: this._body,
		});

		let credits = 0;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(player.hull).map(([key, count]) => {
				let price;

				if (key.startsWith('mineral')) {
					price =
						Math.max(
							0.01,
							gameContext.serverState.world.densities[key.replace('mineral_', '')] /
								(500 + (gameContext.serverState.world.spaceco.hull?.[key] || 0)),
						) * count;
				} else
					price =
						Math.max(
							0.01,
							gameContext.serverState.world.densities[key] /
								(1000 + (gameContext.serverState.world.spaceco.hull?.[key] || 0)),
						) * count;

				credits += price;

				const mineralColorIndex = {
					teal: 0,
					blue: 1,
					red: 2,
					purple: 3,
					pink: 4,
					orange: 5,
					green: 6,
					yellow: 7,
					black: 8,
					white: 9,
				};

				return new Label(
					{
						label: `${key.startsWith('mineral') ? 'Concentrated ' : ''}${capitalize(gameContext.serverState.world.mineralNames[key.replace('mineral_', '')])}`,
						style: { width: 'auto' },
					},
					`x${count.toString()} = $${price.toFixed(2)}`,
					new SpriteSheetImage('img/minerals.png', mineralColorIndex[key.replace('mineral_', '')], 32, 32),
				);
			}),
		);

		sellButton.options.content = `Sell All ($${credits.toFixed(2)})`;
	}

	render_success() {
		new Elem({ tag: 'p', content: 'Thank you', appendTo: this._body });
	}

	render_upgrade_old() {
		const player = gameContext.players.get(gameContext.playerId);

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.parts).map(([key, price]) => {
				return new Label(
					{ label: capitalize(key.replaceAll('_', ' '), true), style: { width: 'auto' } },
					new Button({
						content: `Buy ($${price})`,
						onPointerPress: () =>
							spacecoBuyUpgrade({
								gameId: gameContext.serverState.id,
								playerId: gameContext.playerId,
								upgrade: key,
							}),
						disabled: price > player.credits,
					}),
				);
			}),
		);
	}

	render_upgrade() {
		const player = gameContext.players.get(gameContext.playerId);

		const spacecoVariants = [
			{ name: '', price: 0, description: '' },
			{ name: '', price: 0, description: '' },
			{ name: '', price: 0, description: '' },
		];

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.drills).map(
				([name, { price, description, spriteIndex, maxHealth, maxFuel }]) => {
					return new Label(
						{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
						description && new Elem({
							tag: 'p',
							content: description,
							style: {
								color: theme.colors.lighter(theme.colors.gray),
								borderLeft: '3px solid',
								paddingLeft: '6px',
							},
						}),
						new Elem({ tag: 'pre', content: `maxHealth: +${maxHealth}\nmaxFuel: +${maxFuel}`, style: { margin: 0 } }),
						new SpriteSheetImage('img/drills.png', spriteIndex, 30, 56),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => {
								const player = gameContext.players.get(gameContext.playerId);

								player.sprite.drill.setTexture('drills', spriteIndex);
							},
							disabled: price > player.credits,
						}),
					);
				},
			),
			Object.entries(gameContext.serverState.world.vehicles).map(
				([name, { price, description, spriteIndex, maxHealth, maxFuel, maxCargo, tracks }]) => {
					return new Label(
						{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
						description && new Elem({
							tag: 'p',
							content: description,
							style: {
								color: theme.colors.lighter(theme.colors.gray),
								borderLeft: '3px solid',
								paddingLeft: '6px',
							},
						}),
						new Elem({
							tag: 'pre',
							content: `maxHealth: +${maxHealth}\nmaxFuel: +${maxFuel}\nmaxCargo: +${maxCargo}\n${tracks ? 'tracks' : 'wheels'}`,
							style: { margin: 0 },
						}),
						new SpriteSheetImage('img/vehicles.png', spriteIndex, 64, 64),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => {
								const player = gameContext.players.get(gameContext.playerId);

								player.sprite.setTexture('vehicles', spriteIndex);
							},
							disabled: price > player.credits,
						}),
					);
				},
			),
			spacecoVariants.map(({ name, price, description }, index) => {
				return new Label(
					{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
					new Elem({
						tag: 'p',
						content: description,
						style: {
							color: theme.colors.lighter(theme.colors.gray),
							borderLeft: '3px solid',
							paddingLeft: '6px',
						},
					}),
					new SpriteSheetImage('img/spaceco.png', index, 192, 192, { transform: 'scale(0.6) translate(-27%)' }),
					new Button({
						content: `Buy ($${price})`,
						onPointerPress: () => {
							gameContext.spaceco.setTexture('spaceco', index);
						},
						disabled: price > player.credits,
					}),
				);
			}),
		);
	}

	render_refuel() {
		const player = gameContext.players.get(gameContext.playerId);
		const pricePerLiter = 0.9;
		const neededFuel = player.maxFuel - player.fuel;
		const cost = neededFuel * pricePerLiter;

		if (neededFuel === 0) {
			this._body.append(new Elem({ tag: 'p', content: 'Your full' }));

			return;
		}

		this._body.append(
			new Label('Fuel Type: Oil', new SpriteSheetImage('img/items.png', 6, 64, 64)),
			new Button({
				content: `Fill ($${cost.toFixed(2)})`,
				onPointerPress: () => spacecoRefuel({ gameId: gameContext.serverState.id, playerId: gameContext.playerId }),
				disabled: cost > player.credits,
			}),
		);

		if (player.credits && cost > player.credits) {
			[5, 10, 20, 40, 50].forEach(amount => {
				if (player.credits > amount) {
					this._body.append(
						new Button({
							content: `$${amount}`,
							onPointerPress: () =>
								spacecoRefuel({ gameId: gameContext.serverState.id, playerId: gameContext.playerId, amount }),
						}),
					);
				}
			});

			this._body.append(
				new Button({
					content: `$${player.credits.toFixed(2)}`,
					onPointerPress: () =>
						spacecoRefuel({
							gameId: gameContext.serverState.id,
							playerId: gameContext.playerId,
							amount: player.credits,
						}),
				}),
			);
		}
	}

	render_repair() {
		const playerRepairs = new Label('Repair your Drill');
		const spacecoRepairs = new Label('Repair Spaceco Outpost');

		const player = gameContext.players.get(gameContext.playerId);

		const pricePerHealth = 1.3;
		const neededHealth = player.maxHealth - player.health;
		const cost = neededHealth * pricePerHealth;

		if (neededHealth === 0) {
			new Elem({ tag: 'p', content: `You're in good shape`, appendTo: playerRepairs });
		} else {
			new Button({
				textContent: `Full Repair ($${cost.toFixed(2)})`,
				prepend: new SpriteSheetImage('img/icons.png', 1, 32, 32, {
					display: 'inline-block',
					margin: '-5px 0 -10px -10px',
				}),
				appendTo: playerRepairs,
				onPointerPress: () =>
					spacecoRepair({ gameId: gameContext.serverState.id, playerId: gameContext.playerId, type: 'player' }),
				disabled: cost > player.credits,
			});
		}

		if (gameContext.serverState.world.spaceco.health >= 9) {
			new Elem({ tag: 'p', content: `This outpost is in good shape`, appendTo: spacecoRepairs });
		} else {
			const spacecoRepairCost = (9 - gameContext.serverState.world.spaceco.health) * 10;

			new Button({
				textContent: `Full Repair ($${spacecoRepairCost})`,
				prepend: new SpriteSheetImage('img/icons.png', 1, 32, 32, {
					display: 'inline-block',
					margin: '-5px 0 -10px -10px',
				}),
				appendTo: spacecoRepairs,
				onPointerPress: () =>
					spacecoRepair({ gameId: gameContext.serverState.id, playerId: gameContext.playerId, type: 'outpost' }),
				disabled: spacecoRepairCost > player.credits,
			});
		}

		this._body.append(playerRepairs, spacecoRepairs);
	}

	render_shop() {
		const player = gameContext.players.get(gameContext.playerId);

		const itemIndex = {
			repair_nanites: 0,
			teleporter: 1,
			responder: 3,
			responder_teleporter: 5,
			gas: 6,
			timed_charge: 7,
			remote_charge: 8,
		};

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.items).map(([key, { price, description }]) => {
				return new Label(
					{ label: capitalize(key.replaceAll('_', ' '), true), style: { width: 'clamp(130px, 27%, 300px)' } },
					new Elem({
						tag: 'p',
						content: description,
						style: {
							color: theme.colors.lighter(theme.colors.gray),
							borderLeft: '3px solid',
							paddingLeft: '6px',
						},
					}),
					new SpriteSheetImage('img/items.png', itemIndex[key], 64, 64),
					new Button({
						content: `Buy ($${price})`,
						onPointerPress: () =>
							spacecoBuyItem({
								gameId: gameContext.serverState.id,
								playerId: gameContext.playerId,
								item: key,
							}),
						disabled: price > player.credits,
					}),
				);
			}),
		);
	}

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();

			this.renderMenu();
			this.renderPlayerInfo();

			this[`render_${value.toLowerCase()}`]();
		} else super._setOption(key, value);
	}
}
