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
	randInt,
} from 'vanilla-bean-components';

import SpriteSheetImage from '../shared/SpriteSheetImage';
import { useItem } from '../api';
import gameContext from './gameContext';

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
			header: 'Console',
			buttons: ['Close'],
			view: localStorage.getItem('console_defaultMenu') || 'Help',
			onButtonPress: () => {
				const player = gameContext.players.get(gameContext.playerId);

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
		const player = gameContext.players.get(gameContext.playerId);

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(player.hull).map(([key, count]) => {
				let price;

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
	}

	render_status() {
		const player = gameContext.players.get(gameContext.playerId);

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
				new SpriteSheetImage('img/vehicles.png', randInt(0, 12), 128, 128),
				new SpriteSheetImage('img/drills.png', randInt(0, 12), 30, 56),
				Object.entries(player.configuration).flatMap(([key, value]) =>
					typeof value === 'object' ? [] : [new Label(key, value.toString())],
				),
			),
		);
	}

	render_items() {
		const player = gameContext.players.get(gameContext.playerId);

		new Elem(
			{ appendTo: this._body, style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
			Object.entries(player.items).flatMap(([key, count]) => {
				if (!count) return [];

				const itemIndex = {
					repair_nanites: 0,
					teleporter: 1,
					responder: 3,
					responder_teleporter: 5,
					gas: 6,
					timed_charge: 7,
					remote_charge: 8,
				};

				return [
					new Label(
						{ label: capitalize(key.replaceAll('_', ' '), true), style: { width: 'auto' } },
						`x${count.toString()}`,
						new SpriteSheetImage('img/items.png', itemIndex[key], 64, 64),
						new Button({
							content: 'Use',
							onPointerPress: () => {
								useItem({ gameId: gameContext.serverState.id, playerId: gameContext.playerId, item: key });

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
