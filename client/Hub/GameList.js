import { Component, List, styled } from 'vanilla-bean-components';

export const GameList = styled(
	List,
	({ colors }) => `
		padding: 0;
		overflow: visible;

		li {
			display: flex;
			margin: 6px;
			padding: 6px;
			border: 2px solid ${colors.white.setAlpha(0.4)};
			border-radius: 6px;
			list-style: none;
			text-indent: 0;

			& > button, & > a {
				margin-bottom: 0;
				height: 32px;
			}
		}
	`,
);

export const GameListText = styled(
	Component,
	() => `
		font-size: 1.2em;
		line-height: 1.6;
		padding: 0 6px;
		pointer-events: none;

		&:first-of-type {
			flex: 1;
		}
	`,
);
