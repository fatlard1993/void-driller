const globals = require('globals');
const vanillaBeanEslint = require('vanilla-bean-components/eslint.config.cjs');
const vanillaBeanSpellcheck = require('vanilla-bean-components/spellcheck.config.cjs');
const localSpellcheck = require('./spellcheck.config.cjs');

module.exports = [
	...vanillaBeanEslint,
	{
		rules: {
			'spellcheck/spell-checker': [
				'warn',
				{
					...vanillaBeanSpellcheck,
					...localSpellcheck,
					skipWords: [...vanillaBeanSpellcheck.skipWords, ...localSpellcheck.skipWords],
				},
			],
		},
	},
	{
		files: ['server/*.js', 'server/**/*.js', 'client/build.js'],
		languageOptions: {
			globals: {
				...globals.node,
				Bun: true,
			},
		},
		rules: {
			'no-console': 'off',
		},
	},
];
