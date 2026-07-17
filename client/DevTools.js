import { Link, styled, theme } from '@vanilla-bean/components';

import { View } from '@fatlard1993/web-game-framework/ui/layout';
import { LevelEditor } from './DevTools/LevelEditor';

// Container styled to match other page containers (like ConsoleContainer)
const DevToolsContainer = styled.Component`
	background: ${theme.colors.black};
	border: 3px solid ${theme.colors.lighter(theme.colors.blue)};
	width: clamp(90vw, 80vw, 1700px);
	margin: 3em auto;
	border-radius: 6px;
	padding: 3px;
`;

/**
 * Developer Tools Screen
 * Container for development utilities (level editor, etc.)
 * Only accessible in development mode
 */
export default class DevTools extends View {
	static schema = {
		activeTab: { default: 'levelEditor' },
	};

	constructor(options) {
		super({
			...options,
			toolbar: {
				heading: 'SpaceCo // Development Console',
				left: [
					new Link({
						content: 'Back to Hub',
						href: '#/hub',
						variant: 'button',
					}),
				],
			},
		});
	}

	build() {
		this.container = new DevToolsContainer({ appendTo: this._body });

		this.renderTabContent(this.container);
	}

	renderTabContent(container) {
		const { activeTab } = this.options;

		if (activeTab === 'levelEditor') {
			const editor = new LevelEditor({ appendTo: container });
			console.log('LevelEditor created:', editor);
		}
	}
}
