import {
	capitalize,
	Component,
	convertRange,
	Elem,
	Input,
	Label,
	List,
	Select,
	Button,
	rand,
	randInt,
	theme,
	configured,
	GET,
	styled,
	orderBy,
} from 'vanilla-bean-components';

import { DrillImage, EngineImage, ItemImage, MineralImage, PartImage, VehicleImage } from '../shared/SpriteSheetImage';
import { Card } from '../shared/Card';
import { CardGrid } from '../shared/CardGrid';
import { useItem, disarmBomb, spacecoBuyRescue } from '../api';
import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { drills, engines, items, minerals, parts, playerAchievements, vehicles } from '../../constants';
import { ConfigStat } from '../shared/ConfigStat';
import { DescriptionText } from '../shared/DescriptionText';
import { InfoButton } from '../shared/InfoButton';
import Notify from '../shared/Notify';
import { formatPlayerAchievementRewards } from '../../utils';
import audioPlayer from '../shared/AudioPlayer';
import {
	toggleAutoPath,
	setAutoPathRadius,
	addToIgnoreList,
	removeFromIgnoreList,
	clearIgnoreList,
} from './inputs/pointer';

const CollapsibleLabel = configured(Label, { variant: 'collapsible' });

class AlertControl extends Component {
	render() {
		new Label(
			{
				appendTo: this,
				label: gameContext.subscriber(
					'alert',
					alert => `${capitalize(this.options.key)} (${parseInt(alert[this.options.key] * 100)}%)`,
				),
			},
			new Input({
				type: 'range',
				min: 0,
				max: 100,
				step: 1,
				value: gameContext.alert[this.options.key] * 100,
				onChange: ({ value }) => {
					gameContext.alert = { ...gameContext.alert, [this.options.key]: parseFloat(value / 100) };

					localStorage.setItem('alert', JSON.stringify(gameContext.alert));

					gameContext.dismissedAlerts[this.options.key] = false;
				},
			}),
		);
	}
}

class VolumeControl extends Component {
	render() {
		new Label(
			{
				appendTo: this,
				label: gameContext.subscriber(
					'volume',
					volume => `${capitalize(this.options.key)} (${parseInt(volume[this.options.key] * 100)}%)`,
				),
			},
			new Input({
				type: 'range',
				min: 0,
				max: 100,
				step: 1,
				value: gameContext.volume[this.options.key] * 100,
				onChange: ({ value }) => {
					gameContext.volume = { ...gameContext.volume, [this.options.key]: parseFloat(value / 100) };

					localStorage.setItem('volume', JSON.stringify(gameContext.volume));
				},
			}),
		);
	}
}

class ScaleControl extends Component {
	render() {
		new Label(
			{
				appendTo: this,
				label: gameContext.subscriber('scale', scale => `Camera Zoom (${parseInt(scale * 100)}%)`),
			},
			new Input({
				type: 'range',
				min: 30,
				max: 150,
				step: 5,
				value: gameContext.scale * 100,
				onChange: ({ value }) => {
					const newScale = parseFloat(value / 100);
					gameContext.scale = newScale;

					// Apply the new scale instantly
					if (gameContext.scene?.cameras?.main) {
						gameContext.scene.cameras.main.setZoom(newScale);
					}

					localStorage.setItem('scale', JSON.stringify(newScale));
				},
			}),
		);
	}
}

class DebugControl extends Component {
	render() {
		new Label(
			{
				appendTo: this,
				label: 'Show Debug Log',
			},
			new Input({
				type: 'checkbox',
				checked: gameContext.debugVisible,
				onChange: ({ checked }) => {
					gameContext.debugVisible = checked;
					localStorage.setItem('debugVisible', JSON.stringify(checked));

					// Update debug log component visibility directly
					if (window.debugLogComponent) {
						window.debugLogComponent.setVisibility(checked);
					}
				},
			}),
		);
	}
}

