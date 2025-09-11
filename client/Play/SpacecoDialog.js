import { TinyColor } from '@ctrl/tinycolor';
import {
	Component,
	Label,
	Button,
	List,
	Elem,
	capitalize,
	rand,
	randInt,
	styled,
	convertRange,
	orderBy,
	theme,
} from 'vanilla-bean-components';

import {
	DrillImage,
	EngineImage,
	IconImage,
	ItemImage,
	MineralImage,
	PartImage,
	VehicleImage,
} from '../shared/SpriteSheetImage';
import { CardContainer } from '../shared/CardContainer';
import { InfoButton } from '../shared/InfoButton';
import {
	spacecoBuyItem,
	spacecoBuyTransport,
	spacecoBuyUpgrade,
	spacecoRefuel,
	spacecoRepair,
	spacecoSell,
	spacecoSellItem,
} from '../api';
import { getScaledServiceCosts, getScaledItemPrice, formatSpacecoAchievementRewards } from '../../utils';
import BaseDialog from '../shared/BaseDialog';
import gameContext from '../shared/gameContext';
import { drills, engines, items, minerals, parts, spacecoAchievements, vehicles, worlds } from '../../constants';
import { ConfigStat } from '../shared/ConfigStat';
import { chance } from '../../utils';
import { spacecoLog } from '../../utils/logger.js';
import Notify from '../shared/Notify';

/**
 * Calculate trade-in discount for equipment upgrades
 * @param {string} currentEquipmentId - ID of current equipment
 * @param {object} upgradeConfigs - Available upgrade configurations
 * @param {string} type - Type of equipment
 * @returns {number} Trade-in discount amount
 */
function calculateTradeInDiscount(currentEquipmentId, upgradeConfigs, type) {
	if (!currentEquipmentId) return 0;

	const currentEquipmentConfig = upgradeConfigs[type][currentEquipmentId];
	if (!currentEquipmentConfig || !currentEquipmentConfig.price) return 0;

	return Math.floor(currentEquipmentConfig.price * 0.25);
}

const generateAsteroidPreview = (worldDef, options = {}) => {
	const {
		size = 64, // Canvas size in pixels
		resolution = 8, // Grid resolution (8x8, 16x16, etc.)
	} = options;

	// Create canvas
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	canvas.style.display = 'block';
	const ctx = canvas.getContext('2d');

	// Calculate cell size
	const cellSize = size / resolution;

	// Get world properties with defaults
	const world = {
		holeChance: 33,
		mineralChance: 33,
		layers: [],
		...worldDef,
	};

	// Resolve weighted distribution
	const resolveDistribution = (value, validValues) => {
		if (typeof value === 'string') {
			return validValues.includes(value) ? value : validValues[0];
		}
		if (Array.isArray(value)) {
			return value[randInt(0, value.length - 1)];
		}
		if (typeof value === 'object' && value !== null) {
			// Weighted selection
			const totalWeight = Object.values(value).reduce((sum, weight) => sum + weight, 0);
			let random = rand(0, totalWeight);

			for (const [key, weight] of Object.entries(value)) {
				random -= weight;
				if (random <= 0) return key;
			}
		}
		return validValues[0];
	};

	const layerBoundaries = [];
	const usableDepth = resolution;
	const layerDepth = Math.floor(usableDepth / world.layers.length);

	for (let i = 0; i < world.layers.length; i++) {
		const startY = i * layerDepth;
		let endY = startY + layerDepth - 1;
		if (i === world.layers.length - 1) {
			endY = resolution - 1;
		}

		layerBoundaries.push({
			start: startY,
			end: endY,
			layer: world.layers[i],
		});
	}

	for (let x = 0; x < resolution; x++) {
		for (let y = 0; y < resolution; y++) {
			const layerInfo = layerBoundaries.find(({ start, end }) => y >= start && y <= end);
			if (!layerInfo) continue;

			const { layer } = layerInfo;
			const depthPercent = y / resolution;

			const holeChance = layer.holeChance ?? Math.min(world.holeChance * depthPercent, 90);
			const mineralChance = layer.mineralChance ?? Math.min(world.mineralChance * depthPercent, 90);
			const groundType = resolveDistribution(layer.ground, Object.keys(minerals));
			const shouldBeHole = chance(holeChance);

			if (!shouldBeHole) {
				// Solid rock
				spacecoLog.debug({ groundType, colors: theme.colors }, theme.colors[groundType]);
				let color = theme.colors[groundType];

				if (chance(mineralChance)) {
					// Brighten for pure minerals (2x value)
					color = new TinyColor(color).brighten(30);
				}

				ctx.fillStyle = color;
				ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
			} else {
				// Empty space
				ctx.fillStyle = theme.colors.vantablack;
				ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
			}
		}
	}

	return canvas;
};

class UpgradeStat extends (styled.Component`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
`) {
	render() {
		super.render();

		const isNumber = typeof this.options.value === 'number';
		const diff = isNumber && this.options.value - (this.options.current ?? 0);

		// Skip rendering if value is 0/undefined and there's no meaningful change
		if (isNumber ? this.options.value === 0 && !diff : this.options.value === undefined) return;

		new Elem({ appendTo: this, content: this.options.label, style: { flex: 1 } });

		// Handle negative values (stat removal) differently
		if (this.options.value < 0) {
			new Elem({
				appendTo: this,
				content: this.options.value.toString(), // Will show as negative number
				style: { color: theme.colors.red },
			});
		} else {
			new Elem({
				appendTo: this,
				content: `${isNumber && this.options.value > 0 ? '+' : ''}${this.options.value}`,
			});
		}

		// Show the net change if there's a current value to compare against
		if (isNumber && diff !== 0 && this.options.current !== 0) {
			new Component({
				appendTo: this,
				content: diff === 0 ? '==' : `${diff > 0 ? '+' : ''}${diff}`,
				styles: ({ colors }) => ({ color: colors[diff >= 0 ? 'green' : 'red'], marginLeft: '6px' }),
			});
		}
	}
}

