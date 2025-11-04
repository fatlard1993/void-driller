import { Elem, Button, Icon, theme } from 'vanilla-bean-components';

/**
 * Collapsible hamburger menu tabs component
 * Shows hamburger + selected tab, expands to show all tabs when clicked
 */
export default class BurgerTabs {
	constructor(options) {
		this.options = options;
		this._menuExpanded = false;

		// Create expandable menu container (appears above fixed buttons)
		this._expandableMenu = new Elem({
			className: 'menu',
			appendTo: options.appendTo,
			style: { marginBottom: '0px' },
		});

		// Create fixed menu container (hamburger + selected tab, always visible)
		this._menuContainer = new Elem({
			className: 'menu',
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

		const {
			tabs = [],
			selectedTab,
			onTabClick,
			isTabEmpty = () => false,
			getTabClassName = () => '',
		} = this.options;

		console.log('BurgerTabs updateMenuButtons', { tabs, selectedTab, expanded: this._menuExpanded });

		// Clear both sections
		this._expandableMenu.empty();
		this._menuContainer.empty();

		// Add expanded menu buttons to expandable section (above fixed buttons)
		if (this._menuExpanded) {
			tabs.forEach(tab => {
				if (tab === selectedTab) return; // Skip selected tab

				const isEmpty = isTabEmpty(tab);
				const className = isEmpty ? 'empty-menu' : getTabClassName(tab);

				new Button({
					appendTo: this._expandableMenu,
					content: tab,
					onPointerPress: () => {
						this._menuExpanded = false; // Collapse menu BEFORE triggering callback
						if (onTabClick) onTabClick(tab);
					},
					disabled: isEmpty,
					className,
				});
			});
		}

		// Hamburger button (always in fixed position)
		const hamburger = new Button({
			appendTo: this._menuContainer,
			content: new Icon({ icon: 'bars' }),
			onPointerPress: () => {
				this._menuExpanded = !this._menuExpanded;
				console.log('Hamburger clicked, expanded now:', this._menuExpanded);
				// Re-render menu buttons
				this.updateMenuButtons();
			},
			style: {
				backgroundColor: this._menuExpanded ? theme.colors.red : '',
			},
		});
		console.log('Hamburger button created:', hamburger);

		// Selected tab button (always in fixed position, after hamburger)
		if (selectedTab) {
			const selectedButton = new Button({
				appendTo: this._menuContainer,
				content: selectedTab,
				className: 'selected-menu',
				disabled: true,
			});
			console.log('Selected tab button created:', selectedTab, selectedButton);
		} else {
			console.log('No selectedTab to display');
		}
	}
}
