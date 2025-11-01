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

			@media (max-width: 768px) {
				flex-wrap: wrap;
				gap: 6px;
				position: relative;
			}

			& > button, & > a {
				margin-bottom: 0;
				height: 32px;

				@media (max-width: 768px) {
					flex: 1 1 auto;
					min-width: 80px;
				}
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

		@media (max-width: 768px) {
			/* First text (name) forces new line by taking full width */
			&:first-of-type {
				order: -2;
				flex: 0 0 100%;
				padding-right: 60px; /* Make room for player count */
			}

			/* Last text (player count) positioned absolutely on the right */
			&:last-of-type {
				order: -1;
				position: absolute;
				top: 6px;
				right: 6px;
				padding: 0 6px;
			}
		}
	`,
);