class AutoPathControl extends Component {
	render() {
		super.render();

		new Label(
			{
				appendTo: this,
				label: 'Auto-Path Enabled',
			},
			new Input({
				type: 'checkbox',
				checked: gameContext.autoPath.enabled,
				onChange: () => {
					toggleAutoPath();
				},
			}),
		);

		new Label(
			{
				appendTo: this,
				label: `Auto-Path Radius (${gameContext.autoPath.maxRadius})`,
			},
			new Input({
				type: 'range',
				min: 4,
				max: 12,
				step: 1,
				value: gameContext.autoPath.maxRadius,
				onChange: ({ value }) => {
					setAutoPathRadius(parseInt(value, 10));
				},
			}),
		);

		new Label(
			{
				appendTo: this,
				label: 'Auto-Path Strategy',
			},
			new Select({
				options: [
					{ label: 'Prefer Easier Paths', value: 'prefer_easier' },
					{ label: 'Prefer Open Spaces', value: 'prefer_open' },
					{ label: 'Prefer Strongest Minerals', value: 'prefer_strongest' },
				],
				value: gameContext.autoPath.strategy,
				onChange: ({ value }) => {
					gameContext.autoPath.strategy = value;
					localStorage.setItem('autoPath', JSON.stringify(gameContext.autoPath));
				},
			}),
		);

		new Label(
			{
				appendTo: this,
				label: `Obstacle Avoidance (${gameContext.autoPath.obstacleAvoidanceWeight.toFixed(1)})`,
			},
			new Input({
				type: 'range',
				min: 0.5,
				max: 5.0,
				step: 0.1,
				value: gameContext.autoPath.obstacleAvoidanceWeight,
				onChange: ({ value }) => {
					gameContext.autoPath.obstacleAvoidanceWeight = parseFloat(value);
					localStorage.setItem('autoPath', JSON.stringify(gameContext.autoPath));
				},
			}),
		);

		new Label(
			{
				appendTo: this,
				label: `Search Iterations (${gameContext.autoPath.maxSearchIterations})`,
			},
			new Input({
				type: 'range',
				min: 500,
				max: 5000,
				step: 100,
				value: gameContext.autoPath.maxSearchIterations,
				onChange: ({ value }) => {
					gameContext.autoPath.maxSearchIterations = parseInt(value, 10);
					localStorage.setItem('autoPath', JSON.stringify(gameContext.autoPath));
				},
			}),
		);

		new Label(
			{
				appendTo: this,
				label: 'Prefer Open Spaces',
			},
			new Input({
				type: 'checkbox',
				checked: gameContext.autoPath.preferOpenSpaces,
				onChange: ({ checked }) => {
					gameContext.autoPath.preferOpenSpaces = checked;
					localStorage.setItem('autoPath', JSON.stringify(gameContext.autoPath));
				},
			}),
		);

		this.renderIgnoreList();
	}

	renderIgnoreList() {
		const ignoreListContainer = new Elem({ appendTo: this });

		new Label({ appendTo: ignoreListContainer, label: 'Ignored Minerals' });

		if (gameContext.autoPath.ignore.length > 0) {
			const ignoreList = new Elem({
				appendTo: ignoreListContainer,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 150px))',
					justifyContent: 'center',
					gap: '6px',
					marginBottom: '6px',
				},
			});

			gameContext.autoPath.ignore.forEach(mineralType => {
				const mineralConfig = minerals[mineralType];
				if (mineralConfig) {
					new Button({
						appendTo: ignoreList,
						content: `${mineralConfig.name} ✕`,
						style: { fontSize: '0.9em', padding: '3px 6px' },
						onPointerPress: () => {
							removeFromIgnoreList(mineralType);
							this.refresh();
						},
					});
				}
			});

			new Button({
				appendTo: ignoreListContainer,
				content: 'Clear All',
				style: { fontSize: '0.9em', marginBottom: '6px' },
				onPointerPress: () => {
					clearIgnoreList();
					this.refresh();
				},
			});
		}

		const availableMinerals = Object.entries(minerals).filter(([key]) => !gameContext.autoPath.ignore.includes(key));

		if (availableMinerals.length > 0) {
			new Label(
				{ appendTo: ignoreListContainer, label: 'Add to Ignore List' },
				new Select({
					options: [
						{ label: 'Select mineral', value: '' },
						...availableMinerals.map(([key, mineral]) => ({
							label: mineral.name,
							value: key,
						})),
					],
					onChange: ({ value }) => {
						if (value) {
							addToIgnoreList(value);
							this.refresh();
						}
					},
				}),
			);
		}
	}

	refresh() {
		this.empty();
		this.render();
	}
}

