import { Page, appendStyles, theme } from 'vanilla-bean-components';

import router from './router';

import '../byod-web-game/client/socket';

appendStyles(`
	@font-palette-values --void-driller-console-theme {
		font-family: 'FontWithASyntaxHighlighter';
		override-colors:
			0 ${theme.colors.white}, /* keywords */
			1 ${theme.colors.light(theme.colors.gray)}, /* comments */
			2 ${theme.colors.light(theme.colors.red)}, /* literals */
			3 ${theme.colors.light(theme.colors.orange)}, /* numbers */
			4 ${theme.colors.light(theme.colors.red)}, /* functions, [] */
			5 ${theme.colors.white}, /* others */
			6 ${theme.colors.black}, /* not in use */
			7 ${theme.colors.light(theme.colors.green)}, /* inside quotes, few chars */
			8 ${theme.colors.light(theme.colors.red)} /* quotes, tags */
	}
`);

new Page({ appendTo: document.body, append: router });