// Helper component for stat changes to reduce repetition
class StatChange extends (styled.Component`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
`) {
	render() {
		super.render();
		
		const { label, value } = this.options;
		
		this.append([
			new Elem({ content: label, style: { flex: 1 } }),
			new Elem({
				content: `${value > 0 ? '+' : ''}${value}`,
				style: { 
					color: value >= 0 ? theme.colors.green : theme.colors.red,
					fontWeight: 'bold'
				}
			})
		]);
	}
}

class UpgradePricing extends (styled.Component`
	display: flex;
	flex-direction: column;
	gap: 3px;
	margin: 6px 0;
`) {
	render() {
		super.render();

		const { basePrice, tradeInDiscount, canAfford, failureReason } = this.options;
		const finalCost = Math.max(0, basePrice - tradeInDiscount);

		if (tradeInDiscount > 0) {
			new Elem({
				appendTo: this,
				content: `List Price: $${basePrice}`,
				style: {
					textDecoration: 'line-through',
					color: theme.colors.gray,
					fontSize: '0.9em',
				},
			});

			new Elem({
				appendTo: this,
				content: `Trade-in Credit: -$${tradeInDiscount}`,
				style: {
					color: theme.colors.green,
					fontSize: '0.9em',
				},
			});
		}

		if (!canAfford) {
			new Elem({
				appendTo: this,
				content: failureReason || 'Insufficient credits',
				style: {
					color: theme.colors.red,
					fontSize: '0.8em',
					fontStyle: 'italic',
				},
			});
		}
	}
}

