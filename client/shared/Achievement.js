import { Elem, styled } from 'vanilla-bean-components';

import { formatNotificationAchievementRewards } from '../../utils';
import gameContext from './gameContext';

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

		.heading {
			margin: -12px 9px 9px -6px;
		}

		.badge {
			display: inline-block;
			background-image: url(img/spaceco_logo.png);
			width: 64px;
			height: 64px;
			margin-bottom: -18px;
		}

		.title {
			display: inline-block;
			font-weight: bold;
			font-size: 18px;
			margin-left: 12px;
			margin-top: 9px;
		}

		.summary {
			color: ${colors.lighter(colors.gray)};
			border-left: 3px solid;
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

		.rewards {
			background: ${colors.darker(colors.green).setAlpha(0.2)};
			border: 1px solid ${colors.green.setAlpha(0.4)};
			border-radius: 3px;
			padding: 6px 9px;
			margin: 9px 0 6px 0;
			color: ${colors.lighter(colors.green)};
			font-weight: bold;
			font-size: 0.9em;
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

		// Manual dismiss on click - prevent event from bubbling to game canvas
		this.onPointerPress((event) => {
			// Stop the click event from propagating to the game canvas
			if (event) {
				event.stopPropagation();
				event.preventDefault();
			}
			dismissAchievement();
		});

		// Auto-dismiss after 4 seconds
		this.autoDismissTimer = setTimeout(() => {
			dismissAchievement();
		}, 4000);

		this.count = new Elem({
			appendTo: this,
			className: 'count',
			textContent: gameContext.achievementQueue.length ? `+${gameContext.achievementQueue.length}` : undefined,
		});

		this.badge = new Elem({ className: 'badge' });

		this.title = new Elem({ className: 'title', textContent: this.options.achievement.name });

		this.heading = new Elem({ appendTo: this, className: 'heading' }, this.badge, this.title);

		this.summary = new Elem({ appendTo: this, className: 'summary', textContent: this.options.achievement.summary });

		// Add rewards display if achievement has awards
		const rewardsText = formatNotificationAchievementRewards(this.options.achievement.awards);
		if (rewardsText) {
			this.rewards = new Elem({ appendTo: this, className: 'rewards', textContent: rewardsText });
		}

		this.flavor = new Elem({ appendTo: this, className: 'flavor', textContent: this.options.achievement.flavor });

		this.signature = new Elem({ appendTo: this, className: 'signature', textContent: '- SpaceCo Internal Metrics' });
	}
}
