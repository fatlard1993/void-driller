import { capitalize, Component, convertRange, Dialog, Elem, Input, Label, Select } from 'vanilla-bean-components';

import SpriteSheetImage from '../shared/SpriteSheetImage';
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
			buttons: ['Cargo', 'Status', 'Items', 'Settings', 'Help', 'Close'],
			view: localStorage.getItem('console_defaultMenu') || 'Help',
			onButtonPress: ({ button }) => {
				if (this[`render_${button.toLowerCase()}`]) {
					this._body.empty();

					this[`render_${button.toLowerCase()}`]();
				} else this.close();
			},
			...options,
		});
	}

	render_cargo() {
		this.options.header = 'Console | Cargo';

		const player = gameContext.players.get(gameContext.playerId);

		this._body.append(
			Object.entries(player.inventory.cargo).flatMap(([key, value]) =>
				typeof value === 'object'
					? []
					: [new Label(key, new SpriteSheetImage(key.startsWith('mineral') ? key : `ground_${key}`), value.toString())],
			),
		);
	}

	render_status() {
		this.options.header = 'Console | Status';

		const player = gameContext.players.get(gameContext.playerId);

		this._body.append(
			new Label('Credits', `$${player.credits}`),
			new Label('Health', `${convertRange(player.health, [0, player.maxHealth], [0, 100]).toFixed(1)}%`),
			new Label('Fuel', `${player.fuel.toFixed(2)}l (${convertRange(player.fuel, [0, player.maxFuel], [0, 100]).toFixed(1)}%)`),
			new Label(
				'Cargo',
				`${player.cargo.toFixed(2)}t (${convertRange(player.cargo, [0, player.maxCargo], [0, 100]).toFixed(1)}%)`,
			),
			new Label(
				'Configuration',
				new SpriteSheetImage('drill_move1'),
				Object.entries(player.configuration).flatMap(([key, value]) =>
					typeof value === 'object' ? [] : [new Label(key, value.toString())],
				),
			),
		);
	}

	render_items() {
		this.options.header = 'Console | Items';

		const player = gameContext.players.get(gameContext.playerId);

		this._body.append(
			Object.entries(player.inventory).flatMap(([key, value]) =>
				typeof value === 'object' ? [] : [new Label(key, new SpriteSheetImage(`item_${key}`), value.toString())],
			),
		);
	}

	render_settings() {
		this.options.header = 'Console | Settings';

		this._body.append(
			new VolumeControl({ key: 'music' }),
			new VolumeControl({ key: 'alerts' }),
			new VolumeControl({ key: 'interfaces' }),
			new VolumeControl({ key: 'effects' }),
			new Label(
				'Default Console Menu',
				new Select({
					options: ['Cargo', 'Config', 'Items', 'Settings', 'Help'],
					value: localStorage.getItem('console_defaultMenu') || 'Help',
					onChange: ({ value }) => localStorage.setItem('console_defaultMenu', value),
				}),
			),
		);
	}

	render_help() {
		this.options.header = 'Console | Help';

		new Elem({ tag: 'p', content: 'Use your pointer to drag a path for your drill.', appendTo: this._body });
		new Elem({
			tag: 'p',
			content: 'Collect minerals and bring them back to spaceco to sell them.',
			appendTo: this._body,
		});
		new Elem({ tag: 'p', content: 'Use your earned credits to buy fuel and upgrades.', appendTo: this._body });
	}

	_setOption(key, value) {
		if (key === 'view') this[`render_${value.toLowerCase()}`]();
		else super._setOption(key, value);
	}
}
