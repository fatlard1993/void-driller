import { Dialog, Label, Button, Elem, capitalize, theme, rand, randInt } from 'vanilla-bean-components';

import {
	DrillImage,
	EngineImage,
	IconImage,
	ItemImage,
	MineralImage,
	PartsImage,
	VehicleImage,
} from '../shared/SpriteSheetImage';
import {
	spacecoBuyItem,
	spacecoBuyTransport,
	spacecoBuyUpgrade,
	spacecoRefuel,
	spacecoRepair,
	spacecoSell,
} from '../api';
import gameContext from '../shared/gameContext';

export default class SpacecoDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			style: {
				width: 'clamp(420px, 80vw, 1700px)',
				height: 'clamp(420px, 60vh, 1200px)',
			},
			header: 'Spaceco',
			buttons: ['Close'],
			view: gameContext.serverState.world.spaceco.health > 0 ? 'Sell' : 'destroyed',
			onButtonPress: () => {
				const player = gameContext.players.currentPlayer;

				player.sprite.move(player.position, 0, player.orientation);

				this.close();
			},
			...options,
		});

		gameContext.sounds.alert2.play({ volume: gameContext.volume.alerts });
	}

	renderPlayerInfo() {
		const player = gameContext.players.currentPlayer;

		this._body.append(new Label('Credits', `$${player.credits.toFixed(2)}`));
	}

	renderMenu() {
		if (this.options.view === 'destroyed') return;

		new Elem(
			{ style: { display: 'flex', flexWrap: 'wrap-reverse', gap: '6px', margin: '6px' }, appendTo: this._body },
			['Sell', 'Refuel', 'Repair', 'Upgrade', 'Shop', 'Transport'].map(
				view =>
					new Button({
						content: view,
						style: { flex: '1' },
						onPointerPress: () => {
							this.options.view = view;
						},
						disabled: this.options.view.toLowerCase().startsWith(view.toLowerCase()),
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

		const player = gameContext.players.currentPlayer;

		const spacecoRepairCost = (9 - gameContext.serverState.world.spaceco.health) * 10;

		new Button({
			content: `Full Repair ($${spacecoRepairCost})`,
			appendTo: this._body,
			onPointerPress: () => spacecoRepair({ type: 'outpost' }),
			disabled: spacecoRepairCost > player.credits,
		});
	}

	render_sell() {
		const player = gameContext.players.currentPlayer;

		if (Object.keys(player.hull).length === 0) {
			this._body.append(new Elem({ tag: 'p', content: 'No minerals to sell' }));

			return;
		}

		const sellButton = new Button({
			style: { marginBottom: '9px' },
			content: `Sell All`,
			onPointerPress: () => spacecoSell(),
			appendTo: this._body,
		});

		let credits = 0;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.keys(gameContext.serverState.world.mineralNames).flatMap(name => {
				const dirtyCount = player.hull[name] || 0;
				const pureCount = player.hull[`mineral_${name}`] || 0;

				if (!dirtyCount && !pureCount) return [];

				const dirtyPrice =
					Math.max(
						0.01,
						gameContext.serverState.world.densities[name] /
							(1000 + (gameContext.serverState.world.spaceco.hull?.[name] || 0)),
					) * dirtyCount;
				const purePrice =
					Math.max(
						0.01,
						gameContext.serverState.world.densities[name] /
							(500 + (gameContext.serverState.world.spaceco.hull?.[name] || 0)),
					) * pureCount;

				credits += dirtyPrice + purePrice;

				return [
					new Label(
						{
							label: capitalize(gameContext.serverState.world.mineralNames[name]),
							style: { width: '216px', paddingBottom: '48px' },
						},
						new Elem({
							tag: 'pre',
							content: `Dirty: x${dirtyCount.toString()} = $${dirtyPrice.toFixed(2)}\nPure: x${pureCount.toString()} = $${purePrice.toFixed(2)}`,
							style: { margin: 0, whiteSpace: 'pre-wrap' },
						}),
						...[...Array(Math.min(dirtyCount, 50))].map(
							() =>
								new MineralImage(name.replace('mineral_', ''), {
									position: 'absolute',
									transform: `scale(${rand(0.3, 0.5)}) translate(${randInt(-22, 258)}px, ${randInt(-10, 20)}px)`,
								}),
						),
						...[...Array(Math.min(pureCount, 50))].map(
							() =>
								new MineralImage(name.replace('mineral_', ''), {
									position: 'absolute',
									transform: `scale(${rand(0.5, 0.8)}) translate(${randInt(-22, 258)}px, ${randInt(-10, 20)}px)`,
								}),
						),
					),
				];
			}),
		);

		sellButton.options.content = `Sell All ($${credits.toFixed(2)})`;
	}

	render_success() {
		new Elem({ tag: 'p', content: 'Thank you', appendTo: this._body });
	}

	renderUpgradeMenu() {
		new Elem(
			{ style: { display: 'flex', flexWrap: 'wrap-reverse', gap: '6px', margin: '6px' }, appendTo: this._body },
			['Vehicles', 'Drills', 'Engines', 'Parts'].map(
				view =>
					new Button({
						content: view,
						style: { flex: '1' },
						onPointerPress: () => {
							this.options.view = `upgrade_${view}`;
						},
						disabled: this.options.view === `upgrade_${view}`,
					}),
			),
		);
	}

	render_upgrade() {
		this.options.view = 'upgrade_Vehicles';
	}

	render_upgrade_vehicles() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.vehicles).map(
				([name, { price, description, spriteIndex, maxHealth, maxFuel, maxCargo, tracks }]) => {
					return new Label(
						{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
						new VehicleImage(spriteIndex),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => {
								const player = gameContext.players.currentPlayer;

								player.sprite.setTexture('vehicles', spriteIndex);

								spacecoBuyUpgrade({ upgrade: name, type: 'vehicles' });
							},
							disabled: price > player.credits,
						}),
						description &&
							new Elem({
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
							style: { margin: 0, whiteSpace: 'pre-wrap' },
						}),
					);
				},
			),
		);
	}

	render_upgrade_engines() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.engines).map(
				([name, { price, description, spriteIndex, maxHealth, maxFuel, fuelType, fuelEfficiency }]) => {
					return new Label(
						{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
						new EngineImage(spriteIndex),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => {
								spacecoBuyUpgrade({ upgrade: name, type: 'engines' });
							},
							disabled: price > player.credits,
						}),
						description &&
							new Elem({
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
							content: `maxHealth: +${maxHealth}\nmaxFuel: +${maxFuel}\nfuelType: ${capitalize(fuelType.replaceAll('_', ' '), true)}\nfuelEfficiency: ${fuelEfficiency}`,
							style: { margin: 0, whiteSpace: 'pre-wrap' },
						}),
					);
				},
			),
		);
	}

	render_upgrade_drills() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.drills).map(
				([name, { price, description, spriteIndex, maxHealth, maxFuel }]) => {
					return new Label(
						{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
						new DrillImage(spriteIndex),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => {
								const player = gameContext.players.currentPlayer;

								player.sprite.drill.setTexture('drills', spriteIndex);

								spacecoBuyUpgrade({ upgrade: name, type: 'drills' });
							},
							disabled: price > player.credits,
						}),
						description &&
							new Elem({
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
							content: `maxHealth: +${maxHealth}\nmaxFuel: +${maxFuel}`,
							style: { margin: 0, whiteSpace: 'pre-wrap' },
						}),
					);
				},
			),
		);
	}

	render_upgrade_parts() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.parts).map(
				([name, { price, description, spriteIndex, maxHealth, maxFuel, maxCargo }]) => {
					return new Label(
						{ label: name, style: { width: 'clamp(130px, 27%, 300px)' } },
						spriteIndex >= 0 && new PartsImage(spriteIndex),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => {
								spacecoBuyUpgrade({ upgrade: name, type: 'parts' });
							},
							disabled: price > player.credits,
						}),
						description &&
							new Elem({
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
							content: `maxHealth: ${maxHealth > 0 ? '+' : ''}${maxHealth}\nmaxFuel: ${maxFuel > 0 ? '+' : ''}${maxFuel}\nmaxCargo: ${maxCargo > 0 ? '+' : ''}${maxCargo}`,
							style: { margin: 0, whiteSpace: 'pre-wrap' },
						}),
					);
				},
			),
		);
	}

	render_refuel() {
		const player = gameContext.players.currentPlayer;
		const engineConfig = gameContext.serverState.world.engines[player.configuration.engine];
		const pricePerLiter = { oil: 0.9, battery: 1.3, super_oxygen_liquid_nitrogen: 1.7 }[engineConfig.fuelType];
		const neededFuel = player.maxFuel - player.fuel;
		const cost = neededFuel * pricePerLiter;

		if (neededFuel === 0) {
			this._body.append(new Elem({ tag: 'p', content: 'Your full' }));

			return;
		}

		this._body.append(
			new Label(
				`Fuel Type: ${capitalize(engineConfig.fuelType.replaceAll('_', ' '), true)}`,
				new ItemImage(engineConfig.fuelType),
			),
			new Button({
				content: `Fill ($${cost.toFixed(2)})`,
				onPointerPress: () => spacecoRefuel(),
				disabled: cost > player.credits,
			}),
		);

		if (player.credits && cost > player.credits) {
			[5, 10, 20, 40, 50].forEach(amount => {
				if (player.credits > amount) {
					this._body.append(
						new Button({
							content: `$${amount}`,
							onPointerPress: () => spacecoRefuel({ amount }),
						}),
					);
				}
			});

			this._body.append(
				new Button({
					content: `$${player.credits.toFixed(2)}`,
					onPointerPress: () =>
						spacecoRefuel({
							amount: player.credits,
						}),
				}),
			);
		}
	}

	render_repair() {
		const playerRepairs = new Label('Repair your Drill');
		const spacecoRepairs = new Label('Repair Spaceco Outpost');

		const player = gameContext.players.currentPlayer;

		const pricePerHealth = 1.3;
		const neededHealth = player.maxHealth - player.health;
		const cost = neededHealth * pricePerHealth;

		if (neededHealth === 0) {
			new Elem({ tag: 'p', content: `You're in good shape`, appendTo: playerRepairs });
		} else {
			new Button({
				textContent: `Full Repair ($${cost.toFixed(2)})`,
				prepend: new IconImage('health', { display: 'inline-block', margin: '-5px 0 -10px -10px' }),
				appendTo: playerRepairs,
				onPointerPress: () => spacecoRepair({ type: 'player' }),
				disabled: cost > player.credits,
			});
		}

		if (gameContext.serverState.world.spaceco.health >= 9) {
			new Elem({ tag: 'p', content: `This outpost is in good shape`, appendTo: spacecoRepairs });
		} else {
			const spacecoRepairCost = (9 - gameContext.serverState.world.spaceco.health) * 10;

			new Button({
				textContent: `Full Repair ($${spacecoRepairCost})`,
				prepend: new IconImage('health', { display: 'inline-block', margin: '-5px 0 -10px -10px' }),
				appendTo: spacecoRepairs,
				onPointerPress: () => spacecoRepair({ type: 'outpost' }),
				disabled: spacecoRepairCost > player.credits,
			});
		}

		this._body.append(playerRepairs, spacecoRepairs);
	}

	render_shop() {
		const player = gameContext.players.currentPlayer;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(gameContext.serverState.world.spaceco.items).flatMap(([key, { price, description, stock }]) => {
				if (!stock) return [];

				return [
					new Label(
						{ label: capitalize(key.replaceAll('_', ' '), true), style: { width: 'clamp(130px, 27%, 300px)' } },
						new ItemImage(key),
						new Button({
							content: `Buy ($${price})`,
							onPointerPress: () => spacecoBuyItem({ item: key }),
							disabled: price > player.credits,
						}),
						`Stock: ${stock}`,
						new Elem({
							tag: 'p',
							content: description,
							style: {
								color: theme.colors.lighter(theme.colors.gray),
								borderLeft: '3px solid',
								paddingLeft: '6px',
							},
						}),
					),
				];
			}),
		);
	}

	render_transport() {
		const player = gameContext.players.currentPlayer;

		const price = 100;

		new Button({
			appendTo: this._body,
			content: `Buy Transport ($${price})`,
			onPointerPress: () => spacecoBuyTransport(),
			disabled: price > player.credits,
		});
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