export default class ConsoleDialog extends (styled(BaseDialog)`
	button {
		white-space: initial;
	}

	.menu {
		display: flex;
		flex-wrap: wrap-reverse;
		gap: 6px;
		margin: 6px;

		button {
			flex: 1;
		}

		button:disabled {
			background: transparent;
			color: ${({ colors }) => colors.green} !important;
			font-weight: bold;


			&:before {
				content: '';
				background-color: ${({ colors }) => colors.white.setAlpha(0.02)};
				width: calc(100% - 3px);
				height: calc(100% + 17px);
				position: absolute;
				top: -12px;
				left: -3px;
			}

			&:after {
				content: none;
			}
		}
	}

	.menuBody {
		background-color: ${({ colors }) => colors.white.setAlpha(0.04)};
		padding: 9px 18px;
	}

	p.description {
		color: ${({ colors }) => colors.lighter(colors.gray)};
		border-left: 3px solid;
		padding-left: 6px;
		word-wrap: break-word;
	}

	p.quote {
		color: ${({ colors }) => colors.light(colors.gray)};
		word-wrap: break-word;
		font-size: 0.9em;
		font-style: italic;

		&:before,
		&:after {
			content: '"';
		}
	}

	.achievement {
		width: clamp(130px, 27%, 300px);

		label {
			display: inline-block;
			margin-left: 3px;
		}

		&.unlocked {
			background: ${({ colors }) => colors.darkest(colors.green)};
			border: ${({ colors }) => `3px solid ${colors.green}`};
			border-radius: 6px;
		}
	}

	.rescueButton {
		background-color: ${({ colors }) => colors.darkest(colors.red)} !important;
		border: 2px solid ${({ colors }) => colors.red} !important;
		color: ${({ colors }) => colors.red} !important;
		font-weight: bold !important;
		animation: pulse 2s infinite;

		&:hover {
			background-color: ${({ colors }) => colors.darker(colors.red)} !important;
		}

		&:disabled {
			opacity: 0.5;
			background-color: ${({ colors }) => colors.darkest(colors.gray)} !important;
			border-color: ${({ colors }) => colors.gray} !important;
			color: ${({ colors }) => colors.gray} !important;
		}
	}
`) {
	constructor(options = {}) {
		const player = gameContext.players.currentPlayer;
		// Player needs rescue if they can't move due to insufficient fuel or no health
		// Basic fuel consumption is 0.3 / fuelEfficiency (minimum to move one tile)
		const basicFuelConsumption = player ? 0.3 / (player.fuelEfficiency || 1) : 0;
		const needsRescue = (player?.fuel < basicFuelConsumption) || player?.health <= 0;

		// Build buttons array - add rescue button if player needs rescue
		const buttons = [];

		if (needsRescue) {
			buttons.push({
				textContent: player.credits >= 50 ? 'SpaceCo Emergency Rescue ($50)' : 'SpaceCo Emergency Rescue ($50) - Insufficient Funds',
				addClass: ['rescueButton'],
				disabled: player.credits < 50,
			});
		}

		buttons.push('Close');

		super({
			header: 'Console',
			view: localStorage.getItem('console_defaultMenu') || 'help_Docs',
			buttons,
			onButtonPress: ({ button, closeDialog }) => {
				// Handle rescue button
				if (button.textContent?.includes('SpaceCo Emergency Rescue')) {
					spacecoBuyRescue();
					closeDialog();
				} else {
					// Handle close button
					this.handleClose();
				}
			},
			...options,
		});
	}

	renderMenu() {
		new Elem(
			{ className: 'menu', appendTo: this._body },
			['Cargo', 'Items', 'Status', 'Settings', 'Help'].map(
				view =>
					new Button({
						content: view,
						onPointerPress: () => {
							InfoButton.closeAllPopovers();
							this.options.view = view;
						},
						disabled: this.options.view.toLowerCase().startsWith(view.toLowerCase()),
					}),
			),
		);

		this._menuBody = new Elem({ className: 'menuBody', appendTo: this._body });
	}

	render_cargo() {
		const player = gameContext.players.currentPlayer;
		let credits = 0;

		const total = new Elem({ content: 'Total', appendTo: this._menuBody });

		new CardGrid({
			appendTo: this._menuBody,
			content: Object.keys(minerals).flatMap(name => {
				const dirtyCount = player.hull[name] || 0;
				const pureCount = player.hull[`mineral_${name}`] || 0;

				if (!dirtyCount && !pureCount) return [];

				const demandDrop = (gameContext.serverState.world.spaceco.hull?.[name] || 0) / 1000;
				const baseValue = minerals[name].value;

				const dirtyPrice = dirtyCount ? Math.max(0.01, (baseValue / 2 - demandDrop) * dirtyCount) : 0;
				const purePrice = pureCount ? Math.max(0.01, (baseValue - demandDrop) * pureCount) : 0;

				credits += dirtyPrice + purePrice;

				return [
					new Card({
						header: capitalize(minerals[name].name),
						style: { width: '216px', paddingBottom: '60px', position: 'relative', overflow: 'hidden' },
						body: new Elem({
							append: [
								new Elem({
									tag: 'pre',
									content: `Dirty: ${dirtyCount.toString()}t = $${dirtyPrice.toFixed(2)}\nPure: ${pureCount.toString()}kg = $${purePrice.toFixed(2)}`,
									style: { margin: 0, whiteSpace: 'pre-wrap' },
								}),
								...[...Array(Math.min(dirtyCount, 50))].map(
									() =>
										new MineralImage(name.replace('mineral_', ''), {
											position: 'absolute',
											transform: `scale(${rand(0.3, 0.5)}) translate(${randInt(-22, 190)}px, ${randInt(-10, 60)}px)`,
										}),
								),
								...[...Array(Math.min(pureCount, 50))].map(
									() =>
										new MineralImage(name.replace('mineral_', ''), {
											position: 'absolute',
											transform: `scale(${rand(0.5, 0.8)}) translate(${randInt(-22, 190)}px, ${randInt(-10, 60)}px)`,
										}),
								),
							],
						}),
					}),
				];
			}),
		});

		total.content(`Total: $${credits.toFixed(2)}`);
	}

	renderStatusMenu() {
		new Elem(
			{ className: 'menu', appendTo: this._menuBody },
			['Current', 'Rig', 'Achievements', 'Minerals', 'Items'].map(
				view =>
					new Button({
						content: view,
						onPointerPress: () => {
							this.options.view = `status_${view}`;
						},
						disabled: this.options.view === `status_${view}`,
					}),
			),
		);

		this._subMenuBody = new Elem({ className: 'menuBody', appendTo: this._menuBody });
	}

	render_status() {
		this.options.view = 'status_Current';
	}

	render_status_current() {
		this.renderStatusMenu();

		const player = gameContext.players.currentPlayer;
		const currentItemCount = Object.values(player.items).reduce((sum, count) => sum + count, 0);

		const cargoWeightRatio = player.cargo / player.maxCargo;
		const fuelEfficiencyDisplay = player.fuelEfficiency / (1.0 + cargoWeightRatio * 0.2);

		this._subMenuBody.append(
			new Label('Position', `X: ${player.position.x} | Y: ${player.position.y}`),
			new Label(
				'Current Stats',
				new List({
					items: [
						`Credits: $${player.credits.toFixed(2)}`,
						`Health: ${player.health}hp / ${player.maxHealth}hp (${convertRange(player.health, [0, player.maxHealth], [0, 100]).toFixed(1)}%)`,
						`Fuel: ${player.fuel.toFixed(1)}l / ${player.maxFuel}l (${convertRange(player.fuel, [0, player.maxFuel], [0, 100]).toFixed(1)}%)`,
						`Cargo: ${player.cargo.toFixed(2)}t / ${player.maxCargo}t (${convertRange(player.cargo, [0, player.maxCargo], [0, 100]).toFixed(1)}%)`,
						`Inventory: ${currentItemCount} / ${player.maxItemSlots} slots (${convertRange(currentItemCount, [0, player.maxItemSlots], [0, 100]).toFixed(1)}%)`,
					],
				}),
			),
			new Label(
				'Totals',
				new List({
					items: [
						`Max Health: ${player.maxHealth}hp`,
						`Max Fuel: ${player.maxFuel}l`,
						`Max Cargo: ${player.maxCargo}t`,
						`Torque: ${player.torque}`,
						`Max Item Slots: ${player.maxItemSlots}`,
						`Fuel Efficiency: ${fuelEfficiencyDisplay.toFixed(2)} (${player.fuelEfficiency} base - cargo weight penalty)`,
					],
				}),
			),
			new Label(
				'Stats',
				new List({
					items: Object.entries(player.stats).flatMap(([key, value]) => {
						if (typeof value !== 'number') return [];

						return [`${capitalize(key.replaceAll('_', ' '), true)}: ${value}`];
					}),
				}),
			),
		);
	}

	render_status_rig() {
		this.renderStatusMenu();

		const player = gameContext.players.currentPlayer;
		const vehicleConfig = vehicles[player.configuration.vehicle];
		const drillConfig = drills[player.configuration.drill];
		const engineConfig = engines[player.configuration.engine];
		const partConfig = parts[player.configuration.part];

		this._subMenuBody.append(
			new Label(
				'Configuration',
				new CardGrid({
					content: [
						new Card({
							header: `Vehicle: ${vehicleConfig.name}`,
							body: new Elem({
								style: {
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '4px',
								},
								append: [
									new VehicleImage(vehicleConfig.spriteIndex, { displaySize: 96 }),
									new DescriptionText({
										summary: vehicleConfig.summary || '',
										description: vehicleConfig.description || '',
										title: vehicleConfig.name,
									}),
									new Elem({
										style: {
											display: 'flex',
											flexDirection: 'column',
											gap: '8px',
											width: '100%',
										},
										append: [
											new ConfigStat({ label: 'Max Health', value: vehicleConfig.maxHealth }),
											new ConfigStat({ label: 'Max Fuel', value: vehicleConfig.maxFuel }),
											new ConfigStat({ label: 'Max Cargo', value: vehicleConfig.maxCargo }),
											new ConfigStat({ label: 'Fuel Efficiency', value: vehicleConfig.fuelEfficiency }),
										],
									}),
								],
							}),
						}),
						new Card({
							header: `Drill: ${drillConfig.name}`,
							body: new Elem({
								style: {
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '4px',
								},
								append: [
									new DrillImage(drillConfig.spriteIndex, { displaySize: 96 }),
									new DescriptionText({
										summary: drillConfig.summary || '',
										description: drillConfig.description || '',
										title: drillConfig.name,
									}),
									new Elem({
										style: {
											display: 'flex',
											flexDirection: 'column',
											gap: '8px',
											width: '100%',
										},
										append: [
											new ConfigStat({ label: 'Max Health', value: drillConfig.maxHealth }),
											new ConfigStat({ label: 'Fuel Efficiency', value: drillConfig.fuelEfficiency }),
											new ConfigStat({ label: 'Strength', value: drillConfig.strength }),
										],
									}),
								],
							}),
						}),
						new Card({
							header: `Engine: ${engineConfig.name}`,
							body: new Elem({
								style: {
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '4px',
								},
								append: [
									new EngineImage(engineConfig.spriteIndex, { displaySize: 96 }),
									new DescriptionText({
										summary: engineConfig.summary || '',
										description: engineConfig.description || '',
										title: engineConfig.name,
									}),
									new Elem({
										style: {
											display: 'flex',
											flexDirection: 'column',
											gap: '8px',
											width: '100%',
										},
										append: [
											new ConfigStat({ label: 'Max Health', value: engineConfig.maxHealth }),
											new ConfigStat({ label: 'Max Fuel', value: engineConfig.maxFuel }),
											new ConfigStat({ label: 'Max Cargo', value: engineConfig.maxCargo }),
											new ConfigStat({ label: 'Torque', value: engineConfig.torque }),
											new ConfigStat({ label: 'Max Item Slots', value: engineConfig.maxItemSlots }),
											new ConfigStat({ label: 'Fuel Efficiency', value: engineConfig.fuelEfficiency }),
											new ConfigStat({
												label: 'Fuel Type',
												value: capitalize(engineConfig.fuelType.replace('super_oxygen_liquid_nitrogen', 'SOLN')),
											}),
										],
									}),
								],
							}),
						}),
						partConfig &&
							new Card({
								header: `Part: ${player.configuration.part}`,
								body: new Elem({
									style: {
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: '4px',
									},
									append: [
										new PartImage(partConfig.spriteIndex, { displaySize: 96 }),
										new DescriptionText({
											summary: partConfig.summary || '',
											description: partConfig.description || '',
											title: partConfig.name,
										}),
										new Elem({
											style: {
												display: 'flex',
												flexDirection: 'column',
												gap: '4px',
											},
											append: [
												new ConfigStat({ label: 'Max Health', value: partConfig.maxHealth }),
												new ConfigStat({ label: 'Max Fuel', value: partConfig.maxFuel }),
												new ConfigStat({ label: 'Max Cargo', value: partConfig.maxCargo }),
												new ConfigStat({ label: 'Torque', value: partConfig.torque }),
												new ConfigStat({ label: 'Max Item Slots', value: partConfig.maxItemSlots }),
												new ConfigStat({ label: 'Fuel Efficiency', value: partConfig.fuelEfficiency }),
											],
										}),
									],
								}),
							}),
					],
				}),
			),
		);
	}

	render_status_achievements() {
		this.renderStatusMenu();

		const player = gameContext.players.currentPlayer;

		new Elem({
			tag: 'p',
			appendTo: this._subMenuBody,
			content: `Unlocked ${Object.keys(player?.achievements).length} of ${playerAchievements.length}`,
			className: 'description',
		});
		new Elem({
			tag: 'p',
			appendTo: this._subMenuBody,
			content: `Pension Credits: ${player.xp}`,
			className: 'description',
		});

		new CardGrid({
			appendTo: this._subMenuBody,
			content: playerAchievements
				.sort(
					orderBy([
						{ property: 'category', direction: 'asc' },
						{ property: 'difficulty', direction: 'asc' },
						{ property: 'name', direction: 'asc' },
					]),
				)
				.map(achievement => {
					const rewardsText = formatPlayerAchievementRewards(achievement.awards);

					if (!player.achievements[achievement.id]) {
						if (achievement.hidden) return;

						return new Card({
							header: `🔒 ${achievement.name}`,
							body: new Elem({
								style: {
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '4px',
								},
								append: [
									new Elem({
										tag: 'p',
										content: `[${achievement.category}]`,
									}),
									new Elem({
										tag: 'p',
										content: achievement.summary,
										className: 'description',
									}),
									rewardsText &&
										new Elem({
											tag: 'p',
											content: rewardsText,
											className: 'description',
											style: {
												color: theme.colors.yellow,
												fontWeight: 'bold',
												marginTop: '4px',
											},
										}),
								],
							}),
						});
					}

					return new Card({
						header: `✓ ${achievement.name}`,
						style: {
							background: theme.colors.darkest(theme.colors.green),
							border: `1px solid ${theme.colors.green}`,
						},
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new Elem({
									tag: 'p',
									content: `[${achievement.category}]`,
								}),
								new Elem({
									tag: 'p',
									content: achievement.summary,
									className: 'description',
								}),
								new Elem({
									tag: 'p',
									content: achievement.flavor,
									className: 'quote',
								}),
								rewardsText &&
									new Elem({
										tag: 'p',
										content: rewardsText,
										className: 'description',
										style: {
											color: theme.colors.green,
											fontWeight: 'bold',
											marginTop: '4px',
										},
									}),
							],
						}),
					});
				}),
		});
	}

	render_status_minerals() {
		this.renderStatusMenu();

		const player = gameContext.players.currentPlayer;

		new CardGrid({
			appendTo: this._subMenuBody,
			content: Object.entries(minerals).flatMap(([color, mineral]) => {
				if (!player.stats.oreTypesCollected[color]) return [];

				return new Card({
					header: mineral.name,
					style: {
						background: theme.colors.darkest(theme.colors.green),
						border: `1px solid ${theme.colors.green}`,
					},
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new MineralImage(color, { displaySize: 96 }),
							new DescriptionText({
								summary: mineral.description || '',
								description: mineral.flavor,
								title: mineral.name,
							}),
						],
					}),
				});
			}),
		});
	}

	render_status_items() {
		this.renderStatusMenu();

		const player = gameContext.players.currentPlayer;

		new CardGrid({
			appendTo: this._subMenuBody,
			content: Object.entries(items).flatMap(([name, item]) => {
				if (!player.stats.itemsUsed[name] && !player.items[name]) return [];

				return new Card({
					header: capitalize(name.replaceAll('_', ' '), true),
					style: {
						background: theme.colors.darkest(theme.colors.green),
						border: `1px solid ${theme.colors.green}`,
					},
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new ItemImage(name, { displaySize: 96 }),
							new Elem({
								tag: 'p',
								content: `Uses: ${player.stats.itemsUsed[name] ?? 0}`,
								className: 'description',
							}),
							new DescriptionText({
								summary: item.summary || '',
								description: item.description,
								title: item.name || capitalize(name.replaceAll('_', ' '), true),
							}),
						],
					}),
				});
			}),
		});
	}

	render_items() {
		const player = gameContext.players.currentPlayer;
		const currentItemCount = Object.values(player.items).reduce((sum, count) => sum + count, 0);

		// Add inventory status at the top
		this._menuBody.append(
			new Label(
				`Inventory: ${currentItemCount} / ${player.maxItemSlots} slots`,
				currentItemCount >= player.maxItemSlots &&
					new Elem({
						tag: 'p',
						content: 'Inventory full - use items or upgrade storage capacity.',
						className: 'description',
						style: { color: theme.colors.red, marginTop: '6px' },
					}),
			),
		);

		const hasItems = Object.values(player.items).some(count => count > 0);

		if (!hasItems) {
			this._menuBody.append(
				new Elem({
					tag: 'p',
					content: 'No items in inventory. Visit SpaceCo to purchase supplies.',
					className: 'description',
				}),
			);
			return;
		}

		new CardGrid({
			appendTo: this._menuBody,
			content: Object.entries(player.items).flatMap(([key, count]) => {
				if (!count) return [];

				let imageName = key;

				if (key.startsWith('detonator')) imageName = 'detonator';
				else if (key === 'advanced_teleporter') imageName = 'teleport_station';
				else if (key.startsWith('activated_teleporter')) imageName = 'advanced_teleporter';

				// Check if player can use item
				const canUse = this.canUseItem(key, player);
				const disabledReason = this.getItemDisabledReason(key, player);

				return [
					new Card({
						header: `${capitalize(key.replaceAll('_', ' '), true)}`,
						style: {
							opacity: canUse ? 1 : 0.6,
						},
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new ItemImage(imageName, { displaySize: 96 }),
								new Elem({
									tag: 'p',
									content: `Quantity: ${count}`,
									style: { margin: '4px 0', fontSize: '14px' },
								}),
								new DescriptionText({
									summary: items[key]?.summary || '',
									description: items[key]?.description || 'No description available.',
									title: items[key]?.name || capitalize(key.replaceAll('_', ' '), true),
								}),
								!canUse &&
									disabledReason &&
									new Elem({
										tag: 'p',
										content: disabledReason,
										className: 'description',
										style: {
											color: theme.colors.red,
											fontSize: '13px',
											marginTop: '4px',
										},
									}),
							],
						}),
						footerButtons: true,
						footer: [
							new Button({
								content: 'Use',
								onPointerPress: () => {
									if (canUse) {
										useItem({ item: key });
										this.close();
									}
								},
								disabled: !canUse,
							}),
							// Add remote disarm button for void_detonator items
							key.startsWith('void_detonator_') && new Button({
								content: 'Remote Disarm',
								variant: 'secondary',
								onPointerPress: () => {
									// Extract coordinates from void_detonator_x_y format
									const coords = key.split('_');
									const x = parseInt(coords[2], 10);
									const y = parseInt(coords[3], 10);

									disarmBomb({ x, y });
									Notify.success('Void implosion remotely disarmed');
									this.close();
								},
							}),
						].filter(Boolean),
					}),
				];
			}),
		});
	}

	canUseItem(itemKey, player) {
		// Fuel items require compatible engine
		if (['oil', 'battery', 'super_oxygen_liquid_nitrogen'].includes(itemKey)) {
			const engineConfig = engines[player.configuration.engine];
			return engineConfig.fuelType === itemKey && player.fuel < player.maxFuel;
		}

		// Repair nanites require damaged health
		if (itemKey === 'repair_nanites') {
			return player.health < player.maxHealth;
		}

		// Players can always use SpaceCo teleport station (relocates outpost)
		if (itemKey === 'spaceco_teleport_station') {
			return true;
		}

		// Players can always use most other items
		return true;
	}

	getItemDisabledReason(itemKey, player) {
		if (['oil', 'battery', 'super_oxygen_liquid_nitrogen'].includes(itemKey)) {
			const engineConfig = engines[player.configuration.engine];
			if (engineConfig.fuelType !== itemKey) {
				return 'Incompatible fuel type';
			}
			if (player.fuel >= player.maxFuel) {
				return 'Fuel tank full';
			}
		}

		if (itemKey === 'repair_nanites' && player.health >= player.maxHealth) {
			return 'Health already full';
		}

		// SpaceCo teleport station never has disabled reasons
		if (itemKey === 'spaceco_teleport_station') {
			return null;
		}

		return null;
	}

	render_settings() {
		// Detect if device uses touch input without precise pointer support
		const isTouchOnlyDevice =
			('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
			!window.matchMedia('(hover: hover) and (pointer: fine)').matches;

		const settingsControls = [
			new CollapsibleLabel(
				{ label: 'Volume' },
				new VolumeControl({ key: 'music' }),
				new VolumeControl({ key: 'briefings' }),
				new VolumeControl({ key: 'alerts' }),
				new VolumeControl({ key: 'interfaces' }),
				new VolumeControl({ key: 'effects' }),
			),

			new CollapsibleLabel(
				{ label: 'Alerts' },
				new AlertControl({ key: 'fuel' }),
				new AlertControl({ key: 'health' }),
				new AlertControl({ key: 'cargo' }),
			),

			new CollapsibleLabel({ label: 'Display Settings' }, new ScaleControl(), new DebugControl()),
		];

		// Show auto-path settings on devices with precise pointer input (mouse/touchpad)
		if (!isTouchOnlyDevice) {
			settingsControls.splice(2, 0, new CollapsibleLabel({ label: 'Auto-Path Settings' }, new AutoPathControl()));
		}

		this._menuBody.append(
			...settingsControls,

			new Label(
				'Default Console Menu',
				new Select({
					options: [
						'Cargo',
						'Items',
						'Status',
						{ label: 'Status > Rig', value: 'status_Rig' },
						{ label: 'Status > Achievements', value: 'status_Achievements' },
						{ label: 'Status > Minerals', value: 'status_Minerals' },
						{ label: 'Status > Items', value: 'status_Items' },
						'Settings',
						'Help',
						{ label: 'Help > Briefing', value: 'help_Briefing' },
					],
					value: localStorage.getItem('console_defaultMenu') || 'help_Briefing',
					onChange: ({ value }) => localStorage.setItem('console_defaultMenu', value),
				}),
			),

			new Label(
				'Default SpaceCo Menu',
				new Select({
					options: [
						'Sell',
						'Refuel',
						'Repair',
						'Upgrade',
						{ label: 'Upgrade > Current', value: 'status_Current' },
						{ label: 'Upgrade > Vehicles', value: 'status_Vehicles' },
						{ label: 'Upgrade > Drills', value: 'status_Drills' },
						{ label: 'Upgrade > Engines', value: 'status_Engines' },
						{ label: 'Upgrade > Parts', value: 'status_Parts' },
						'Shop',
						'Transport',
						'Status',
						{ label: 'Status > Current', value: 'status_Current' },
						{ label: 'Status > Achievements', value: 'status_Achievements' },
						{ label: 'Status > Minerals', value: 'status_Minerals' },
					],
					value: localStorage.getItem('console_defaultSpacecoMenu') || 'Sell',
					onChange: ({ value }) => localStorage.setItem('console_defaultSpacecoMenu', value),
				}),
			),
		);
	}

	renderHelpMenu() {
		new Elem(
			{ className: 'menu', appendTo: this._menuBody },
			['Docs', 'Briefing'].map(
				view =>
					new Button({
						content: view,
						onPointerPress: () => {
							this.options.view = `help_${view}`;
						},
						disabled: this.options.view === `help_${view}`,
					}),
			),
		);

		this._subMenuBody = new Elem({ className: 'menuBody', appendTo: this._menuBody });
	}

	render_help() {
		this.options.view = 'help_Docs';
	}

	async render_help_docs() {
		this.renderHelpMenu();

		const helpFile = await GET('docs/help.md');

		if (!helpFile.response.ok) {
			new Notify({
				type: 'error',
				content:
					'Unable to retrieve SpaceCo documentation. Did you really need instructions to dig a hole? (Connection error.)',
			});

			return;
		}

		new Elem({ style: { overflow: 'auto' }, innerHTML: helpFile.body, appendTo: this._subMenuBody });
	}

	async render_help_briefing() {
		this.renderHelpMenu();

		const worldName = gameContext.serverState.world.name;

		// Check if audio files exist for this world
		const hasBriefingAudio = await audioPlayer.hasAudio(worldName, 'briefing');
		const hasBulletinAudio = await audioPlayer.hasAudio(worldName, 'bulletin');

		// Add audio controls if any audio exists
		if (hasBriefingAudio || hasBulletinAudio) {
			const audioControls = new Elem({
				appendTo: this._subMenuBody,
				style: {
					display: 'flex',
					gap: '6px',
					marginBottom: '12px',
					padding: '6px',
					background: theme.colors.darkest(theme.colors.gray),
					borderRadius: '6px',
					border: `1px solid ${theme.colors.darker(theme.colors.gray)}`,
				},
			});

			// If both briefing and bulletin exist, show a "Play All" button
			if (hasBriefingAudio && hasBulletinAudio) {
				new Button({
					content: '📻 Play Briefing + Bulletin',
					appendTo: audioControls,
					style: { flex: 1 },
					onPointerPress: () => {
						console.log('[ConsoleDialog] Play All button clicked');
						audioPlayer.play(worldName, 'briefing', { autoQueue: true, useBookends: true });
					},
				});
			}

			if (hasBriefingAudio) {
				new Button({
					content: '📡 Play Briefing Audio',
					appendTo: audioControls,
					style: { flex: 1 },
					onPointerPress: () => {
						console.log('[ConsoleDialog] Briefing button clicked');
						audioPlayer.play(worldName, 'briefing');
					},
				});
			}

			if (hasBulletinAudio) {
				new Button({
					content: '📋 Play Bulletin Audio',
					appendTo: audioControls,
					style: { flex: 1 },
					onPointerPress: () => {
						console.log('[ConsoleDialog] Bulletin button clicked');
						audioPlayer.play(worldName, 'bulletin', { useBookends: true });
					},
				});
			}
		}

		const helpFile = await GET(`docs/briefings/${worldName.replace(/:\s+/g, '_').replace(/\s+/g, '_')}.md`);

		if (!helpFile.response.ok) {
			new Notify({
				type: 'error',
				content:
					'Briefing data corrupted. Your mission is now officially "wing it" until further notice. (Try reloading.)',
			});

			return;
		}

		new Elem({ style: { overflow: 'auto' }, innerHTML: helpFile.body, appendTo: this._subMenuBody });
	}

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();

			this.renderMenu();

			this[`render_${value.toLowerCase()}`]();
		} else super._setOption(key, value);
	}
}
