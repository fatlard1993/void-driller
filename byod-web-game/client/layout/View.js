import { View as BaseView } from 'vanilla-bean-components';
import Toolbar from './Toolbar';
import Body from './Body';

export default class View extends BaseView {
	render() {
		super.render();

		this._toolbar = new Toolbar({ appendTo: this, ...this.options.toolbar });

		this._body = new Body({ appendTo: this, ...this.options.body });
	}
}
