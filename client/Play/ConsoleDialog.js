import {
	capitalize,
	Component,
	convertRange,
	Dialog,
	Elem,
	Input,
	Label,
	Select,
	Button,
	rand,
	randInt,
} from 'vanilla-bean-components';

import { DrillImage, EngineImage, ItemImage, MineralImage, VehicleImage } from '../shared/SpriteSheetImage';
import { useItem } from '../api';
import gameContext from '../shared/gameContext';

class VolumeControl extends Component {
	render() {
		new Label(
			{
				appendTo: this,
				label: gameContext.subscriber(
					'volume',
					volume => `${capitalize(this.options.key)} Volume (${parseInt(volume[this.options.key] * 100)}%)`,
				),
			},
			new Input({
				type: 'range',
				min: 0,
				max: 100,
				step: 1,
				value: gameContext.volume[this.options.key] * 100,
				onChange: ({ value }) => {
					gameContext.volume = { ...gameContext.volume, [this.options.key]: parseFloat(value / 100) };

					localStorage.setItem('volume', JSON.stringify(gameContext.volume));
				},
			}),
		);
	}
}

export default class ConsoleDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			style: {
				width: 'clamp(420px, 80vw, 1700px)',
				height: 'clamp(420px, 60vh, 1200px)',
			},
			header: 'Console',
			buttons: ['Close'],
			view: localStorage.getItem('console_defaultMenu') || 'Help',
			onButtonPress: () => {
				const player = gameContext.players.currentPlayer;

				player.sprite.move(player.position, 0, player.orientation);

				this.close();
			},
			...options,
		});

		gameContext.sounds.alert2.play({ volume: gameContext.volume.alerts });
	}

	renderMenu() {
		if (this.options.view === 'destroyed') return;

		new Elem(
			{ style: { display: 'flex', flexWrap: 'wrap-reverse', gap: '6px', margin: '6px' }, appendTo: this._body },
			['Cargo', 'Status', 'Items', 'Settings', 'Help'].map(
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

	render_cargo() {
		const player = gameContext.players.currentPlayer;
		let credits = 0;

		const total = new Elem({
			content: `Total`,
			appendTo: this._body,
		});

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.keys(gameContext.serverState.world.mineralNames).flatMap(name => {
				const dirtyCount = player.hull[name] || 0;
				const pureCount = player.hull[`mineral_${name}`] || 0;

				if (!dirtyCount && !pureCount) return [];

				const demandDrop = (gameContext.serverState.world.spaceco.hull?.[name] || 0) / 1000;
				const baseValue = gameContext.serverState.world.mineralValue[name];

				const dirtyPrice = dirtyCount ? Math.max(0.01, (baseValue / 2 - demandDrop) * dirtyCount) : 0;
				const purePrice = pureCount ? Math.max(0.01, (baseValue - demandDrop) * pureCount) : 0;

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

		total.content(`Total: $${credits.toFixed(2)}`);
	}

	render_status() {
		const player = gameContext.players.currentPlayer;
		console.log(player);
		const vehicleConfig = gameContext.serverState.world.vehicles[player.configuration.vehicle];
		const drillConfig = gameContext.serverState.world.drills[player.configuration.drill];
		const engineConfig = gameContext.serverState.world.engines[player.configuration.engine];

		this._body.append(
			new Label('Position', `X: ${player.position.x} | Y: ${player.position.y}`),
			new Label('Credits', `$${player.credits.toFixed(2)}`),
			new Label('Health', `${convertRange(player.health, [0, player.maxHealth], [0, 100]).toFixed(1)}%`),
			new Label(
				'Fuel',
				`${player.fuel.toFixed(2)}l (${convertRange(player.fuel, [0, player.maxFuel], [0, 100]).toFixed(1)}%)`,
			),
			new Label(
				'Cargo',
				`${player.cargo.toFixed(2)}t (${convertRange(player.cargo, [0, player.maxCargo], [0, 100]).toFixed(1)}%)`,
			),
			new Label(
				'Configuration',
				new VehicleImage(player.sprite.frame.name),
				new Elem({
					tag: 'pre',
					content: `Vehicle: ${player.configuration.vehicle}\n\tmaxHealth: +${vehicleConfig.maxHealth}\n\tmaxFuel: +${vehicleConfig.maxFuel}\n\tmaxCargo: +${vehicleConfig.maxCargo}\n\t${vehicleConfig.tracks ? 'tracks' : 'wheels'}`,
					style: { margin: 0 },
				}),
				new DrillImage(player.sprite.drill.frame.name),
				new Elem({
					tag: 'pre',
					content: `Drill: ${player.configuration.drill}\n\tmaxHealth: +${drillConfig.maxHealth}\n\tmaxFuel: +${drillConfig.maxFuel}`,
					style: { margin: 0 },
				}),
				new EngineImage(engineConfig.spriteIndex),
				new Elem({
					tag: 'pre',
					content: `Engine: ${player.configuration.engine}\n\tmaxHealth: +${engineConfig.maxHealth}\n\tmaxFuel: +${engineConfig.maxFuel}\n\tfuelType: ${engineConfig.fuelType}`,
					style: { margin: 0 },
				}),
			),
		);
	}

	render_items() {
		const player = gameContext.players.currentPlayer;

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(player.items).flatMap(([key, count]) => {
				if (!count) return [];

				let imageName = key;

				if (key.startsWith('detonator')) imageName = 'detonator';
				else if (key === 'advanced_teleporter') imageName = 'teleport_station';
				else if (key.startsWith('activated_teleporter')) imageName = 'advanced_teleporter';

				return [
					new Label(
						{ label: capitalize(key.replaceAll('_', ' '), true), style: { width: 'auto' } },
						`x${count.toString()}`,
						new ItemImage(imageName),
						new Button({
							content: 'Use',
							onPointerPress: () => {
								useItem({ item: key });

								this.close();
							},
						}),
					),
				];
			}),
		);
	}

	render_settings() {
		this._body.append(
			new VolumeControl({ key: 'music' }),
			new VolumeControl({ key: 'alerts' }),
			new VolumeControl({ key: 'interfaces' }),
			new VolumeControl({ key: 'effects' }),
			new Label(
				'Default Console Menu',
				new Select({
					options: ['Cargo', 'Status', 'Items', 'Settings', 'Help'],
					value: localStorage.getItem('console_defaultMenu') || 'Help',
					onChange: ({ value }) => localStorage.setItem('console_defaultMenu', value),
				}),
			),
		);
	}

	render_help() {
		this._body.append(
			new Elem({ tag: 'p', content: 'Use your pointer to drag a path for your drill.' }),
			new Elem({
				tag: 'p',
				content: 'Collect minerals and bring them back to spaceco to sell them.',
			}),
			new Elem({
				tag: 'p',
				content: `Don't run out of fuel, watch your gauge carefully to avoid passing the point of no return.`,
			}),
			new Elem({
				tag: 'p',
				content: 'Use your earned credits to; make repairs, buy more fuel, teleporters, bombs, and upgrade your drill.',
			}),
			new Elem({
				tag: 'p',
				content: `Once you've collected enough minerals here; purchase transport to another rock to collect more.`,
			}),
			new Elem({
				tag: 'p',
				content: 'Configure your default menu (in settings) to skip opening the console when you join.',
			}),
		);
	}

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();

			this.renderMenu();

			this[`render_${value.toLowerCase()}`]();
		} else super._setOption(key, value);
	}
}
