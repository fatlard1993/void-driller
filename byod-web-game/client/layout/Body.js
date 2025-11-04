import { Component } from 'vanilla-bean-components';

export default class Body extends Component {
	constructor(options = {}, ...children) {
		super(
			{
				...options,
				styles: () => `
					overflow: hidden auto;
					flex: 1;
					position: relative;
					background-image: none;

					&::before {
						content: '';
						position: absolute;
						top: -10%;
						left: -10%;
						width: 120%;
						height: 120%;
						background-image: url('img/background.svg');
						background-size: cover;
						background-position: center;
						z-index: 0;
						animation: parallax-drift 120s ease-in-out infinite;
					}

					& > * {
						position: relative;
						z-index: 1;
					}

					@keyframes parallax-drift {
						0% {
							transform: translate(0, 0) scale(1) rotate(0deg);
						}
						12.5% {
							transform: translate(5.5%, -3.5%) scale(1.04) rotate(0.5deg);
						}
						25% {
							transform: translate(7%, 0) scale(1.08) rotate(1deg);
						}
						37.5% {
							transform: translate(5.5%, 3.5%) scale(1.12) rotate(1.5deg);
						}
						50% {
							transform: translate(0, 7%) scale(1.15) rotate(2deg);
						}
						62.5% {
							transform: translate(-5.5%, 3.5%) scale(1.12) rotate(1.5deg);
						}
						75% {
							transform: translate(-7%, 0) scale(1.08) rotate(1deg);
						}
						87.5% {
							transform: translate(-5.5%, -3.5%) scale(1.04) rotate(0.5deg);
						}
						100% {
							transform: translate(0, 0) scale(1) rotate(0deg);
						}
					}
				`,
			},
			...children,
		);
	}
}