export default class SpacecoDialog extends (styled(BaseDialog)`
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

		/* Style for empty/unavailable menus */
		button.empty-menu {
			opacity: 0.7;
			color: ${({ colors }) => colors.gray};

			&:before {
				background: repeating-linear-gradient(
					45deg,
					transparent,
					transparent 2px,
					${({ colors }) => colors.gray.setAlpha(0.1)} 2px,
					${({ colors }) => colors.gray.setAlpha(0.1)} 4px
				);
			}
		}

		/* Style for currently selected menu - matches content background for continuity */
		button.selected-menu {
			color: ${({ colors }) => colors.white} !important;
			opacity: 1 !important;

			&:before {
				background-color: ${({ colors }) => colors.white.setAlpha(0.04)} !important;
			}
		}
	}

	.menuBody {
		background-color: ${({ colors }) => colors.white.setAlpha(0.04)};
		padding: 9px 18px;
	}

	p.description {
		color: ${theme => theme.colors.lighter(theme.colors.gray)};
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
`) {
	constructor(options = {}) {
		super({
			header: 'Spaceco',
			view:
				gameContext.serverState.world.spaceco.health > 0
					? localStorage.getItem('console_defaultSpacecoMenu') || 'Sell'
					: 'destroyed',
			...options,
		});
	}

	renderMenu() {
		if (this.options.view === 'destroyed') return;

		new Elem(
			{ className: 'menu', appendTo: this._body },
			['Sell', 'Refuel', 'Repair', 'Upgrade', 'Shop', 'Transport', 'Status'].map(view => {
				const isSelected = this.options.view.toLowerCase().startsWith(view.toLowerCase());
				const isEmpty = this.isMenuEmpty(view);
				const isDisabled = isSelected || isEmpty;

				let className = '';
				if (isSelected) {
					className = 'selected-menu';
				} else if (isEmpty) {
					className = 'empty-menu';
				}

				return new Button({
					content: view,
					onPointerPress: () => {
						this.options.view = view;
					},
					disabled: isDisabled,
					className,
				});
			}),
		);

		this._menuBody = new Elem({ className: 'menuBody', appendTo: this._body });
	}

	isMenuEmpty(menuName) {
		const player = gameContext.players.currentPlayer;

		switch (menuName) {
			case 'Sell':
				// No minerals to sell
				return Object.keys(player.hull).length === 0;

			case 'Refuel': {
				// Fuel is already full
				return player.fuel >= player.maxFuel;
			}

			case 'Repair': {
				// Both player and SpaceCo are at full health
				const playerHealthFull = player.health >= player.maxHealth;
				const spacecoHealthFull = gameContext.serverState.world.spaceco.health >= 9;
				return playerHealthFull && spacecoHealthFull;
			}

			case 'Upgrade': {
				// No upgrades available in any category
				const spaceco = gameContext.serverState.world.spaceco;
				return (
					spaceco.vehicles.length === 0 &&
					spaceco.drills.length === 0 &&
					spaceco.engines.length === 0 &&
					spaceco.parts.length === 0
				);
			}

			case 'Shop': {
				// All items are out of stock
				const shop = gameContext.serverState.world.spaceco.shop;
				return Object.values(shop).every(stock => stock <= 0);
			}

			case 'Transport':
				// No transport choices available
				return gameContext.serverState.world.transportChoices.length === 0;

			case 'Status':
				// Status always has content, never disable
				return false;

			default:
				return false;
		}
	}

	isUpgradeSubmenuEmpty(submenuName) {
		const spaceco = gameContext.serverState.world.spaceco;

		switch (submenuName) {
			case 'Current':
				// Current configuration always has content
				return false;
			case 'Vehicles':
				return spaceco.vehicles.length === 0;
			case 'Drills':
				return spaceco.drills.length === 0;
			case 'Engines':
				return spaceco.engines.length === 0;
			case 'Parts':
				return spaceco.parts.length === 0;
			default:
				return false;
		}
	}

	isShopSubmenuEmpty(submenuName) {
		const player = gameContext.players.currentPlayer;

		switch (submenuName) {
			case 'SpaceCo Shop': {
				// Check if all items in shop are out of stock
				const shop = gameContext.serverState.world.spaceco.shop;
				return Object.values(shop).every(stock => stock <= 0);
			}
			case 'Player Inventory': {
				// Check if player has no items
				return Object.values(player.items).every(count => count <= 0);
			}
			default:
				return false;
		}
	}

	isStatusSubmenuEmpty(submenuName) {
		switch (submenuName) {
			case 'Current':
				// Current status always has content
				return false;
			case 'Achievements':
				// Achievement stats always have content
				return false;
			case 'Minerals': {
				// Check if SpaceCo has no minerals
				const spacecoHull = gameContext.serverState.world.spaceco.hull || {};
				return Object.values(spacecoHull).every(count => count <= 0);
			}
			default:
				return false;
		}
	}

	renderPlayerCredits() {
		const player = gameContext.players.currentPlayer;

		this._menuBody.append(new Label('Credits', `$${player.credits.toFixed(2)}`));

		// Show egg hunt progress if any eggs have been submitted
		const eggHunt = gameContext.serverState.world.spaceco.eggHunt;
		if (eggHunt && eggHunt.totalEggsSubmitted > 0) {
			const playerSubmitted = eggHunt.playerSubmissions?.get?.(gameContext.playerId) || 0;

			this._menuBody.append(
				new Elem({
					style: {
						marginTop: '8px',
						padding: '6px',
						background: theme.colors.darkest(theme.colors.purple),
						border: `1px solid ${theme.colors.purple}`,
						borderRadius: '4px',
						fontSize: '13px',
					},
					append: [
						new Elem({
							content: '🥚 Endgame Hunt Progress',
							style: {
								color: theme.colors.purple,
								fontWeight: 'bold',
								marginBottom: '2px',
							},
						}),
						new Elem({
							content: `Your submissions: ${playerSubmitted}`,
							style: { color: theme.colors.gray },
						}),
						new Elem({
							content: `Global total: ${eggHunt.totalEggsSubmitted}`,
							style: { color: theme.colors.gray },
						}),
					],
				}),
			);
		}
	}

	render_destroyed() {
		new Elem({
			tag: 'p',
			content:
				'This Spaceco outpost is nearly destroyed, it needs to be repaired before its regular services are available again.',
			appendTo: this._body,
		});

		const player = gameContext.players.currentPlayer;

		const spacecoRepairCost = (9 - gameContext.serverState.world.spaceco.health) * 10;

		new Button({
			content: `Full Repair ($${spacecoRepairCost})`,
			appendTo: this._body,
			onPointerPress: () => spacecoRepair({ type: 'outpost' }),
			disabled: spacecoRepairCost > player.credits,
		});
	}

	render_sell() {
		this.renderPlayerCredits();

		const player = gameContext.players.currentPlayer;

		if (Object.keys(player.hull).length === 0) {
			this._menuBody.append(
				new Elem({ tag: 'p', content: 'No minerals to sell' }),
				new Button({
					content: 'Show Collection',
					style: { flex: '1' },
					onPointerPress: () => {
						this.options.view = 'status_Minerals';
					},
				}),
			);

			return;
		}

		const sellButton = new Button({
			style: { marginBottom: '9px' },
			content: `Sell All`,
			onPointerPress: () => spacecoSell(),
			appendTo: this._menuBody,
		});

		let credits = 0;

		new Elem(
			{
				appendTo: this._menuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			Object.keys(minerals).flatMap(name => {
				const dirtyCount = player.hull[name] || 0;
				const pureCount = player.hull[`mineral_${name}`] || 0;

				if (!dirtyCount && !pureCount) return [];

				const demandDrop = (gameContext.serverState.world.spaceco.hull?.[name] || 0) / 1000;
				const baseValue = minerals[name].value;

				const dirtyPrice = dirtyCount ? Math.max(0.01, (baseValue / 2 - demandDrop) * dirtyCount) : 0;
				const purePrice = pureCount ? Math.max(0.01, (baseValue - demandDrop) * pureCount) : 0;

				credits += dirtyPrice + purePrice;

				return [
					new CardContainer({
						header: capitalize(minerals[name].name),
						style: { width: '216px', paddingBottom: '60px', position: 'relative', overflow: 'hidden' },
						body: new Elem({
							append: [
								new Elem({
									tag: 'pre',
									content: `Dirty: x${dirtyCount.toString()} = $${dirtyPrice.toFixed(2)}\nPure: x${pureCount.toString()} = $${purePrice.toFixed(2)}`,
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
		);

		sellButton.options.content = `Sell All ($${credits.toFixed(2)})`;
	}

	render_success() {
		new Elem({ tag: 'p', content: 'Thank you', appendTo: this._body });
	}

	renderUpgradeMenu() {
		this.renderPlayerCredits();

		new Elem(
			{ className: 'menu', appendTo: this._menuBody },
			['Current', 'Vehicles', 'Drills', 'Engines', 'Parts'].map(view => {
				const isSelected = this.options.view === `upgrade_${view}`;
				const isEmpty = this.isUpgradeSubmenuEmpty(view);
				const isDisabled = isSelected || isEmpty;

				let className = '';
				if (isSelected) {
					className = 'selected-menu';
				} else if (isEmpty) {
					className = 'empty-menu';
				}

				return new Button({
					content: view,
					onPointerPress: () => {
						this.options.view = `upgrade_${view}`;
					},
					disabled: isDisabled,
					className,
				});
			}),
		);

		this._subMenuBody = new Elem({ className: 'menuBody', appendTo: this._menuBody });
	}

	render_upgrade() {
		this.options.view = 'upgrade_Current';
	}

	render_upgrade_current() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;
		const vehicleConfig = vehicles[player.configuration.vehicle];
		const drillConfig = drills[player.configuration.drill];
		const engineConfig = engines[player.configuration.engine];
		const partConfig = parts[player.configuration.part];

		new Label(
			{ label: 'Configuration', appendTo: this._subMenuBody },
			new Elem(
				{
					style: {
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '12px',
					},
				},
				new CardContainer({
					header: `Vehicle: ${vehicleConfig.name}`,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new VehicleImage(vehicleConfig.spriteIndex),
							new Elem({
								style: {
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									justifyContent: 'center'
								},
								append: [
									new Elem({
										tag: 'span',
										content: vehicleConfig.summary,
										style: {
											fontSize: '12px',
											textAlign: 'center'
										}
									}),
									new InfoButton({
										title: vehicleConfig.name,
										description: vehicleConfig.description
									})
								]
							}),
							new ConfigStat({ label: 'Max Health', value: vehicleConfig.maxHealth }),
							new ConfigStat({ label: 'Max Fuel', value: vehicleConfig.maxFuel }),
							new ConfigStat({ label: 'Max Cargo', value: vehicleConfig.maxCargo }),
							new ConfigStat({ label: 'Fuel Efficiency', value: vehicleConfig.fuelEfficiency }),
						],
					}),
				}),
				new CardContainer({
					header: `Drill: ${drillConfig.name}`,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new DrillImage(drillConfig.spriteIndex),
							new Elem({
								tag: 'p',
								content: drillConfig.summary,
								className: 'description',
							}),
							new ConfigStat({ label: 'Max Health', value: drillConfig.maxHealth }),
							new ConfigStat({ label: 'Fuel Efficiency', value: drillConfig.fuelEfficiency }),
							new ConfigStat({ label: 'Strength', value: drillConfig.strength }),
						],
					}),
				}),
				new CardContainer({
					header: `Engine: ${engineConfig.name}`,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new EngineImage(engineConfig.spriteIndex),
							new Elem({
								style: {
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									justifyContent: 'center'
								},
								append: [
									new Elem({
										tag: 'span',
										content: engineConfig.summary,
										style: {
											fontSize: '12px',
											textAlign: 'center'
										}
									}),
									new InfoButton({
										title: engineConfig.name,
										description: engineConfig.description
									})
								]
							}),
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
				}),
				partConfig &&
					new CardContainer({
						header: `Part: ${player.configuration.part}`,
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new PartImage(partConfig.spriteIndex),
								new Elem({
									tag: 'p',
									content: partConfig.summary,
									className: 'description',
								}),
								new ConfigStat({ label: 'Max Health', value: partConfig.maxHealth }),
								new ConfigStat({ label: 'Max Fuel', value: partConfig.maxFuel }),
								new ConfigStat({ label: 'Max Cargo', value: partConfig.maxCargo }),
								new ConfigStat({ label: 'Torque', value: partConfig.torque }),
								new ConfigStat({ label: 'Max Item Slots', value: partConfig.maxItemSlots }),
								new ConfigStat({ label: 'Fuel Efficiency', value: partConfig.fuelEfficiency }),
							],
						}),
					}),
			),
		);
	}

	render_upgrade_vehicles() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;
		const vehicleConfig = vehicles[player.configuration.vehicle];
		const upgradeConfigs = { vehicles, drills, engines, parts };

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			gameContext.serverState.world.spaceco.vehicles.map(id => {
				const { name, price, summary, spriteIndex, maxHealth, maxFuel, maxCargo, fuelEfficiency } = vehicles[id];

				const tradeInDiscount = calculateTradeInDiscount(player.configuration.vehicle, upgradeConfigs, 'vehicles');
				const finalCost = Math.max(0, price - tradeInDiscount);
				const canAfford = player.credits >= finalCost;

				return new CardContainer({
					header: name,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new VehicleImage(spriteIndex),
							new Elem({
								tag: 'p',
								content: summary,
								className: 'description',
							}),
							new UpgradeStat({ label: 'Max Health', value: maxHealth, current: vehicleConfig.maxHealth }),
							new UpgradeStat({ label: 'Max Fuel', value: maxFuel, current: vehicleConfig.maxFuel }),
							new UpgradeStat({ label: 'Max Cargo', value: maxCargo, current: vehicleConfig.maxCargo }),
							new UpgradeStat({
								label: 'Fuel Efficiency',
								value: fuelEfficiency,
								current: vehicleConfig.fuelEfficiency,
							}),
							new UpgradePricing({
								basePrice: price,
								tradeInDiscount,
								canAfford,
							}),
						],
					}),
					footerButtons: true,
					footer: [
						new Button({
							content: `Buy ($${finalCost})`,
							onPointerPress: () => {
								const player = gameContext.players.currentPlayer;
								player.sprite.setTexture('vehicles', spriteIndex);
								spacecoBuyUpgrade({ upgrade: id, type: 'vehicles' });
							},
							disabled: !canAfford,
						}),
					],
				});
			}),
		);
	}

	render_upgrade_engines() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;
		const engineConfig = engines[player.configuration.engine];
		const upgradeConfigs = { vehicles, drills, engines, parts };

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			gameContext.serverState.world.spaceco.engines.map(id => {
				const { name, price, summary, spriteIndex, maxHealth, maxFuel, maxCargo, fuelType, torque, fuelEfficiency } =
					engines[id];

				// Calculate trade-in discount
				const tradeInDiscount = calculateTradeInDiscount(player.configuration.engine, upgradeConfigs, 'engines');
				const finalCost = Math.max(0, price - tradeInDiscount);
				const canAfford = player.credits >= finalCost;

				return new CardContainer({
					header: name,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new EngineImage(spriteIndex),
							new Elem({
								tag: 'p',
								content: summary,
								className: 'description',
							}),
							new UpgradeStat({ label: 'Max Health', value: maxHealth, current: engineConfig.maxHealth }),
							new UpgradeStat({ label: 'Max Fuel', value: maxFuel, current: engineConfig.maxFuel }),
							new UpgradeStat({ label: 'Max Cargo', value: maxCargo, current: engineConfig.maxCargo }),
							new UpgradeStat({ label: 'Torque', value: torque, current: engineConfig.torque }),
							new UpgradeStat({ label: 'Fuel Efficiency', value: fuelEfficiency, current: engineConfig.fuelEfficiency }),
							new UpgradeStat({
								label: 'Fuel Type',
								value: capitalize(fuelType.replace('super_oxygen_liquid_nitrogen', 'SOLN')),
							}),
							new UpgradePricing({
								basePrice: price,
								tradeInDiscount,
								canAfford,
							}),
						],
					}),
					footerButtons: true,
					footer: [
						new Button({
							content: `Buy ($${finalCost})`,
							onPointerPress: () => {
								spacecoBuyUpgrade({ upgrade: id, type: 'engines' });
							},
							disabled: !canAfford,
						}),
					],
				});
			}),
		);
	}

	render_upgrade_drills() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;
		const drillConfig = drills[player.configuration.drill];
		const engineConfig = engines[player.configuration.engine];
		const upgradeConfigs = { vehicles, drills, engines, parts };

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			gameContext.serverState.world.spaceco.drills.map(id => {
				const { name, price, summary, spriteIndex, maxHealth, fuelEfficiency, strength, requirements } = drills[id];

				const missingRequirements = requirements?.some(([key, goal]) => (engineConfig?.[key] ?? 0) <= goal);

				// Calculate trade-in discount
				const tradeInDiscount = calculateTradeInDiscount(player.configuration.drill, upgradeConfigs, 'drills');
				const finalCost = Math.max(0, price - tradeInDiscount);
				const canAfford = player.credits >= finalCost;

				// Determine failure reason
				let failureReason;
				if (missingRequirements) {
					failureReason = 'Insufficient torque';
				} else if (!canAfford) {
					failureReason = 'Insufficient credits';
				}

				return new CardContainer({
					header: name,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							new DrillImage(spriteIndex),
							new Elem({
								tag: 'p',
								content: summary,
								className: 'description',
							}),
							new UpgradeStat({ label: 'Max Health', value: maxHealth, current: drillConfig.maxHealth }),
							new UpgradeStat({ label: 'Fuel Efficiency', value: fuelEfficiency, current: drillConfig.fuelEfficiency }),
							new UpgradeStat({ label: 'Strength', value: strength, current: drillConfig.strength }),
							new Elem(
								{
									tag: 'p',
									content: 'Requirements',
									className: 'description',
								},
								new List({
									items: requirements.map(([key, goal]) => `${capitalize(key)}: ${engineConfig[key] ?? 0} / ${goal}`),
								}),
							),
							new UpgradePricing({
								basePrice: price,
								tradeInDiscount,
								canAfford: canAfford && !missingRequirements,
								failureReason,
							}),
						],
					}),
					footerButtons: true,
					footer: [
						new Button({
							content: `Buy ($${finalCost})`,
							onPointerPress: () => {
								const player = gameContext.players.currentPlayer;
								player.sprite.drill.setTexture('drills', spriteIndex);
								spacecoBuyUpgrade({ upgrade: id, type: 'drills' });
							},
							disabled: missingRequirements || !canAfford,
						}),
					],
				});
			}),
		);
	}

	render_upgrade_parts() {
		this.renderUpgradeMenu();

		const player = gameContext.players.currentPlayer;
		const currentPartConfig = parts[player.configuration.part] || {};
		const upgradeConfigs = { vehicles, drills, engines, parts };

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			gameContext.serverState.world.spaceco.parts.map(id => {
				const newPartConfig = parts[id];
				const {
					name,
					price,
					summary,
					spriteIndex,
					maxHealth = 0,
					maxFuel = 0,
					maxCargo = 0,
					torque = 0,
					maxItemSlots = 0,
					fuelEfficiency = 0,
				} = newPartConfig;

				// Calculate trade-in discount
				const tradeInDiscount = calculateTradeInDiscount(player.configuration.part, upgradeConfigs, 'parts');
				const finalCost = Math.max(0, price - tradeInDiscount);
				const canAfford = player.credits >= finalCost;

				// Calculate net changes (new part stats minus current part stats)
				const statChanges = {
					maxHealth: maxHealth - (currentPartConfig.maxHealth || 0),
					maxFuel: maxFuel - (currentPartConfig.maxFuel || 0),
					maxCargo: maxCargo - (currentPartConfig.maxCargo || 0),
					torque: torque - (currentPartConfig.torque || 0),
					maxItemSlots: maxItemSlots - (currentPartConfig.maxItemSlots || 0),
					fuelEfficiency: fuelEfficiency - (currentPartConfig.fuelEfficiency || 0),
				};

				return new CardContainer({
					header: name,
					body: new Elem({
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '4px',
						},
						append: [
							spriteIndex >= 0 && new PartImage(spriteIndex),
							new Elem({
								tag: 'p',
								content: summary,
								className: 'description',
							}),
							// Only show stats that actually change - using cleaner component pattern
							...[
								{ key: 'maxHealth', label: 'Max Health' },
								{ key: 'maxFuel', label: 'Max Fuel' },
								{ key: 'maxCargo', label: 'Max Cargo' },
								{ key: 'torque', label: 'Torque' },
								{ key: 'maxItemSlots', label: 'Max Item Slots' },
								{ key: 'fuelEfficiency', label: 'Fuel Efficiency' }
							].filter(({ key }) => statChanges[key] !== 0)
							 .map(({ key, label }) => new StatChange({ 
								label, 
								value: statChanges[key] 
							})),
							new UpgradePricing({
								basePrice: price,
								tradeInDiscount,
								canAfford,
							}),
						],
					}),
					footerButtons: true,
					footer: [
						new Button({
							content: `Buy ($${finalCost})`,
							onPointerPress: () => {
								spacecoBuyUpgrade({ upgrade: id, type: 'parts' });
							},
							disabled: !canAfford,
						}),
					],
				});
			}),
		);
	}

	render_refuel() {
		this.renderPlayerCredits();

		const player = gameContext.players.currentPlayer;
		const engineConfig = engines[player.configuration.engine];

		// Use the same scaled pricing logic as the server
		const spacecoXp = gameContext.serverState.world.spaceco.xp || 0;
		const serviceCosts = getScaledServiceCosts(spacecoXp);
		const pricePerLiter = serviceCosts.fuelPricePerUnit[engineConfig.fuelType];

		const neededFuel = player.maxFuel - player.fuel;
		const cost = neededFuel * pricePerLiter;

		if (neededFuel === 0) {
			this._menuBody.append(new Elem({ tag: 'p', content: 'Your full' }));

			return;
		}

		this._menuBody.append(
			new Label(
				'Fuel',
				`${player.fuel.toFixed(1)}l / ${player.maxFuel}l (${convertRange(player.fuel, [0, player.maxFuel], [0, 100]).toFixed(1)}%)`,
			),
			new Label(
				`Fuel Type: ${capitalize(engineConfig.fuelType.replaceAll('_', ' '), true)}`,
				new ItemImage(engineConfig.fuelType),
				...[5, 10, 20, 40, 50].map(amount => {
					if (player.credits > amount && amount <= cost) {
						return new Button({
							content: `$${amount}`,
							onPointerPress: () => spacecoRefuel({ amount }),
						});
					}
				}),
				player.credits &&
					cost > player.credits &&
					new Button({
						content: `$${player.credits.toFixed(2)}`,
						onPointerPress: () =>
							spacecoRefuel({
								amount: player.credits,
							}),
					}),
				new Button({
					content: `Fill ($${cost.toFixed(2)})`,
					onPointerPress: () => spacecoRefuel({ amount: cost }),
					disabled: cost > player.credits,
				}),
			),
		);
	}

	render_repair() {
		this.renderPlayerCredits();

		const playerRepairs = new Label('Repair your Drill');
		const spacecoRepairs = new Label('Repair Spaceco Outpost');

		const player = gameContext.players.currentPlayer;

		const pricePerHealth = 1.3;
		const neededHealth = player.maxHealth - player.health;
		const cost = neededHealth * pricePerHealth;

		if (neededHealth === 0) {
			new Elem({ tag: 'p', content: `You're in good shape`, appendTo: playerRepairs });
		} else {
			new Label(
				{ label: 'Health', appendTo: this._menuBody },
				`${convertRange(player.health, [0, player.maxHealth], [0, 100]).toFixed(1)}%`,
			);

			new Button({
				textContent: `Full Repair ($${cost.toFixed(2)})`,
				prepend: new IconImage('health', { display: 'inline-block', margin: '-5px 0 -10px -10px' }),
				appendTo: playerRepairs,
				onPointerPress: () => spacecoRepair({ type: 'player' }),
				disabled: cost > player.credits,
			});
		}

		if (gameContext.serverState.world.spaceco.health >= 9) {
			new Elem({ tag: 'p', content: `This outpost is in good shape`, appendTo: spacecoRepairs });
		} else {
			const spacecoRepairCost = (9 - gameContext.serverState.world.spaceco.health) * 10;

			new Button({
				textContent: `Full Repair ($${spacecoRepairCost})`,
				prepend: new IconImage('health', { display: 'inline-block', margin: '-5px 0 -10px -10px' }),
				appendTo: spacecoRepairs,
				onPointerPress: () => spacecoRepair({ type: 'outpost' }),
				disabled: spacecoRepairCost > player.credits,
			});
		}

		this._menuBody.append(playerRepairs, spacecoRepairs);
	}

	renderShopMenu() {
		this.renderPlayerCredits();

		new Elem(
			{ className: 'menu', appendTo: this._menuBody },
			['SpaceCo Shop', 'Player Inventory'].map(view => {
				const viewKey = `shop_${view.split(' ')[0]}`;
				const isSelected = this.options.view === viewKey;
				const isEmpty = this.isShopSubmenuEmpty(view);
				const isDisabled = isSelected || isEmpty;

				let className = '';
				if (isSelected) {
					className = 'selected-menu';
				} else if (isEmpty) {
					className = 'empty-menu';
				}

				return new Button({
					content: view,
					onPointerPress: () => {
						this.options.view = viewKey;
					},
					disabled: isDisabled,
					className,
				});
			}),
		);

		this._subMenuBody = new Elem({ className: 'menuBody', appendTo: this._menuBody });
	}

	render_shop() {
		this.options.view = 'shop_SpaceCo';
	}

	render_shop_spaceco() {
		this.renderShopMenu();

		const player = gameContext.players.currentPlayer;
		const currentItemCount = Object.values(player.items).reduce((sum, count) => {
			const numCount = typeof count === 'number' ? count : 0;
			return sum + (numCount > 0 ? numCount : 0);
		}, 0);

		new Label(
			{ appendTo: this._subMenuBody, label: `Inventory: ${currentItemCount} / ${player.maxItemSlots} slots` },
			currentItemCount >= player.maxItemSlots &&
				new Elem({
					tag: 'p',
					content: 'Inventory full - purchase additional storage parts or use items to make space.',
					className: 'description',
					style: { color: theme.colors.red },
				}),
		);

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			Object.entries(items).flatMap(([key, { price, summary }]) => {
				const stock = gameContext.serverState.world.spaceco.shop[key];

				if (!stock) return [];

				const scaledPrice = getScaledItemPrice(price, gameContext.serverState.world.spaceco.xp);
				const canAfford = player.credits >= scaledPrice;
				const hasInventorySpace = currentItemCount < player.maxItemSlots;
				const canPurchase = canAfford && hasInventorySpace && stock > 0;

				// Determine disabled reason
				let disabledReason = '';
				if (!canAfford) disabledReason = 'Insufficient credits';
				else if (!hasInventorySpace) disabledReason = 'Inventory full';
				else if (stock <= 0) disabledReason = 'Out of stock';

				return [
					new CardContainer({
						header: capitalize(key.replaceAll('_', ' '), true),
						style: {
							opacity: canPurchase ? 1 : 0.6,
						},
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new ItemImage(key),
								new Elem({
									style: {
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										justifyContent: 'center'
									},
									append: [
										new Elem({
											tag: 'span',
											content: summary,
											style: {
												fontSize: '12px',
												textAlign: 'center'
											}
										}),
										new InfoButton({
											title: items[key].name || capitalize(key.replaceAll('_', ' ')),
											description: items[key].description
										})
									]
								}),
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.gray,
										textAlign: 'center',
									},
									content: `Stock: ${stock}`,
								}),
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.green,
										textAlign: 'center',
										fontWeight: 'bold',
										marginTop: '4px'
									},
									content: `$${scaledPrice}`,
								}),
								!canPurchase &&
									disabledReason &&
									new Elem({
										tag: 'p',
										content: disabledReason,
										className: 'description',
										style: {
											color: theme.colors.red,
											fontSize: '13px',
											marginTop: '4px'
										},
									}),
							],
						}),
						footerButtons: true,
						footer: [
							new Button({
								content: `Buy`,
								style: {
									backgroundColor: canPurchase ? '' : theme.colors.darkest(theme.colors.red),
								},
								onPointerPress: () => spacecoBuyItem({ item: key }),
								disabled: !canPurchase,
							}),
						],
					}),
				];
			}),
		);
	}

	render_shop_player() {
		this.renderShopMenu();

		const player = gameContext.players.currentPlayer;

		if (Object.values(player.items).every(count => count <= 0)) {
			new Elem({
				tag: 'p',
				content: 'No items in inventory to sell',
				appendTo: this._subMenuBody,
				style: { textAlign: 'center', padding: '20px', color: theme.colors.gray },
			});
			return;
		}

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			Object.entries(player.items).flatMap(([key, count]) => {
				if (!count) return [];

				let imageName = key;

				if (key.startsWith('detonator')) imageName = 'detonator';
				else if (key === 'advanced_teleporter') imageName = 'teleport_station';
				else if (key.startsWith('activated_teleporter')) imageName = 'advanced_teleporter';

				// Check if item exists in items config (sellable)
				const itemConfig = items[key];
				if (!itemConfig) {
					// Show item but without sell button for items that can't be sold
					return [
						new Label(
							{ label: capitalize(key.replaceAll('_', ' '), true) },
							`x${count.toString()}`,
							new ItemImage(imageName),
						),
					];
				}

				// Special handling for psykick_egg - show endgame hunt info
				if (key === 'psykick_egg') {
					const eggHunt = gameContext.serverState.world.spaceco.eggHunt;
					const totalSubmitted = eggHunt?.totalEggsSubmitted || 0;
					const playerSubmitted = eggHunt?.playerSubmissions?.get?.(gameContext.playerId) || 0;

					return [
						new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								background: theme.colors.darkest(theme.colors.purple),
								border: `2px solid ${theme.colors.purple}`,
								borderRadius: '8px',
								padding: '16px',
								minWidth: '160px',
								gap: '8px',
								boxShadow: '0 0 10px rgba(128, 0, 128, 0.3)',
							},
							append: [
								new Elem({
									style: {
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: '6px',
									},
									append: [
										new ItemImage(imageName),
										new Label(
											{
												label: 'Psykick Egg',
												style: {
													textAlign: 'center',
													color: theme.colors.purple,
													fontWeight: 'bold',
												},
											},
											`x${count}`,
										),
									],
								}),
								new Elem({
									style: {
										fontSize: '13px',
										color: theme.colors.light(theme.colors.purple),
										textAlign: 'center',
										fontStyle: 'italic',
									},
									content: 'Endgame Hunt Progress',
								}),
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.gray,
										textAlign: 'center',
									},
									content: `Your submissions: ${playerSubmitted}`,
								}),
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.gray,
										textAlign: 'center',
									},
									content: `Global total: ${totalSubmitted}`,
								}),
								new Button({
									content: count > 1 ? 'Submit 1' : 'Submit',
									style: {
										width: '100%',
										marginTop: '6px',
										background: theme.colors.purple,
										color: 'white',
									},
									onPointerPress: async () => {
										spacecoLog.info('Attempting to submit psykick egg:', key, 'count:', 1);
										try {
											const result = await spacecoSellItem({ item: key, count: 1 });
											spacecoLog.info('Submit egg result:', result);
										} catch (error) {
											spacecoLog.error('Failed to submit egg:', error);
											spacecoLog.error('Error details:', error.response?.data || error.message);
										}
									},
								}),
								...(count > 1
									? [
											new Button({
												content: 'Submit All',
												style: {
													width: '100%',
													background: theme.colors.dark(theme.colors.purple),
													color: 'white',
												},
												onPointerPress: async () => {
													spacecoLog.info('Attempting to submit all psykick eggs:', key, 'count:', count);
													try {
														const result = await spacecoSellItem({ item: key, count });
														spacecoLog.info('Submit all eggs result:', result);
													} catch (error) {
														spacecoLog.error('Failed to submit eggs:', error);
														spacecoLog.error('Error details:', error.response?.data || error.message);
													}
												},
											}),
										]
									: []),
							],
						}),
					];
				}

				// Calculate sell price (70% of current market value)
				const basePrice = itemConfig.price;
				const currentMarketPrice = getScaledItemPrice(basePrice, gameContext.serverState.world.spaceco.xp);
				const sellPrice = Math.floor(currentMarketPrice * 0.7);

				return [
					new CardContainer({
						header: `${capitalize(key.replaceAll('_', ' '), true)} (x${count})`,
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new ItemImage(imageName),
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.gray,
										textAlign: 'center',
									},
									content: '(30% restocking fee)',
								}),
							],
						}),
						footer: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								gap: '4px',
							},
							append: [
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.gray,
										textAlign: 'center',
									},
									content: `Market: $${currentMarketPrice} | Sell: `,
									append: new Elem({
										tag: 'span',
										content: `$${sellPrice}`,
										style: {
											color: theme.colors.green,
											fontWeight: 'bold',
										},
									}),
								}),
								new Button({
									content: count > 1 ? 'Sell 1' : 'Sell',
									style: { width: '100%' },
									onPointerPress: async () => {
										spacecoLog.info('Attempting to sell item:', key, 'count:', 1);
										try {
											const result = await spacecoSellItem({ item: key, count: 1 });
											spacecoLog.info('Sell item result:', result);
										} catch (error) {
											spacecoLog.error('Failed to sell item:', error);
											spacecoLog.error('Error details:', error.response?.data || error.message);
										}
									},
								}),
								...(count > 1
									? [
											new Button({
												content: 'Sell All',
												style: { width: '100%' },
												onPointerPress: async () => {
													spacecoLog.info('Attempting to sell all items:', key, 'count:', count);
													try {
														const result = await spacecoSellItem({ item: key, count });
														spacecoLog.info('Sell all items result:', result);
													} catch (error) {
														spacecoLog.error('Failed to sell items:', error);
														spacecoLog.error('Error details:', error.response?.data || error.message);
													}
												},
											}),
										]
									: []),
							],
						}),
					}),
				];
			}),
		);
	}

	render_transport() {
		const player = gameContext.players.currentPlayer;

		new Elem(
			{
				appendTo: this._menuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			gameContext.serverState.world.transportChoices.map(key => {
				const { price, requirements } = gameContext.serverState.world.transports[key];
				const missingRequirements = requirements?.some(
					([key, goal]) => (gameContext.serverState.world.spaceco.hull?.[key] ?? 0) < goal,
				);
				const locked = price > player.credits || missingRequirements;

				return [
					new CardContainer({
						header: capitalize(key.replaceAll('_', ' '), true),
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								!locked && generateAsteroidPreview(worlds.find(world => world.name === key)),
								missingRequirements &&
									new Elem({
										tag: 'p',
										content: 'Requirements',
										className: 'description',
										append: new List({
											items: requirements.map(([key, goal]) =>
												minerals[key]
													? `${capitalize(minerals[key].name)}: ${gameContext.serverState.world.spaceco.hull?.[key] ?? 0} / ${goal}`
													: `GMS: ${gameContext.serverState.world.spaceco?.[key] ?? 0} / ${goal}`,
											),
										}),
									}),
							],
						}),
						footer: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								gap: '4px',
							},
							append: [
								new Elem({
									style: {
										fontSize: '14px',
										color: theme.colors.green,
										textAlign: 'center',
										fontWeight: 'bold',
									},
									content: `$${price}`,
								}),
								new Button({
									content: `Buy Transport`,
									style: { width: '100%' },
									onPointerPress: async () => {
										try {
											await spacecoBuyTransport({ world: key });
										} catch (error) {
											console.error('Transport failed:', error);
											new Notify({ type: 'error', content: 'Transport failed. Please try again.', timeout: 3000 });
										}
									},
									disabled: locked,
								}),
							],
						}),
					}),
				];
			}),
		);
	}

	renderStatusMenu() {
		new Elem(
			{ className: 'menu', appendTo: this._menuBody },
			['Current', 'Achievements', 'Minerals'].map(view => {
				const isSelected = this.options.view === `status_${view}`;
				const isEmpty = this.isStatusSubmenuEmpty(view);
				const isDisabled = isSelected || isEmpty;

				let className = '';
				if (isSelected) {
					className = 'selected-menu';
				} else if (isEmpty) {
					className = 'empty-menu';
				}

				return new Button({
					content: view,
					onPointerPress: () => {
						this.options.view = `status_${view}`;
					},
					disabled: isDisabled,
					className,
				});
			}),
		);

		this._subMenuBody = new Elem({ className: 'menuBody', appendTo: this._menuBody });
	}

	render_status() {
		this.options.view = 'status_Current';
	}

	render_status_current() {
		this.renderStatusMenu();

		this._subMenuBody.append(
			new Label(
				'Position',
				`X: ${gameContext.serverState.world.spaceco.position.x} | Y: ${gameContext.serverState.world.spaceco.position.y}`,
			),
			new Label(
				'Current Stats',
				new List({
					items: [
						`Health: ${gameContext.serverState.world.spaceco.health}hp / 9hp (${convertRange(gameContext.serverState.world.spaceco.health, [0, 9], [0, 100]).toFixed(1)}%)`,
					],
				}),
			),
			new Label(
				'Stats',
				new List({
					items: Object.entries(gameContext.serverState.world.spaceco.stats).flatMap(([key, value]) => {
						if (typeof value !== 'number') return [];

						return [`${capitalize(key.replaceAll('_', ' '), true)}: ${value}`];
					}),
				}),
			),
		);
	}

	render_status_minerals() {
		this.renderStatusMenu();

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			Object.keys(minerals).flatMap(name => {
				const count = gameContext.serverState.world.spaceco.hull?.[name] || 0;

				if (!count) return [];

				return [
					new CardContainer({
						header: capitalize(minerals[name].name),
						body: new Elem({
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4px',
							},
							append: [
								new MineralImage(name.replace('mineral_', '')),
								...[...Array(Math.min(count, 20))].map(
									() =>
										new MineralImage(name.replace('mineral_', ''), {
											position: 'absolute',
											transform: `scale(${rand(0.2, 0.3)}) translate(${randInt(-40, 40)}px, ${randInt(-40, 40)}px)`,
										}),
								),
							],
						}),
						footer: new Elem({
							tag: 'pre',
							content: `${count.toString()}kg`,
							style: {
								margin: 0,
								whiteSpace: 'pre-wrap',
								textAlign: 'center',
								color: theme.colors.green,
								fontWeight: 'bold',
							},
						}),
					}),
				];
			}),
		);
	}

	render_status_achievements() {
		this.renderStatusMenu();

		new Elem({
			tag: 'p',
			appendTo: this._subMenuBody,
			content: `Unlocked ${Object.keys(gameContext.serverState.world.spaceco.achievements).length} of ${spacecoAchievements.length}`,
			className: 'description',
		});

		new Elem({
			tag: 'p',
			appendTo: this._subMenuBody,
			content: `Galactic Market Share: ${gameContext.serverState.world.spaceco.xp}`,
			className: 'description',
		});

		new Elem(
			{
				appendTo: this._subMenuBody,
				style: {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '12px',
				},
			},
			spacecoAchievements
				.sort(
					orderBy([
						{ property: 'category', direction: 'asc' },
						{ property: 'difficulty', direction: 'asc' },
						{ property: 'name', direction: 'asc' },
					]),
				)
				.map(achievement => {
					const rewardsText = formatSpacecoAchievementRewards(achievement.awards);

					if (!gameContext.serverState.world.spaceco.achievements[achievement.id]) {
						if (achievement.hidden) return;

						return new CardContainer({
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

					return new CardContainer({
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
		);
	}

	_setOption(key, value) {
		if (key === 'view') {
			this._body.empty();

			this.renderMenu();

			this[`render_${value.toLowerCase()}`]();
		} else super._setOption(key, value);
	}
}
