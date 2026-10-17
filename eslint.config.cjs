module.exports = [
	...require('@vanilla-bean/components/eslint.app.config.cjs'),
	{
		rules: {
			'jsdoc/no-undefined-types': 'off',
			'no-console': 'off',
		},
	},
];
