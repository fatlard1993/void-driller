import { Link, Button, Form } from 'vanilla-bean-components';

import { View } from '../../layout';
import { createGame } from '../../api';
// Note: ConsoleContainer import removed - game implementation provides this

export default class Create extends View {
	constructor(options, ...children) {
		super(
			{
				formInputs: [{ key: 'name', label: 'Room Name' }],
				...options,
				toolbar: {
					heading: options.toolbar?.heading || 'New Game',
					left: [
						new Link({
							textContent: options.toolbar?.backText || 'Back to Hub',
							href: options.toolbar?.backHref || '#/hub',
							variant: 'button',
						}),
					],
					right: [
						new Button({
							textContent: options.toolbar?.createText || 'Create Game',
							onPointerPress: async () => {
								if (this.form.validate()) return;

								const game = (await createGame({ body: { ...this.form.options.data } })).body;

								window.location.href = `#/join/${game.id}`;
							},
						}),
					],
				},
			},
			...children,
		);
	}

	async render() {
		super.render();

		this.form = new Form({
			style: {
				margin: '12px 0 12px 12px',
				paddingRight: '12px',
			},
			data: this.options.subscriber('formData'),
			inputs: this.options.subscriber('formInputs'),
		});

		// Allow games to provide their own container component and content
		if (this.options.containerComponent) {
			const ContainerComponent = this.options.containerComponent;
			this.container = new ContainerComponent(
				{
					appendTo: this._body,
					textContent: this.options.containerText || '> [SYSTEM] Creating new game.\n> Fill out required fields.',
				},
				this.form,
			);
		} else {
			// Default behavior - append the form directly
			this._body.append(this.form);
		}
	}
}
