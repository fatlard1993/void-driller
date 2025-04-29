import { Dialog, Label, Button, Elem, capitalize } from 'vanilla-bean-components';

import SpriteSheetImage from '../shared/SpriteSheetImage';
import { spacecoBuyItem, spacecoBuyUpgrade, spacecoRefuel, spacecoRepair, spacecoSell } from '../api';
import gameContext from './gameContext';

export default class SpacecoDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			header: 'Spaceco',
			buttons: ['Sell', 'Refuel', 'Repair', 'Upgrade', 'Shop', 'Close'],
			view: 'Sell',
			onButtonPress: ({ button }) => {
				if (this[`render_${button.toLowerCase()}`]) {
					this._body.empty();

					this.renderPlayerInfo();
					this[`render_${button.toLowerCase()}`]();
				} else {
					const player = gameContext.players.get(gameContext.playerId);

					player.sprite.move(player.position, 0, player.orientation);

					this.close();
				}
			},
			...options,
		});

		console.log(gameContext.serverState.world.spaceco);

		gameContext.sounds.alert2.play({ volume: gameContext.volume.alerts });
	}

	renderPlayerInfo() {
		const player = gameContext.players.get(gameContext.playerId);

		this._body.append(new Label('Credits', `$${player.credits.toFixed(2)}`));
	}

	render_sell() {
		this.options.header = 'Spaceco | Sell';

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

				console.log(
					`Old price: ${Math.max(0.01, gameContext.serverState.world.densities[key.replace('mineral_', '')] / 800) * count}`,
					`\nSpaceco has: ${gameContext.serverState.world.spaceco.hull?.[key]}`,
					`\nNew price: ${
						Math.max(
							0.01,
							gameContext.serverState.world.densities[key.replace('mineral_', '')] /
								(800 + (gameContext.serverState.world.spaceco.hull?.[key] || 0)),
						) * count
					}`,
				);

				if (key.startsWith('mineral')) {
					price =
						Math.max(
							0.01,
							gameContext.serverState.world.densities[key.replace('mineral_', '')] /
								(800 + (gameContext.serverState.world.spaceco.hull?.[key] || 0)),
						) * count;
				} else
					price =
						Math.max(
							0.01,
							gameContext.serverState.world.densities[key] /
								(1600 + (gameContext.serverState.world.spaceco.hull?.[key] || 0)),
						) * count;

				credits += price;

				return new Label(
					{
						label: `${capitalize(gameContext.serverState.world.mineralNames[key.replace('mineral_', '')])}`,
						style: { width: 'auto' },
					},
					`x${count.toString()} = $${price.toFixed(2)}`,
					new SpriteSheetImage(key.startsWith('mineral') ? key : `ground_${key}`),
				);
			}),
		);

		sellButton.options.content = `Sell All ($${credits.toFixed(2)})`;
	}

	render_success() {
		this._body.append(new Elem({ tag: 'p', content: 'Thank you' }));
	}

	render_upgrade() {
		this.options.header = 'Spaceco | Upgrade';

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

	render_refuel() {
		this.options.header = 'Spaceco | Refuel';

		const player = gameContext.players.get(gameContext.playerId);
		const pricePerLiter = 0.9;
		const neededFuel = player.maxFuel - player.fuel;
		const cost = neededFuel * pricePerLiter;

		if (neededFuel === 0) {
			this._body.append(new Elem({ tag: 'p', content: 'Your full' }));

			return;
		}

		this._body.append(
			new Label('Fuel Type', new SpriteSheetImage('item_gas')),
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
		this.options.header = 'Spaceco | Repair';

		const player = gameContext.players.get(gameContext.playerId);

		const pricePerHealth = 1.3;
		const neededHealth = player.maxHealth - player.health;
		const cost = neededHealth * pricePerHealth;

		if (neededHealth === 0) {
			this._body.append(new Elem({ tag: 'p', content: `You're in good shape` }));

			return;
		}

		this._body.append(
			new SpriteSheetImage('item_repair_nanites'),
			new Button({
				content: `Full Repair ($${cost.toFixed(2)})`,
				onPointerPress: () => spacecoRepair({ gameId: gameContext.serverState.id, playerId: gameContext.playerId }),
				disabled: cost > player.credits,
			}),
		);
	}

	render_shop() {
		this.options.header = 'Spaceco | Shop';

		const player = gameContext.players.get(gameContext.playerId);

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.items).map(([key, { price, description }]) => {
				return new Label(
					{ label: capitalize(key.replaceAll('_', ' '), true), style: { width: 'auto' } },
					description,
					new SpriteSheetImage(`item_${key}`),
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

			this.renderPlayerInfo();

			this[`render_${value.toLowerCase()}`]();
		} else super._setOption(key, value);
	}
}
