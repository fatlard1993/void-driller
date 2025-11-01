import { Elem, styled } from 'vanilla-bean-components';

import gameContext from './gameContext';
import PriceDisplay from './PriceDisplay';

export class Achievement extends styled.Popover(
	({ colors }) => `
		flex-direction: column;
		top: 100px;
		left: 32px;
		border: 3px solid ${colors.lighter(colors.blue)};
		max-width: 50%;

		opacity: 0;
		transform: scaleY(0);
		transition: opacity 0.4s, transform 0.1s, overlay 0.4s allow-discrete, display 0.4s allow-discrete;

		&:popover-open {
			opacity: 1;
			transform: scaleY(1);
			transition: overlay 0.4s allow-discrete, display 0.4s allow-discrete, opacity 0.4s, transform 0.4s;
		}

		@starting-style {
			&:popover-open {
				opacity: 0;
				transform: scaleY(-1);
			}
		}

		/* Mobile responsive styles */
		@media (max-width: 768px) {
			top: 20px;
			left: 10px;
			right: 10px;
			max-width: calc(100vw - 20px);
			width: auto;

			.heading {
				margin: -6px 6px 6px -3px;
			}

			.badge {
				width: 48px;
				height: 48px;
				margin-bottom: -12px;
			}

			.title {
				font-size: 16px;
				margin-left: 8px;
				margin-top: 6px;
			}

			.summary {
				margin: 6px 0;
				font-size: 0.85em;
				padding-left: 4px;
			}

			.flavor {
				font-size: 0.85em;
			}

			.rewards {
				padding: 4px 6px;
				margin: 6px 0 4px 0;
				font-size: 0.85em;
			}

			.signature {
				margin-top: 4px;
				font-size: 9px;
			}
		}

		/* Allow pointer events on the achievement container itself for dismissing */
		pointer-events: auto;

		* {
			pointer-events: none;
		}

		&.bounce {
			animation: achievementBounce 0.4s ease-out;
		}

		@keyframes achievementBounce {
			0% {
				transform: scaleY(1) scale(1);
			}
			25% {
				transform: scaleY(1) scale(1.1);
			}
			50% {
				transform: scaleY(1) scale(0.95);
			}
			75% {
				transform: scaleY(1) scale(1.05);
			}
			100% {
				transform: scaleY(1) scale(1);
			}
		}

		.count {
			position: absolute;
			top: 0;
			right: 0;
			padding: 3px;
			background: ${colors.lighter(colors.blue)};
			color: ${colors.black};

			&:empty {
				display: none;
			}
		}

		.rewards-section {
			position: absolute;
			top: 12px;
			right: 30px;
			display: flex;
			flex-direction: column;
			gap: 4px;
			align-items: flex-end;
		}

		.reward-item {
			background: ${colors.green};
			color: ${colors.white};
			padding: 4px 10px;
			border-radius: 4px;
			font-size: 13px;
			font-weight: bold;
			white-space: nowrap;
		}

		.heading {
			margin: -12px 9px 9px -6px;
			display: flex;
			align-items: flex-start;
		}

		.badge {
			display: inline-block;
			background-image: url(img/spaceco_logo.png);
			width: 64px;
			height: 64px;
			margin-bottom: -18px;
			flex-shrink: 0;
		}

		.title {
			display: inline-block;
			font-weight: bold;
			font-size: 18px;
			margin-left: 12px;
			margin-top: 9px;
			padding-right: 120px;
			flex: 1;
		}

		.summary {
			color: ${colors.lighter(colors.green)};
			border-left: 3px solid ${colors.green};
			padding-left: 6px;
			margin: 9px 0;
			word-wrap: break-word;
			font-size: 0.9em;
		}

		.flavor {
			font-style: italic;
			word-wrap: break-word;

			&:before,
			&:after {
				content: '"';
			}
		}

		.signature {
			margin-top: 6px;
			text-indent: 6px;
			font-size: 10px;
		}
	`,
) {
	render() {
		if (gameContext.visibleAchievement) {
			gameContext.achievementQueue.push(this.options.achievement);

			gameContext.visibleAchievement.count.elem.style.display = 'block';
			gameContext.visibleAchievement.count.elem.textContent = gameContext.achievementQueue.length
				? `+${gameContext.achievementQueue.length}`
				: undefined;

			// Trigger bounce animation on the visible achievement
			gameContext.visibleAchievement.elem.classList.add('bounce');
			setTimeout(() => {
				gameContext.visibleAchievement.elem.classList.remove('bounce');
			}, 400);

			return;
		}

		if (gameContext.openDialog?.elem?.open) {
			gameContext.achievementQueue.push(this.options.achievement);

			gameContext.openDialog.elem.addEventListener('close', () => {
				if (gameContext.achievementQueue.length) {
					new Achievement({ achievement: gameContext.achievementQueue.shift() });
				}
			});

			return;
		}

		super.render();

		gameContext.sounds.achievement.play({ volume: gameContext.volume.alerts });

		gameContext.visibleAchievement = this;

		// Auto-dismiss function
		const dismissAchievement = () => {
			if (this.autoDismissTimer) {
				clearTimeout(this.autoDismissTimer);
				this.autoDismissTimer = null;
			}

			gameContext.sounds.achievement_close.play({ volume: gameContext.volume.alerts });

			this.hide();

			setTimeout(() => {
				gameContext.visibleAchievement = undefined;

				this.elem.remove();

				if (gameContext.achievementQueue.length) {
					new Achievement({ achievement: gameContext.achievementQueue.shift() });
				}
			}, 400);
		};

		this.options.onPointerDown = event => {
			if (event) {
				event.stopPropagation();
				event.preventDefault();
			}
			dismissAchievement();
		};

		this.autoDismissTimer = setTimeout(() => {
			dismissAchievement();
		}, 30 * 1000);

		this.count = new Elem({
			appendTo: this,
			className: 'count',
			textContent: gameContext.achievementQueue.length ? `+${gameContext.achievementQueue.length}` : undefined,
		});

		this.badge = new Elem({ className: 'badge' });

		this.title = new Elem({ className: 'title', textContent: this.options.achievement.name });

		this.heading = new Elem({ appendTo: this, className: 'heading' }, this.badge, this.title);

		// Create rewards section in top-right corner
		const awards = this.options.achievement.awards;
		if (awards && awards.length > 0) {
			const rewardItems = awards
				.filter(award => Array.isArray(award))
				.map(([type, amount]) => {
					if (type === 'xp') {
						return new Elem({
							className: 'reward-item',
							textContent: `+${amount} GMS`,
						});
					} else if (type === 'credits') {
						return new Elem(
							{
								className: 'reward-item',
								style: { display: 'flex', alignItems: 'center', gap: '4px' },
							},
							new Elem({ content: '+' }),
							new PriceDisplay({
								amount,
								size: 14,
								variant: 'success',
							}),
						);
					} else {
						return new Elem({
							className: 'reward-item',
							textContent: `+${amount} ${type.charAt(0).toUpperCase() + type.slice(1).replaceAll('_', ' ')}`,
						});
					}
				});

			if (rewardItems.length > 0) {
				this.rewardsSection = new Elem({
					appendTo: this,
					className: 'rewards-section',
					append: rewardItems,
				});
			}
		}

		this.summary = new Elem({ appendTo: this, className: 'summary', textContent: this.options.achievement.summary });

		this.flavor = new Elem({ appendTo: this, className: 'flavor', textContent: this.options.achievement.flavor });

		this.signature = new Elem({ appendTo: this, className: 'signature', textContent: '- SpaceCo Internal Metrics' });
	}
}
