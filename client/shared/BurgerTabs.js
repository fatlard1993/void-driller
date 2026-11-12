import { Button, styled } from '@vanilla-bean/components';

import { tabFrameAttributes, tabFrameStyles } from './frame';

const StyledTabRow = styled.Component`
	display: flex;
	flex-wrap: wrap-reverse;
	gap: ${({ space }) => space.sm};
	margin: ${({ space }) => space.sm};

	& > button {
		flex: 1;
		${tabFrameStyles}
	}

	/* The tab already showing: it keeps its focus ring, but nothing about it invites a press */
	& > button.selected-menu {
		background: transparent;
		color: ${({ colors }) => colors.success};
		font-weight: bold;
		cursor: default;

		&,
		&:hover,
		&:active {
			filter: none;
		}
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

/** A row of tabs over the panel they switch; the menu body below it is the selected tab's */
export class TabRow extends StyledTabRow {
	constructor(options = {}, ...children) {
		super({ role: 'tablist', ...options }, ...children);
	}
}

/**
 * A tab for a TabRow. The selected one says so with aria-selected and does nothing when pressed; it isn't disabled,
 * which would drop the current tab out of the keyboard's reach and read it out as unavailable
 * @param {object} options - Button options
 * @param {boolean} [options.selected] - Whether it's the selected tab
 * @returns {Button} The tab
 */
export const Tab = ({ selected = false, ...options }) =>
	new Button({
		...tabFrameAttributes(selected),
		role: 'tab',
		'aria-selected': String(selected),
		...options,
		...(selected && { addClass: 'selected-menu', onPointerPress: undefined }),
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
			icon: 'bars',
			// Not a tab itself: it shows the others
			role: null,
			'aria-selected': null,
			'aria-label': 'All tabs',
			'aria-expanded': String(this._menuExpanded),
			onPointerPress: () => {
				this._menuExpanded = !this._menuExpanded;
				// Re-render menu buttons
				this.updateMenuButtons();
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
