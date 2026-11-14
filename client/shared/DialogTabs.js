import { Elem, Tabs, styled } from '@vanilla-bean/components';

import { cutCorners, frameColor } from './frame';

/** The library's Tabs in the game's frame: each tab's top right corner cut, the selected one ruled in the frame's color */
const FrameTabs = styled(
	Tabs,
	({ colors, media, space }) => `
		--tab-corner: ${space.md};

		margin-bottom: ${space.sm};
		box-shadow: inset 0 -2px ${colors.alpha(frameColor, 0.35)};

		& > .vbc-button {
			clip-path: ${cutCorners('var(--tab-corner)', ['tr'])};
			border-radius: 0;
			background-color: ${colors.alpha(colors.teal, 0.08)};
		}

		& > .vbc-button[aria-selected='true'] {
			border-bottom-color: ${frameColor};
			background-color: ${colors.alpha(colors.teal, 0.2)};
		}

		@media ${media.phone} {
			--tab-corner: ${space.sm};
		}
	`,
);

/**
 * A dialog's one row of tabs, each over its own panel. show() selects a tab and gives back a fresh body in its panel
 * for the view to build in: a view still loading into the body it was given (a doc, a briefing) fills that body, which
 * is no longer shown, not the one showing now.
 * @example
 * const tabs = new DialogTabs({ appendTo: dialog._body, tabs: [{ id: 'cargo', label: 'Cargo' }], onChange: show });
 * const body = tabs.show('cargo');
 */
export class DialogTabs {
	/**
	 * @param {object} options - Options
	 * @param {object} options.appendTo - Where the row and its panels go
	 * @param {Array<{ id: string, label: string, disabled?: boolean }>} options.tabs - The tabs, in order
	 * @param {Function} options.onChange - Hears the id of the tab the player chose
	 */
	constructor({ appendTo, tabs, onChange }) {
		this.panels = Object.fromEntries(tabs.map(({ id }) => [id, new Elem({ className: 'menuBody' })]));
		this.row = new FrameTabs({ appendTo, tabs, panels: this.panels, onChange: ({ value }) => onChange(value) });
		this._tabsKey = JSON.stringify(tabs);

		// The row has no width until its dialog opens, which is after the first tab is shown; and turning a phone changes its width
		const observer = new ResizeObserver(() => this.revealSelected());

		observer.observe(this.row.elem);
		this.row.addCleanup('revealSelected', () => observer.disconnect());

		appendTo.append(Object.values(this.panels));
	}

	/**
	 * Takes the tabs again (one emptied or filled since), redrawing the row only when one changed, and keeping the
	 * keyboard's place on it
	 * @param {Array<{ id: string, label: string, disabled?: boolean }>} tabs - The tabs, in order
	 */
	update(tabs) {
		const tabsKey = JSON.stringify(tabs);

		if (tabsKey === this._tabsKey) return;

		this._tabsKey = tabsKey;

		const hadFocus = this.row.elem.contains(document.activeElement);

		this.row.options.tabs = tabs;

		if (hadFocus) this.row.elem.querySelector('[aria-selected="true"]')?.focus();
	}

	/**
	 * Scrolls the selected tab into the row's view: the row scrolls sideways on a phone, and Tabs brings a tab into view
	 * only when the keyboard focuses it
	 */
	revealSelected() {
		this.row.elem.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}

	/**
	 * Selects a tab and empties its panel
	 * @param {string} id - The tab's id
	 * @returns {Elem} A fresh body in the tab's panel
	 */
	show(id) {
		this.row.options.selected = id;

		this.revealSelected();

		const panel = this.panels[id];

		panel.empty();

		return new Elem({ appendTo: panel });
	}
}
