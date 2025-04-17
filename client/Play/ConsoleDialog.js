import { capitalize, Component, Dialog, Elem, Input, Label, Select } from 'vanilla-bean-components';

import imageMap from '../img/map.json';
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

class SpriteSheetImage extends Elem {
	constructor(key) {
		super({
			style: {
				backgroundImage: 'url(/img/map.png)',
				backgroundPosition: `-${imageMap.frames[key].frame.x}px -${imageMap.frames[key].frame.y}px`,
				width: `${imageMap.frames[key].frame.w}px`,
				height: `${imageMap.frames[key].frame.h}px`,
			},
		});
	}
}

export default class ConsoleDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			header: 'Console',
			buttons: ['Cargo', 'Config', 'Items', 'Settings', 'Help', 'Close'],
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

	render_config() {
		this.options.header = 'Console | Config';

		const player = gameContext.players.get(gameContext.playerId);

		this._body.append(
			new SpriteSheetImage('drill_move1'),
			Object.entries(player.configuration).flatMap(([key, value]) =>
				typeof value === 'object' ? [] : [new Label(key, value.toString())],
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
