import { Button, Icon, styled, theme } from '@vanilla-bean/components';

import { tabFrameAttributes, tabFrameStyles } from './frame';

/** A row of tabs over the panel they switch; the menu body below it is the selected tab's */
export const TabRow = styled.Component`
	display: flex;
	flex-wrap: wrap-reverse;
	gap: ${({ space }) => space.sm};
	margin: ${({ space }) => space.sm};

	& > button {
		flex: 1;
		${tabFrameStyles}
	}

	& > button.selected-menu {
		background: transparent;
		color: ${({ colors }) => colors.success};
		font-weight: bold;
	}

	/* A tab with nothing behind it */
	& > button.empty-menu {
		opacity: 0.7;
		color: ${({ colors }) => colors.muted};
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 2px,
			${({ colors }) => colors.alpha(colors.gray, 0.1)} 2px,
			${({ colors }) => colors.alpha(colors.gray, 0.1)} 4px
		);
	}
`;

/**
 * A tab for a TabRow; the selected one is already pressed, so it's disabled
 * @param {object} options - Button options
 * @param {boolean} [options.selected] - Whether it's the selected tab
 * @returns {Button} The tab
 */
export const Tab = ({ selected = false, ...options }) =>
	new Button({
		...tabFrameAttributes(selected),
		...options,
		...(selected && { addClass: 'selected-menu', disabled: true }),
	});

/**
 * Collapsible hamburger menu tabs component
 * Shows hamburger + selected tab, expands to show all tabs when clicked
 */
export default class BurgerTabs {
	constructor(options) {
		this.options = options;
		this._menuExpanded = false;

		// Create expandable menu container (appears above fixed buttons)
		this._expandableMenu = new TabRow({
			addClass: 'menu',
			appendTo: options.appendTo,
			style: { marginBottom: '0px' },
		});

		// Create fixed menu container (hamburger + selected tab, always visible)
		this._menuContainer = new TabRow({
			addClass: 'menu',
			appendTo: options.appendTo,
		});

		// Render menu buttons
		this.updateMenuButtons();
	}

	updateMenuButtons() {
		if (!this._menuContainer || !this._expandableMenu) {
			console.warn('BurgerTabs containers not ready');
			return;
		}

		const { tabs = [], selectedTab, onTabClick, isTabEmpty = () => false, getTabClassName = () => '' } = this.options;

		// Clear both sections
		this._expandableMenu.empty();
		this._menuContainer.empty();

		// Add expanded menu buttons to expandable section (above fixed buttons)
		if (this._menuExpanded) {
			tabs.forEach(tab => {
				if (tab === selectedTab) return; // Skip selected tab

				const isEmpty = isTabEmpty(tab);

				Tab({
					appendTo: this._expandableMenu,
					content: tab,
					onPointerPress: () => {
						this._menuExpanded = false; // Collapse menu BEFORE triggering callback
						if (onTabClick) onTabClick(tab);
					},
					disabled: isEmpty,
					addClass: isEmpty ? 'empty-menu' : getTabClassName(tab),
				});
			});
		}

		// Hamburger button (always in fixed position)
		Tab({
			appendTo: this._menuContainer,
			content: new Icon({ icon: 'bars' }),
			onPointerPress: () => {
				this._menuExpanded = !this._menuExpanded;
				// Re-render menu buttons
				this.updateMenuButtons();
			},
			style: {
				backgroundColor: this._menuExpanded ? theme.colors.danger : '',
			},
		});

		// Selected tab button (always in fixed position, after hamburger)
		if (selectedTab) {
			Tab({
				appendTo: this._menuContainer,
				content: selectedTab,
				selected: true,
			});
		}
	}
}
