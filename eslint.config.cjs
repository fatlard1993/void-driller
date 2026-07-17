const globals = require('globals');
const vanillaBeanEslint = require('@vanilla-bean/components/eslint.config.cjs');
const vanillaBeanSpellcheck = require('@vanilla-bean/components/spellcheck.config.cjs');
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
	{
		// app profile: jsdoc coverage and console policy are relaxed for application code
		rules: {
			'import/no-unresolved': [1, { ignore: ['bun', 'bun:test', '\\.asText$', '^lowdb'] }],
			'jsdoc/no-undefined-types': 'off',
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-description': 'off',
			'no-console': 'off',
		},
	},
];
