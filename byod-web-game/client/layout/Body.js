import { Component } from 'vanilla-bean-components';

export default class Body extends Component {
	constructor(options = {}, ...children) {
		super(
			{
				...options,
				styles: () => `
					overflow: hidden auto;
					flex: 1;
					background-image: url('img/background.svg');
				`,
			},
			...children,
		);
	}
}
