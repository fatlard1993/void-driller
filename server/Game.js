import { Game as BaseGame } from '@fatlard1993/web-game-framework';

import {
	simpleId,
	chance,
	randFromArray,
	randInt,
	weightedChance,
	getSurroundingRadius,
	getImmediateSurrounds,
	positionIsOccupied,
	validateMovementPath,
	calculateDrillOrientation,
	stepFuelCost,
	hasWheelSupport,
	getGridCell,
	getScaledTransportCost,
	getScaledItemPrice,
	getScaledServiceCosts,
} from '../utils';
import {
	aliens,
	drills,
	engines,
	vehicles,
	parts,
	minerals,
	worlds,
	items,
	playerAchievements,
	spacecoAchievements,
} from '../constants';
import { gameLog, playerLog, worldLog, spacecoLog } from '../utils/logger.js';
import { generateAsteroid } from './generateAsteroid.js';
import { explode } from './effects';

const WORLDS = {
	...Object.fromEntries(worlds.map(world => [world.name, world])),
};

const fuelItems = ['oil', 'battery', 'super_oxygen_liquid_nitrogen'];
const usableItems = new Set([
	...fuelItems,
	'spaceco_teleporter',
	'repair_nanites',
	'timed_charge',
	'remote_charge',
	'detonator',
	'gravity_charge',
	'void_implosion',
	'void_detonator',
	'advanced_teleporter',
	'activated_teleporter',
	'spaceco_teleport_station',
]);

/**
 *
 * @param source
 */
function getSpacecoXpMultiplier(source) {
	switch (source) {
		case 'mineral_sale':
			return 1.0;
		case 'upgrade_sale':
			return 1.5;
		case 'service_sale':
			return 0.8;
		case 'transport':
			return 2.0;
		default:
			return 1.0;
	}
}
/**
 *
 * @param amount
 * @param source
 */
function getSpacecoXp(amount, source) {
	const multiplier = getSpacecoXpMultiplier(source);
	const adjustedAmount = Math.floor(amount * multiplier);

	return adjustedAmount;
}
/**
 *
 * @param baseAmount
 * @param type
 * @param spacecoXp
 */
function getScaledAchievementReward(baseAmount, type, spacecoXp) {
	if (type === 'credits') {
		return Math.floor(baseAmount * (1 + spacecoXp / 50000)); // Up to 3x at 150k XP
	}
	return baseAmount; // XP and items don't scale
}

export default class Game extends BaseGame {
	constructor({ saveState = {}, ...options }) {
		gameLog.info('Game constructor called', {
			gameName: options.name || saveState.name || 'unnamed game',
			hasSaveState: !!saveState && Object.keys(saveState).length > 0,
		});

		// Call base constructor
		super({ saveState, ...options });

		// Initialize game-specific properties
		this.world = saveState.world || generateAsteroid(WORLDS[options.worldName] || options);
		this.url = this.server.url;

		// Trades are between sessions, not part of the world: a Map here, never saved or sent
		this.activeTrades = new Map();
		this.movementTimeouts = new Map();

		// A rig saved mid-path has no timer left to finish it
		this.players.forEach((player, id) => {
			if (player.moving || player._movementSessionId) this.stopMovement(id);
		});
	}

	toClient() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,
			url: this.url,
			players: [...this.players.values()],
		};
	}

	toSaveState() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,
			players: [...this.players.values()],
		};
	}

	validateBroadcastData(key, data) {
		// Validate player data if present
		if (data.player) {
			const player = data.player;

			// Validate numeric fields
			const numericFields = ['health', 'fuel', 'cargo', 'credits', 'maxHealth', 'maxFuel', 'maxCargo'];
			for (const field of numericFields) {
				if (player[field] !== undefined && (!Number.isFinite(player[field]) || player[field] < 0)) {
					gameLog.warning('Invalid player field in broadcast', {
						broadcastKey: key,
						field,
						value: player[field],
						playerId: player?.id,
					});
					return false;
				}
			}

			// Validate position data
			if (player.position) {
				if (!Number.isFinite(player.position.x) || !Number.isFinite(player.position.y)) {
					gameLog.warning('Invalid player position in broadcast', {
						broadcastKey: key,
						position: player.position,
						playerId: player?.id,
					});
					return false;
				}
			}
		}

		// Validate position data in other contexts
		if (data.position && (!Number.isFinite(data.position.x) || !Number.isFinite(data.position.y))) {
			gameLog.warning('Invalid position in broadcast', { broadcastKey: key, position: data.position });
			return false;
		}

		// Validate playerId if present
		if (data.playerId && typeof data.playerId !== 'string') {
			gameLog.warning('Invalid playerId in broadcast', { broadcastKey: key, playerId: data.playerId });
			return false;
		}

		return true;
	}

	broadcast(key, data) {
		// Validate broadcast data before sending
		if (!this.validateBroadcastData(key, data)) {
			gameLog.error('Skipping invalid broadcast', { broadcastKey: key, data });
			return;
		}

		// Use safe broadcast method from parent class
		super.broadcast(key, data);
		const playerIds = data.playerIds ?? [data.playerId ?? data.player?.id ?? data.triggeringPlayerId].filter(Boolean);


		playerAchievements.forEach(({ trigger, ...achievement }) => {
			if (![].concat(trigger.type).includes(key)) return;

			playerIds.forEach(playerId => {
				const player = this.players.get(playerId);

				if (!player || player.achievements[achievement.id]) return;
				if (!trigger.check({ event: data, player, world: this.world })) return;

				let updatedPlayer = { ...player, achievements: { ...player.achievements, [achievement.id]: true } };

				playerLog.info(`Achievement unlocked`, {
					playerId,
					achievementId: achievement.id,
					achievementName: achievement.name,
					awards: achievement.awards,
				});

				if (achievement.awards) {
					achievement.awards.forEach(award => {
						if (typeof award === 'function') updatedPlayer = award(updatedPlayer);
						else {
							const [key, value] = award;

							playerLog.info(`Processing achievement award`, {
								playerId,
								key,
								value,
								isInItems: !!items[key],
							});

							if (items[key]) {
								updatedPlayer.items = { ...updatedPlayer.items, [key]: (updatedPlayer.items[key] ?? 0) + value };
							} else {
								const awardAmount =
									key === 'credits' ? getScaledAchievementReward(value, 'credits', this.world.spaceco.xp) : value;
								playerLog.info(`Awarding achievement reward`, {
									playerId,
									key,
									baseValue: value,
									awardAmount,
									currentValue: updatedPlayer[key],
									newValue: updatedPlayer[key] + awardAmount,
								});
								updatedPlayer[key] = updatedPlayer[key] + awardAmount;
							}
						}
					});
				}

				this.players.set(playerId, updatedPlayer);

				// Use safe broadcast method
				super.broadcast('achievement', {
					playerId,
					achievement,
					player: (({ achievements, xp, credits, items, fuel, health }) => ({
						achievements,
						xp,
						credits,
						items,
						fuel,
						health,
					}))(updatedPlayer),
				});

				if (updatedPlayer.xp !== player.xp) this.broadcastXpGain(playerId, updatedPlayer.xp - player.xp);
			});
		});

		spacecoAchievements.forEach(({ trigger, ...achievement }) => {
			if (![].concat(trigger.type).includes(key)) return;

			const check = { event: data, world: this.world, playerCount: this.players.size };

			if (!this.world.spaceco.achievements[achievement.id] && trigger.check(check)) {
				gameLog.debug('Achievement triggered', { achievementId: achievement.id, achievementName: achievement.name });

				this.world.spaceco.achievements[achievement.id] = true;

				if (achievement.awards) {
					achievement.awards.forEach(([key, value]) => {
						this.world.spaceco[key] = this.world.spaceco[key] + value;
					});
				}

				// Use safe broadcast method
				super.broadcast('spacecoAchievement', {
					achievement,
					spaceco: {
						achievements: this.world.spaceco.achievements,
						xp: this.world.spaceco.xp,
						stats: this.world.spaceco.stats,
					},
				});
			}
		});

		this.save();
	}

	findValidSpawnPosition(world = null) {
		// Use provided world or current world
		const targetWorld = world || this.world;

		gameLog.debug('Finding spawn position', {
			worldSize: `${targetWorld.width}x${targetWorld.depth}`,
			spacecoPosition: targetWorld.spaceco.position,
		});

		// SIMPLE APPROACH: Find a position ON TOP OF solid ground, not floating
		const spacecoPos = targetWorld.spaceco.position;

		// Strategy 1: Look for positions where there's solid ground directly beneath
		for (let radius = 1; radius <= 10; radius++) {
			for (let dx = -radius; dx <= radius; dx++) {
				for (let dy = -radius; dy <= radius; dy++) {
					const testPos = {
						x: spacecoPos.x + dx,
						y: spacecoPos.y + dy,
					};

					// Check bounds
					if (
						testPos.x < 2 ||
						testPos.x >= targetWorld.width - 2 ||
						testPos.y < 1 ||
						testPos.y >= targetWorld.depth - 2
					) {
						continue;
					}

					// Check if the position itself is clear
					const cell = targetWorld.grid[testPos.x][testPos.y];
					if (cell.ground?.type || (cell.hazards && cell.hazards.length > 0)) {
						continue; // Position is blocked
					}

					// Check if there's solid ground directly below
					const belowPos = { x: testPos.x, y: testPos.y + 1 };
					if (belowPos.y < targetWorld.depth) {
						const belowCell = targetWorld.grid[belowPos.x][belowPos.y];
						if (belowCell.ground?.type) {
							gameLog.debug('Found spawn position on solid ground', { position: testPos, groundBelow: belowPos });
							return testPos;
						}
					}
				}
			}
		}

		// Strategy 2: Create a landing platform if needed
		gameLog.warning('No spawn position found, creating landing platform');
		const platformPos = {
			x: spacecoPos.x + 2, // Offset from SpaceCo
			y: targetWorld.airGap,
		};

		// Ensure position bounds are valid
		if (platformPos.x >= targetWorld.width - 1) {
			platformPos.x = targetWorld.width - 2;
		}
		if (platformPos.x < 1) {
			platformPos.x = 1;
		}

		// Create solid ground platform beneath the spawn position
		const platformGroundY = platformPos.y + 1;
		if (platformGroundY < targetWorld.depth) {
			// Create a 3x1 platform for stability
			for (let dx = -1; dx <= 1; dx++) {
				const platformX = platformPos.x + dx;
				if (platformX >= 0 && platformX < targetWorld.width) {
					targetWorld.grid[platformX][platformGroundY].ground = { type: 'white' };
					gameLog.debug('Created platform ground', { position: { x: platformX, y: platformGroundY } });
				}
			}
		}

		worldLog.warn(`Emergency spawn with platform created`, { position: platformPos });
		return platformPos;
	}

	addPlayer(name) {
		const id = simpleId();
		playerLog.info('Player session started', {
			playerId: id,
			playerName: name,
			gameId: this.id,
			gamePlayerCount: this.players.size + 1,
			sessionStartTime: new Date().toISOString(),
		});

		this.players.set(id, {
			credits: 0,
			joinTime: Date.now(),
			...this.world.newPlayer,
			configuration: {
				...this.world.newPlayer.configuration,
			},
			items: {
				...this.world.newPlayer.items,
			},
			hull: { ...this.world.newPlayer.hull },
			position: { ...this.findValidSpawnPosition(), ...this.world.newPlayer.position },
			orientation: 'right',
			moving: false,
			cargo: 0,
			health: 0,
			fuel: 0,
			xp: 0,
			stats: {
				tilesMoved: 0,
				tilesDug: 0,
				deepestDepthReached: 0,
				itemsUsed: {},
				modulesEquipped: 0,
				totalConsumedFuel: 0,
				outOfFuelEvents: 0,
				emergencyTeleports: 0,
				oreTypesCollected: {},
				creditsEarned: 0,
				worldsVisited: { [this.world.name]: true },
				creditsSpent: 0,
				asteroidsVisited: 0,
				alienEncounters: 0,
				tradesCompleted: 0,
			},
			achievements: {},
			name,
			id,
		});

		this.updatePlayerConfiguration(id);

		this.players.update(id, _ => ({
			..._,
			health: _.maxHealth,
			fuel: _.maxFuel,
		}));

		this.updateSpacecoStock();

		const newPlayer = this.players.get(id);

		this.broadcast('addPlayer', { newPlayer });

		return newPlayer;
	}

	updateSpacecoStock() {
		const playerCount = this.players.size;
		const stockedFor = spaceco.stockedForPlayers ?? 1;

		if (playerCount <= stockedFor) return;

		// Each new head adds one of every stocked item, and every second head one more listing of each kind
		Object.keys(spaceco.shop).forEach(itemName => {
			if (spaceco.shop[itemName] > 0) spaceco.shop[itemName] += playerCount - stockedFor;
		});

		const extraListings = Math.floor(playerCount / 2) - Math.floor(stockedFor / 2);

		Object.entries({ vehicles, drills, engines, parts }).forEach(([type, configs]) => {
			spaceco[type] ??= [];

			for (let i = 0; i < extraListings; i++) {
				const unlisted = Object.keys(configs).filter(id => !spaceco[type].includes(id));

				if (unlisted.length === 0) break;


		spaceco.stockedForPlayers = playerCount;

		spacecoLog.info('Stocked SpaceCo for more players', { playerCount, shop: spaceco.shop });
				spaceco[type].push(randFromArray(unlisted));
			}
		});
	}

	updatePlayerConfiguration(id, configuration) {
		if (configuration) this.players.update(id, _ => ({ ..._, configuration }));

		const player = this.players.get(id);

		if (!player.configuration) {
			playerLog.error('Player missing configuration', { playerId: id });
			return;
		}

		const vehicleConfig = vehicles[player.configuration.vehicle];
		const drillConfig = drills[player.configuration.drill];
		const engineConfig = engines[player.configuration.engine];
		const partConfig = parts[player.configuration.part] || {};

		if (!vehicleConfig || !drillConfig || !engineConfig) {
			playerLog.error('Player has invalid configuration', {
				playerId: id,
				vehicle: player.configuration.vehicle,
				drill: player.configuration.drill,
				engine: player.configuration.engine,
			});
			return;
		}

		let maxHealth = 0;
		let maxFuel = 0;
		let maxCargo = 0;
		let fuelEfficiency = 0;
		let torque = 0;
		let maxItemSlots = 0;

		[vehicleConfig, drillConfig, engineConfig, partConfig].forEach(config => {
			if (config.maxHealth) maxHealth += config.maxHealth;
			if (config.maxFuel) maxFuel += config.maxFuel;
			if (config.maxCargo) maxCargo += config.maxCargo;
			if (config.fuelEfficiency) fuelEfficiency += config.fuelEfficiency;
			if (config.torque) torque += config.torque;
			if (config.maxItemSlots) maxItemSlots += config.maxItemSlots;
		});

		this.players.update(id, _ => ({ ..._, maxHealth, maxFuel, maxCargo, fuelEfficiency, torque, maxItemSlots }));
	}

	updatePlayerCargo(playerId) {
		const player = this.players.get(playerId);
		if (!player) {
			playerLog.warning('Player not found for cargo update', { playerId });
			return;
		}

		let cargo = 0;
		const cargoBreakdown = {};

		Object.entries(player.hull || {}).forEach(([key, value]) => {
			if (value <= 0) return;

			let weight;
			let mineralType;

			if (key.startsWith('mineral_')) {
				mineralType = key.replace('mineral_', '');
				weight = (minerals[mineralType]?.weight || 0.1) / 10; // Pure minerals are lighter per unit
			} else {
				weight = minerals[key]?.weight || 0.1;
			}

			const totalWeight = weight * value;
			cargo += totalWeight;

			cargoBreakdown[key] = {
				quantity: value,
				unitWeight: weight,
				totalWeight: totalWeight.toFixed(3),
			};
		});

		const finalCargo = Math.min(cargo, player.maxCargo);

		if (cargo > player.maxCargo) {
			playerLog.warning('Player cargo exceeds capacity, clamped to max', {
				playerId,
				cargo: cargo.toFixed(2),
				maxCargo: player.maxCargo,
			});
		}

		// Only update and log if cargo actually changed
		if (Math.abs(player.cargo - finalCargo) > 0.001) {
			this.players.update(playerId, _ => ({ ..._, cargo: finalCargo }));

			if (Object.keys(cargoBreakdown).length > 0) {
				playerLog.debug('Player cargo updated', { playerId, cargo: finalCargo.toFixed(2), breakdown: cargoBreakdown });
			}
		}
	}

	spacecoSell(playerId) {
		const player = this.players.get(playerId);

		if (!player) return { success: false, error: 'Player not found' };

		if (!Object.values(player.hull || {}).some(count => count > 0)) {
			return { success: false, error: 'No minerals to sell' };
		}

		const unsold = {};
		let totalGain = 0;
		const transactionDetails = {};
		const spacecoHullUpdates = {};

		Object.entries(player.hull).forEach(([key, count]) => {
			if (count <= 0) return; // Skip zero/negative quantities

			const mineralColor = key.replace('mineral_', '');
				unsold[key] = count;

			if (!minerals[mineralColor]) {
				spacecoLog.warning('Unknown mineral type', { playerId, mineralType: mineralColor });
				return;
			}

			const isPure = key.startsWith('mineral_');
			const demandDrop = (this.world.spaceco.hull?.[key] || 0) / 1000;
			const baseValue = minerals[mineralColor].value / (isPure ? 1 : 2);

			const unitPrice = Math.floor(Math.max(0, baseValue - demandDrop));
			const totalPrice = unitPrice * count;

			if (totalPrice > 0) {
				totalGain += totalPrice;
				transactionDetails[key] = {
					count,
					unitPrice: unitPrice.toFixed(2),
					totalPrice: totalPrice.toFixed(2),
					isPure,
					demandDrop: demandDrop.toFixed(3),
			} else {
				unsold[key] = count;
				};

				spacecoHullUpdates[key] = (this.world.spaceco.hull[key] || 0) + count;
			}
		});

		if (totalGain <= 0) return { success: false, error: 'The market is saturated: these minerals fetch nothing' };

		const updates = {
			credits: player.credits + totalGain,
			stats: {
				...player.stats,
				creditsEarned: player.stats.creditsEarned + totalGain,
			},
			hull: unsold,
		};

		Object.entries(spacecoHullUpdates).forEach(([key, newQuantity]) => {
			this.world.spaceco.hull[key] = newQuantity;
		});

		this.world.spaceco.stats.creditsEarned += totalGain;

		const xpGained = getSpacecoXp(totalGain, 'mineral_sale');
		this.addSpacecoXp(xpGained);

		spacecoLog.info(`Mineral sale completed`, {
			playerId,
			totalGain,
			xpGained,
			spacecoXpTotal: this.world.spaceco.xp,
			transactionDetails,
		});

		this.players.set(playerId, { ...player, ...updates });

		this.updatePlayerCargo(playerId);

		this.broadcastWithSpacecoState(
			'spacecoSell',
			{
				playerId,
				updates: { ...updates, cargo: this.players.get(playerId).cargo },
				gain: totalGain,
				spacecoHull: this.world.spaceco.hull,
				transactionDetails, // Include detailed breakdown for client

		return { success: true };
			},
			['hull'],
		);
	}

	spacecoSellItem(playerId, item, count = 1) {
		const player = this.players.get(playerId);

		if (!player) {
			return { success: false, error: 'Player not found' };
		}

		// Check if item exists in items config
		if (!items[item]) {
			return { success: false, error: 'Invalid item' };
		}

		// Check if player has enough of the item
		const playerItemCount = player.items[item] || 0;
		if (playerItemCount < count) {
			return { success: false, error: 'Insufficient items' };
		}

		// Special handling for psykick_egg - endgame egg hunt submission
		if (item === 'psykick_egg') {
			// Remove eggs from player inventory
			const updatedItems = { ...player.items };
			updatedItems[item] = Math.max(0, updatedItems[item] - count);

			// Track egg submissions for endgame progress
			if (!this.world.spaceco.eggHunt) {
				this.world.spaceco.eggHunt = {
					totalEggsSubmitted: 0,
					playerSubmissions: new Map(),
				};
			}

			const currentSubmissions = this.world.spaceco.eggHunt.playerSubmissions.get(playerId) || 0;
			this.world.spaceco.eggHunt.playerSubmissions.set(playerId, currentSubmissions + count);
			this.world.spaceco.eggHunt.totalEggsSubmitted += count;

			const updates = {
				items: updatedItems,
				stats: {
					...player.stats,
					psykickEggsSubmitted: (player.stats.psykickEggsSubmitted || 0) + count,
				},
			};

			// Update player
			this.players.update(playerId, _ => ({ ..._, ...updates }));

			spacecoLog.info('Player submitted psykick eggs for endgame', { playerId, count });

			// Broadcast the egg submission to all clients
			this.broadcastWithSpacecoState('spacecoEggSubmission', {
				playerId,
				updates,
				item,
				count,
				totalEggsSubmitted: this.world.spaceco.eggHunt.totalEggsSubmitted,
				playerSubmissions: this.world.spaceco.eggHunt.playerSubmissions.get(playerId),
			});

			return { success: true };
		}

		// Calculate sell price (70% of current market value due to 30% restocking fee)
		const basePrice = items[item].price;
		const currentMarketPrice = Math.floor(basePrice * (1.0 + this.world.spaceco.xp / 100000));
		const unitSellPrice = Math.floor(currentMarketPrice * 0.7);
		const sellValue = unitSellPrice * count;

		// Update player inventory and credits
		const updatedItems = { ...player.items };
		updatedItems[item] = Math.max(0, updatedItems[item] - count);

		const updates = {
			items: updatedItems,
			credits: player.credits + sellValue,
			stats: {
				...player.stats,
				creditsEarned: player.stats.creditsEarned + sellValue,
			},
		};

		// Update player
		this.players.update(playerId, _ => ({ ..._, ...updates }));

		// Update SpaceCo shop stock (add items back to stock)
		if (this.world.spaceco.shop[item] !== undefined) {
			this.world.spaceco.shop[item] += count;
		}

		// Update SpaceCo stats
		this.world.spaceco.stats.creditsSpent += sellValue;
		this.addSpacecoXp(Math.floor(sellValue / 10)); // Small XP gain for SpaceCo

		spacecoLog.info('Item sold', { playerId, item, count, totalValue: sellValue, unitPrice: unitSellPrice });

		// Broadcast the sale to all clients
		this.broadcastWithSpacecoState(
			'spacecoSellItem',
			{
				playerId,
				updates,
				item,
				count,
				sellValue,
				unitSellPrice,
				spacecoUpdates: {
					shop: this.world.spaceco.shop,
					stats: this.world.spaceco.stats,
		if (!player) return { success: false, error: 'Player not found' };

				},
			},
			['shop'],
		);

		return { success: true };
	}

	spacecoRefuel(playerId, amount) {
		const player = this.players.get(playerId);
		const engineConfig = engines[player.configuration.engine];
		const pricePerUnit = getScaledServiceCosts(this.world.spaceco.xp).fuelPricePerUnit[engineConfig.fuelType];

		const maxNeededFuel = player.maxFuel - player.fuel;
		const maxAffordableFuel = player.credits / pricePerUnit;

		let fuelToPurchase;
		let cost;

		if (amount && amount > 0) {
			const requestedFuel = amount / pricePerUnit;
			fuelToPurchase = Math.min(requestedFuel, maxNeededFuel, maxAffordableFuel);
			cost = Math.floor(fuelToPurchase * pricePerUnit);
		} else {
			fuelToPurchase = Math.min(maxNeededFuel, maxAffordableFuel);
			cost = Math.floor(fuelToPurchase * pricePerUnit);
		}

		if (fuelToPurchase <= 0) return { success: false, error: 'Fuel not needed or unaffordable' };
		if (player.credits < cost) return { success: false, error: 'Insufficient credits' };

		spacecoLog.info('Fuel purchased', {
			playerId,
			amount,
			fuelToPurchase,
			cost,
			currentFuel: player.fuel,
			maxFuel: player.maxFuel,
		});

		const updates = {
			fuel: Math.min(player.maxFuel, player.fuel + fuelToPurchase), // Ensure we don't exceed max
			credits: player.credits - cost,
			stats: { ...player.stats, creditsSpent: player.stats.creditsSpent + cost }, // Fixed: was subtracting
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));


		return { success: true };
		this.world.spaceco.stats.creditsEarned += cost;
		this.world.spaceco.stats.fuelSold += fuelToPurchase; // Track fuel units, not cost
		this.addSpacecoXp(getSpacecoXp(cost, 'service_sale'));

		this.broadcastWithSpacecoState('spacecoRefuel', {
			playerId,
			updates,
			purchasedFuel: fuelToPurchase,
			cost,
		});
	}

	spacecoRepair(playerId, amount, type = 'player') {
		const player = this.players.get(playerId);

		if (type === 'player') {
			// Check if player needs repair
			if (player.health >= player.maxHealth) {
				spacecoLog.debug('Player already at full health');
				return { success: false, error: 'Your drilling rig is already in perfect condition' };
			}

			const pricePerHealth = getScaledServiceCosts(this.world.spaceco.xp).repairCostPerHealthPoint;
			const neededHealth = player.maxHealth - player.health;
			const purchasedRepairs = amount ? Math.min(amount / pricePerHealth, neededHealth) : neededHealth;
			const cost = Math.floor(purchasedRepairs * pricePerHealth);

			if (player.credits < cost) {
				spacecoLog.debug('Cannot afford player repair');
				return {
					success: false,
					error: `Insufficient credits. Player repair costs ${Math.floor(cost)}, you have ${player.credits}`,
				};
			}

			const updates = {
				health: Math.min(player.maxHealth, player.health + purchasedRepairs), // Cap at maxHealth
				credits: player.credits - cost,
				stats: { ...player.stats, creditsSpent: player.stats.creditsSpent + cost }, // Should ADD to creditsSpent
			};

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.world.spaceco.stats.creditsEarned += cost;
			++this.world.spaceco.stats.repairsSold;
			this.addSpacecoXp(getSpacecoXp(cost, 'service_sale'));

			this.broadcastWithSpacecoState(
				'spacecoRepair',
				{
					playerId,
					updates,
					purchasedRepairs,
					cost,
					type,
				},
				['shop'],
			);

			return { success: true };
		} else if (type === 'outpost') {
			// Check if outpost needs repair
			if (this.world.spaceco.health >= 9) {
				spacecoLog.debug('Outpost already at full health');
				return { success: false, error: 'SpaceCo outpost is already fully operational' };
			}

			const pricePerHealth = getScaledServiceCosts(this.world.spaceco.xp).spacecoRepairCostPerHealthPoint;
			const neededHealth = 9 - this.world.spaceco.health;
			const purchasedRepairs = neededHealth;
			const cost = Math.floor(purchasedRepairs * pricePerHealth);

			if (player.credits < cost) {
				spacecoLog.debug('Cannot afford outpost repair');
				return {
					success: false,
					error: `Insufficient credits. Outpost repair costs ${Math.floor(cost)}, you have ${player.credits}`,
				};
			}

			this.world.spaceco.health = 9;

			const updates = {
				credits: player.credits - cost,
				stats: { ...player.stats, creditsSpent: player.stats.creditsSpent + cost }, // Should ADD to creditsSpent
			};

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.world.spaceco.stats.creditsEarned += cost;
			++this.world.spaceco.stats.repairsSold;
			this.addSpacecoXp(getSpacecoXp(cost, 'service_sale'));

			this.broadcastWithSpacecoState(
				'spacecoRepair',
				{
					playerId,
					updates,
					purchasedRepairs,
					cost,
					type,
				},
				['health'],
			);

			return { success: true };
		}
	}

	validateItemPurchase(playerId, item, count = 1) {
		const player = this.players.get(playerId);
		if (!player) {
			return { success: false, error: 'Player not found' };
		}

		// Validate item exists in items config
		if (!items[item]) {
			return { success: false, error: 'Invalid item' };
		}

		// Check if item is available in shop
		const availableStock = this.world.spaceco.shop[item];
		if (availableStock === undefined) {
			return { success: false, error: 'Item not available' };
		}

		// Validate stock availability
		if (availableStock < count) {
			return { success: false, error: 'Insufficient stock' };
		}

		// Calculate total cost with inflation
		const basePrice = items[item].price;
		const scaledPrice = getScaledItemPrice(basePrice, this.world.spaceco.xp);
		const totalCost = scaledPrice * count;

		// Check player affordability
		if (player.credits < totalCost) {
			return { success: false, error: 'Insufficient credits' };
		}

		// Check inventory space
		const currentItemCount = Object.values(player.items).reduce((sum, count) => sum + count, 0);
		if (currentItemCount + count > player.maxItemSlots) {
			return { success: false, error: 'Insufficient inventory space' };
		}

		return {
			success: true,
			cost: totalCost,
			unitCost: scaledPrice,
			currentSlots: currentItemCount,
			maxSlots: player.maxItemSlots,
		};
	}

	spacecoBuyItem(playerId, item, count = 1) {
		// Use validation function
		const validation = this.validateItemPurchase(playerId, item, count);

		if (!validation.success) {
			return validation;
		}

		const player = this.players.get(playerId);
		const { cost } = validation;

		const updates = {
			items: { ...player.items },
			credits: player.credits - cost,
			stats: {
				...player.stats,
				creditsSpent: player.stats.creditsSpent + cost,
			},
		};

		// Special handling for pension_credit_buyup - convert to XP instead of adding to inventory
		if (item === 'pension_credit_buyup') {
			// Convert cost to player XP (50% conversion rate)
			const xpGained = Math.floor(cost * 0.5);
			updates.xp = (player.xp || 0) + xpGained;

			spacecoLog.info('Pension credit buy-up', {
				playerId,
				creditsSpent: cost,
				xpGained,
				totalXp: updates.xp,
			});
		} else {
			// Regular items go to inventory
			updates.items[item] = (updates.items[item] || 0) + count;
		}

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		if (item === 'pension_credit_buyup') this.broadcastXpGain(playerId, updates.xp - (player.xp || 0));

		this.world.spaceco.shop[item] -= count;
		this.world.spaceco.stats.creditsEarned += cost;
		this.world.spaceco.stats.itemsSold += count;
		this.addSpacecoXp(getSpacecoXp(cost, 'service_sale'));

		// Audit log for item purchase
		spacecoLog.info('Item purchase completed', {
			playerId,
			item,
			count,
			unitCost: validation.unitCost,
			totalCost: cost,
			playerCreditsAfter: updates.credits,
			playerCreditsSpentTotal: updates.stats.creditsSpent,
			spacecoStock: this.world.spaceco.shop[item],
			transactionType: 'item_purchase',
		});

		this.broadcastWithSpacecoState(
			'spacecoBuyItem',
			{
				playerId,
				updates,
				item,
				count,
				cost,
				unitCost: validation.unitCost,
				currentSlots: validation.currentSlots + count,
				maxSlots: validation.maxSlots,
				spacecoUpdates: {
					shop: this.world.spaceco.shop,
					stats: this.world.spaceco.stats,
					xp: this.world.spaceco.xp,
				},
			},
			['shop'],
		);

		return { success: true };
	}

	spacecoBuyUpgrade(playerId, upgrade, type) {
		const player = this.players.get(playerId);
		if (!player) {
			spacecoLog.warning('Player not found for upgrade');
			return { success: false, error: 'Contractor credentials invalid' };
		}

		const validTypes = ['vehicles', 'drills', 'engines', 'parts'];
		if (!validTypes.includes(type)) {
			spacecoLog.warning('Invalid upgrade type', { type });
			return { success: false, error: 'Invalid upgrade category specified' };
		}

		const upgradeConfigs = { vehicles, drills, engines, parts };
		const upgradeConfig = upgradeConfigs[type][upgrade];

		if (!upgradeConfig) {
			spacecoLog.warning('Invalid upgrade', { upgrade, type });
			return { success: false, error: 'Requested upgrade not recognized by SpaceCo systems' };
		}

		if (!this.world.spaceco[type].includes(upgrade)) {
			spacecoLog.warning('Upgrade not in inventory', { upgrade });
			return { success: false, error: 'Upgrade temporarily out of stock at this outpost' };
		}

		let configKey;
		if (type === 'vehicles') {
			configKey = 'vehicle';
		} else if (type === 'drills') {
			configKey = 'drill';
		} else if (type === 'engines') {
			configKey = 'engine';
		} else if (type === 'parts') {
			configKey = 'part';
		} else {
			configKey = type;
		}

		const currentEquipmentId = player.configuration[configKey];
		this.broadcastXpGain(playerId, finalCost);
		let tradeInDiscount = 0;

		if (currentEquipmentId) {
			const currentEquipmentConfig = upgradeConfigs[type][currentEquipmentId];
			if (currentEquipmentConfig && currentEquipmentConfig.price) {
				tradeInDiscount = Math.floor(currentEquipmentConfig.price * 0.25);
			}
		}

		const basePrice = upgradeConfig.price || 0;
		const finalCost = Math.max(0, basePrice - tradeInDiscount);

		if (player.credits < finalCost) {
			spacecoLog.debug('Cannot afford upgrade after trade-in', { finalCost, playerCredits: player.credits });
			return { success: false, error: `Insufficient credits. Required: ${finalCost}, Available: ${player.credits}` };
		}

		// Check requirements (especially torque for drills)
		if (upgradeConfig.requirements) {
			const unmetRequirements = [];

			upgradeConfig.requirements.forEach(([requirementType, amount]) => {
				let currentValue = 0;

				if (requirementType === 'torque') {
					currentValue = player.torque || 0;
				}
				// Add other requirement types here if needed in the future

				if (currentValue < amount) {
					unmetRequirements.push({ type: requirementType, required: amount, current: currentValue });
				}
			});

			if (unmetRequirements.length > 0) {
				// Return error with detailed requirement information
				const requirementText = unmetRequirements
					.map(req => {
						if (req.type === 'torque') {
							return `${req.required} Nm torque (current: ${req.current} Nm)`;
						}
						return `${req.required} ${req.type} (current: ${req.current})`;
					})
					.join(', ');

				return {
					success: false,
					error: `Insufficient engine power. This ${type.slice(0, -1)} requires ${requirementText}.`,
				};
			}
		}

		const newConfiguration = {
			...player.configuration,
			[configKey]: upgrade,
		};

		const updates = {
			configuration: newConfiguration,
			credits: player.credits - finalCost,
			xp: player.xp + finalCost, // XP based on amount actually paid
			stats: {
				...player.stats,
				creditsSpent: player.stats.creditsSpent + finalCost,
				modulesEquipped: player.stats.modulesEquipped + 1,
			},
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		const oldMaxHealth = player.maxHealth;
		this.updatePlayerConfiguration(playerId);

		// Handle health restoration/capping based on upgrade type
		const updatedPlayer = this.players.get(playerId);
		const newMaxHealth = updatedPlayer.maxHealth;

		if (type === 'vehicles') {
			// New vehicle: restore to full health
			this.players.update(playerId, _ => ({ ..._, health: newMaxHealth }));
		} else if (newMaxHealth !== oldMaxHealth) {
			// Part upgrade that changes maxHealth: cap current health if it exceeds new max
			if (player.health > newMaxHealth) {
				this.players.update(playerId, _ => ({ ..._, health: newMaxHealth }));
			}
			// If maxHealth increased, current health stays the same (no free healing)
		}

		this.world.spaceco[type] = this.world.spaceco[type].filter(id => id !== upgrade);

		this.world.spaceco.stats.creditsEarned += finalCost;
		this.world.spaceco.stats.upgradesSold = (this.world.spaceco.stats.upgradesSold || 0) + 1;

		if (!this.world.spaceco.stats.upgradesSoldByType) {
			this.world.spaceco.stats.upgradesSoldByType = {};
		}

		// Audit log for upgrade purchase
		spacecoLog.info('Upgrade purchase completed', {
			playerId,
			upgrade,
			upgradeType: type,
			basePrice,
			tradeInDiscount,
			finalCost,
			playerCreditsAfter: updates.credits,
			playerXpAfter: updates.xp,
			playerCreditsSpentTotal: updates.stats.creditsSpent,
			transactionType: 'upgrade_purchase',
			previousUpgrade: player.configuration[configKey],
		});
		const upgradeTypeKey = `${configKey}_${upgrade}`;
		this.world.spaceco.stats.upgradesSoldByType[upgradeTypeKey] =
			(this.world.spaceco.stats.upgradesSoldByType[upgradeTypeKey] || 0) + 1;

		this.addSpacecoXp(getSpacecoXp(finalCost, 'upgrade_sale'));
		const mineralsLeft = this.world.grid
			.flat()
			.reduce((count, cell) => count + cell.items.filter(item => item.name.startsWith('mineral')).length, 0);


		this.broadcastWithSpacecoState(
			'spacecoBuyUpgrade',
			{
				playerId,
				updates: (({
					configuration,
					credits,
					xp,
					health,
		this.broadcastXpGain(playerId, newWorld.transportPrice);
					maxHealth,
					maxFuel,
					maxCargo,
					fuelEfficiency,
					torque,
					maxItemSlots,
				}) => ({
					configuration,
					credits,
					xp,
					health,
					maxHealth,
					maxFuel,
			this.stopMovement(currentPlayerId);

					maxCargo,
					fuelEfficiency,
					torque,
					maxItemSlots,
				}))(this.players.get(playerId)),
				upgrade,
				type,
				configKey,
				cost: finalCost,
				originalCost: basePrice,
				tradeInDiscount, // Include in response for client feedback
				spacecoUpdates: { [type]: this.world.spaceco[type] },
			},
			[type],
		);
					worldsVisited: { ...currentPlayer.stats.worldsVisited, [newWorld.name]: true },
	}

	spacecoBuyTransport(playerId, world = randFromArray(Object.keys(WORLDS))) {
		const player = this.players.get(playerId);
		const newWorld = WORLDS[world];

		if (!player) return { success: false, error: 'Player not found' };
		if (!newWorld || !transportConfig) {
			return { success: false, error: 'Requested destination not available from current asteroid.' };
		}

		const transportCost = getScaledTransportCost(newWorld.transportPrice, this.world.spaceco.xp);

		if (player.credits < transportCost) {
			return {
				success: false,
				error: `Insufficient credits for transport. Required: ${transportCost}, Available: ${player.credits}`,
			};
		}

		this.updateSpacecoStock();

		const requirementsMet = transportConfig.requirements.every(([requirementType, amount]) => {
			if (requirementType === 'xp') {
				return this.world.spaceco.xp >= amount;
			} else {
				return (this.world.spaceco.hull[requirementType] || 0) >= amount;
			}
		});

		if (!requirementsMet) {
			return { success: false, error: 'Transport requirements not met for selected destination.' };
		}

		const updates = {
			credits: player.credits - transportCost,
			xp: player.xp + newWorld.transportPrice, // Base XP, not scaled
			stats: {
				...player.stats,
				creditsSpent: player.stats.creditsSpent + transportCost, // Use actual cost paid
			},
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		spacecoLog.info(`Transport successful`, { playerId, world, cost: transportCost });

		this.world.spaceco.stats.creditsEarned += transportCost;
		++this.world.spaceco.stats.transportsCompleted;
		this.world.spaceco.stats.levelsVisited[newWorld.name] = true;
		this.addSpacecoXp(getSpacecoXp(transportCost, 'transport'));

		// Generate the new world FIRST so spaceco position is available for spawn position calculation
		this.world = generateAsteroid({
			...newWorld,
			spaceco: {
				...newWorld.spaceco,
				hull: this.world.spaceco.hull,
				xp: this.world.spaceco.xp,
				stats: this.world.spaceco.stats,
				achievements: this.world.spaceco.achievements,
			},
		});

		// Now update player positions with the generated world
		this.players.forEach((currentPlayer, currentPlayerId) => {
			const hasInsurance = (currentPlayer.items.transport_insurance || 0) > 0;

			const updatedPlayer = {
				...currentPlayer,
				stats: {
					...currentPlayer.stats,
					asteroidsVisited: currentPlayer.stats.asteroidsVisited + 1,
				},
				position: {
					...this.findValidSpawnPosition(), // Use current world (just generated)
					...newWorld.newPlayer?.position,
				},
			};

			if (!hasInsurance) {
				// Lose all items except credits and minerals
				updatedPlayer.items = {};
				playerLog.info('Player lost items without insurance', { playerId: currentPlayerId });
			} else {
				// Consume insurance but keep items
				updatedPlayer.items = { ...updatedPlayer.items };
				updatedPlayer.items.transport_insurance -= 1;
				if (updatedPlayer.items.transport_insurance <= 0) {
					delete updatedPlayer.items.transport_insurance;
				}
				playerLog.info('Player used insurance, items preserved', { playerId: currentPlayerId });
			}

			this.players.set(currentPlayerId, updatedPlayer);
		});


		return { success: true };
		this.broadcastWithSpacecoState(
			'spacecoBuyTransport',
			{
				playerId,
				updates,
				cost: transportCost,
				world: newWorld.name,
				mineralsLeft,
				newWorldState: { ...this.world, players: [...this.players.values()] },
			},
			['hull'],
		);
	}

	spacecoResupply(playerId) {
		const player = this.players.get(playerId);
		if (!player) return { success: false, error: 'Player not found' };

		const resupplyCost = Math.floor(this.world.transportPrice * 0.9);

		if (player.credits < resupplyCost) {
			return {
				success: false,
				error: `Insufficient credits for resupply. Required: ${resupplyCost}, Available: ${player.credits}`,
			};
		}
		// A device set down where the rig stands; driving over it later does not pick it back up
		const place = name => this.world.grid[position.x][position.y].items.push({ name, placed: true });
		const teleport = to => {
			updates.position = to;
			this.stopMovement(playerId);
		};


		// Deduct cost
		const updates = {
			credits: player.credits - resupplyCost,
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		// A fresh roll of the world's stock, on top of what is left
		Object.entries(this.world.config?.spaceco?.shop || {}).forEach(([itemName, stockValue]) => {
			const newStock = Array.isArray(stockValue) ? randInt(stockValue[0], stockValue[1]) : stockValue;

		const worldConfig = this.world.config; // Store original config in world during generation
			place(item);

		if (worldConfig?.spaceco?.shop) {
			Object.entries(worldConfig.spaceco.shop).forEach(([itemName, stockValue]) => {
				// If stock is an array [min, max], pick random value in range
				if (Array.isArray(stockValue)) {
					const newStock = randInt(stockValue[0], stockValue[1]);
					// Add to existing stock (don't replace)
					const currentStock = this.world.spaceco.shop[itemName] || 0;
					const finalStock = Array.isArray(currentStock) ? newStock : currentStock + newStock;
					this.world.spaceco.shop[itemName] = finalStock;
				} else if (typeof stockValue === 'number') {
					// If single number, add that amount
					const currentStock = this.world.spaceco.shop[itemName] || 0;
					const finalStock = Array.isArray(currentStock) ? stockValue : currentStock + stockValue;
					this.world.spaceco.shop[itemName] = finalStock;
				}
			});
		}

		// Update SpaceCo stats
		this.world.spaceco.stats.creditsEarned += resupplyCost;
		this.addSpacecoXp(Math.floor(resupplyCost / 10));

		spacecoLog.info('Resupply successful', {
			playerId,
			cost: resupplyCost,
			newShopStock: this.world.spaceco.shop,
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		this.world.spaceco.stats.creditsEarned += cost;
		this.addSpacecoXp(getSpacecoXp(cost, 'service_sale'));

		playerLog.info('Player rescued by SpaceCo', { playerId, cost });

		this.broadcastWithSpacecoState('spacecoRescue', { playerId, updates, cost });

		return { success: true };

			place(item);
		this.broadcastWithSpacecoState('spacecoResupply', { playerId, updates, cost: resupplyCost }, ['shop']);

		return { success: true };
	}

	spacecoRescue(playerId) {
		const player = this.players.get(playerId);
		if (!player) return { success: false, error: 'Player not found' };

		const { position } = this.world.spaceco;
		const cost = getScaledServiceCosts(this.world.spaceco.xp).rescueCost;

		if (player.position.x === position.x && player.position.y === position.y) {
			return { success: false, error: 'You are already at the outpost' };
		}
		if (player.credits < cost) {
			return { success: false, error: `Insufficient credits. Rescue costs ${cost}, you have ${player.credits}` };
		}
			teleport(station);
			updates.items.advanced_teleporter = (player.items.advanced_teleporter || 0) + 1;

		this.stopMovement(playerId);

		const updates = {
			position: { ...position },
			credits: player.credits - cost,
			stats: {
				...player.stats,
				creditsSpent: player.stats.creditsSpent + cost,
				emergencyTeleports: player.stats.emergencyTeleports + 1,
			},
		});
	}

	validateItemUsage(playerId, item) {
		const player = this.players.get(playerId);
		if (!player) return { success: false, error: 'Player not found' };

		const itemCount = player.items[item] || 0;
		if (itemCount <= 0) {
			return { success: false, error: 'Item not in inventory' };
		}

		const baseItem = item.replace(/_\d+_\d+$/, '');

		if (!usableItems.has(baseItem)) return { success: false, error: 'That item is not used by hand' };

		if (fuelItems.includes(item) && engines[player.configuration.engine].fuelType !== item) {
			return { success: false, error: 'Incompatible fuel type' };
		}

		if (item === 'spaceco_teleport_station') {
			const distance =
				Math.abs(player.position.x - this.world.spaceco.position.x) +
				Math.abs(player.position.y - this.world.spaceco.position.y);

			if (distance < 3) return { success: false, error: 'Too close to current outpost location' };
		}

		return { success: true };
	}

	// Helper method to securely access grid cells
	safeGetGridCell(x, y) {
		if (!this.world.grid || !this.world.grid[x] || !this.world.grid[x][y]) {
			return null;
		}
		return this.world.grid[x][y];
	}

	useItem(playerId, item) {
		const player = this.players.get(playerId);

		const player = this.players.get(playerId);
		const position = { ...player.position };

		const updates = {
			items: { ...player.items, [item]: player.items[item] - 1 },
			stats: {
				...player.stats,
				itemsUsed: { ...player.stats.itemsUsed, [item]: (player.stats.itemsUsed[item] ?? 0) + 1 },
			},
		};

		if (item === 'spaceco_teleporter') {
			teleport({ ...this.world.spaceco.position });
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item });
		} else if (item === 'repair_nanites') {
			updates.health = player.maxHealth;
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item });
		} else if (fuelItems.includes(item)) {
			updates.fuel = Math.min(player.maxFuel, player.fuel + items[item].units);
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item });
		} else if (item === 'timed_charge') {
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item, bombPosition: position });

			setTimeout(() => explode({ game: this, position, radius: 3, playerId }), 3000);
		} else if (item === 'remote_charge') {
			place(item);
			updates.items[`detonator_${position.x}_${position.y}`] = 1;
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item, bombPosition: position });
		} else if (item.startsWith('detonator_')) {
			const [, x, y] = item.split('_');

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.broadcast('useItem', { playerId, updates, item });

			explode({ game: this, position: { x: parseInt(x, 10), y: parseInt(y, 10) }, radius: 5, playerId });
		} else if (item.startsWith('void_detonator_')) {
			const [, , x, y] = item.split('_');

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.broadcast('useItem', { playerId, updates, item });

			this.implode({
				game: this,
				position: { x: parseInt(x, 10), y: parseInt(y, 10) },
				radius: 6,
				playerId,
				implosionType: 'void',
			});
		} else if (item === 'gravity_charge') {
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item, bombPosition: position });

			setTimeout(() => this.implode({ position, radius: 4, playerId, implosionType: 'gravity' }), 2000);
		} else if (item === 'void_implosion') {
			place(item);
			updates.items[`void_detonator_${position.x}_${position.y}`] = 1;
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item, bombPosition: position });
		} else if (item === 'advanced_teleporter') {
			place('teleport_station');
			updates.items[`activated_teleporter_${position.x}_${position.y}`] = 1;
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item, stationPosition: position });
		} else if (item.startsWith('activated_teleporter_')) {
			const [, , x, y] = item.split('_');
			const station = { x: parseInt(x, 10), y: parseInt(y, 10) };

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			const cell = this.safeGetGridCell(station.x, station.y);
			if (cell) cell.items = cell.items.filter(item => item.name !== 'teleport_station');

			this.broadcast('useItem', { playerId, updates, item, stationPosition: station });
		} else if (item === 'spaceco_teleport_station') {
			// Teleport SpaceCo to the player's position
			const newPosition = { ...player.position };
			this.world.spaceco.position = newPosition;

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			// Broadcast spaceco relocation to all players
			this.broadcast('spaceco', { update: 'spacecoRelocate', playerId, newPosition });
			this.broadcast('useItem', { playerId, updates, item });
		} else {
			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.broadcast('useItem', { playerId, updates, item });

		return { success: true };
	}

	implode({ position, radius, playerId, implosionType = 'gravity' }) {
		gameLog.info('Implosion event', { position, radius, implosionType, playerId });

		const collectedMinerals = {};
		const collectedItems = {};
		const playersToFall = [];
		const destroyedPositions = [];

		// Get all positions within the implosion radius
		const implosionPositions = getSurroundingRadius(position, radius);

		// First pass: collect all materials and mark for destruction
		implosionPositions.forEach(({ x, y }) => {
			if (this.world.grid[x]?.[y]) {
				const cell = this.world.grid[x][y];

				// Collect minerals from ground
				if (cell.ground?.type) {
					const mineralType = cell.ground.type;
					collectedMinerals[mineralType] = (collectedMinerals[mineralType] || 0) + 1;
				}

				// Collect pure minerals and other items (but not explosives to avoid chain reactions)
				cell.items.forEach(item => {
					if (item.name.startsWith('mineral_')) {
						const mineralType = item.name.replace('mineral_', '');
						const pureKey = `mineral_${mineralType}`;
						collectedMinerals[pureKey] = (collectedMinerals[pureKey] || 0) + 1;
					} else if (!item.name.includes('charge') && !item.name.includes('implosion')) {
						// Don't collect explosives to avoid chain reactions
						collectedItems[item.name] = (collectedItems[item.name] || 0) + 1;
					}
				});

				// Check for chain reactions with other explosives
				cell.items.forEach(item => {
					if ((item.name.includes('charge') || item.name === 'oil') && !(x === position.x && y === position.y)) {
						// Small delay for chain reaction visual effect
						setTimeout(() => {
							if (item.name === 'gravity_charge') {
								this.implode({
									position: { x, y },
									radius: 4,
									playerId,
									implosionType: 'gravity',
								});
							} else if (item.name === 'void_implosion') {
								this.implode({
									position: { x, y },
									radius: 6,
									playerId,
									implosionType: 'void',
								});
							} else {
								// Use consistent explode function for chain reactions
								explode({ game: this, position: { x, y }, radius: 3, playerId });
							}
						}, 200);
					}
				});

				// Mark position for destruction
				destroyedPositions.push({ x, y });

				// Clear the cell
				this.world.grid[x][y] = { ground: {}, items: [], hazards: [] };
			}

			// Check for SpaceCo damage
			if (this.world.spaceco.position.x === x && this.world.spaceco.position.y === y) {
				this.world.spaceco.health = Math.max(0, this.world.spaceco.health - 2); // More damage than regular explosion
			}

			// Check for player damage/falling
			this.players.forEach(player => {
				if (player.position.x === x && player.position.y === y) {
					playersToFall.push(player.id);
				}
			});
		});

		// Award collected materials to the player who used the implosion device
		const player = this.players.get(playerId);
		if (player && (Object.keys(collectedMinerals).length > 0 || Object.keys(collectedItems).length > 0)) {
			const updatedHull = { ...player.hull };
			const updatedItems = { ...player.items };

			// Add collected minerals
			Object.entries(collectedMinerals).forEach(([mineralType, count]) => {
				updatedHull[mineralType] = (updatedHull[mineralType] || 0) + count;
			});

			// Add collected items
			Object.entries(collectedItems).forEach(([itemType, count]) => {
				updatedItems[itemType] = (updatedItems[itemType] || 0) + count;
			});

			// Update player
			this.players.update(playerId, _ => ({
				..._,
				hull: updatedHull,
				items: updatedItems,
			}));

			// Update cargo weight
			this.updatePlayerCargo(playerId);

			gameLog.info('Implosion collection for player', { playerId, minerals: collectedMinerals, items: collectedItems });
		}

		// Broadcast the implosion event
		this.broadcast('explodeImplosion', {
			radius,
			position,
			implosionType,
			playerId,
			collectedMinerals,
			collectedItems,
			destroyedPositions,
		});

		// Handle falling objects
		this.spacecoFall();
		playersToFall.forEach(playerId => this.playerFall(playerId));

		// Check for extra players who lost wheel support due to ground destruction
		this.checkForPlayerFalls();

		// Save the game state
		this.save();
	}

	removePlayer(id) {
		const player = this.players.get(id);

		if (player) {
			playerLog.info('Player session ended', {
				playerId: id,
		if (initiatorId === targetId) {
			return { success: false, error: 'You cannot trade with yourself' };
		}

				playerName: player.name,
				gameId: this.id,
				sessionDuration: player.joinTime ? `${((Date.now() - player.joinTime) / 1000).toFixed(1)}s` : 'unknown',
				credits: player.credits,
				level: player.level,
				gamePlayerCount: this.players.size - 1,
			});
		}

		// Cancel any active trades involving this player
		[...this.activeTrades.values()]
			.filter(trade => trade.player1Id === id || trade.player2Id === id)
			.forEach(trade => {
				this.activeTrades.delete(trade.id);
				this.broadcast('tradeCancelled', {
					tradeId: trade.id,
					cancelledBy: id,
					player1Id: trade.player1Id,
					player2Id: trade.player2Id,
				});
			});
		}

		this.players.delete(id);
		this.broadcast('removePlayer', { id });

		return id;
	}

	initiateTrade(initiatorId, targetId) {
		const initiator = this.players.get(initiatorId);
		const target = this.players.get(targetId);

		if (!initiator || !target) {
			return { success: false, error: 'One or both players not found' };
		}

		// Check if players are within trade range (adjacent positions)
		const distance =
			Math.abs(initiator.position.x - target.position.x) + Math.abs(initiator.position.y - target.position.y);

		if (distance > 1) {
			return { success: false, error: 'Players must be adjacent to trade' };
		}

		const existingTrade = Array.from(this.activeTrades.values()).find(
			trade =>
				(trade.player1Id === initiatorId ||
					trade.player2Id === initiatorId ||
					trade.player1Id === targetId ||
					trade.player2Id === targetId) &&
				trade.status === 'active',
		);

		if (existingTrade) {
			playerLog.warning('Cannot initiate trade - players already have active trade', {
				initiatorId,
				targetId,
				existingTradeId: existingTrade.id,
				existingTradeStatus: existingTrade.status,
			});
			// Force cleanup the stale trade and allow new one
			playerLog.info('Force cleaning up stale trade to allow new session', {
				tradeId: existingTrade.id,
			});
			this.activeTrades.delete(existingTrade.id);
			this.broadcast('tradeCancelled', {
				tradeId: existingTrade.id,
				cancelledBy: initiatorId,
				player1Id: existingTrade.player1Id,
				player2Id: existingTrade.player2Id,
			});
		}

		const tradeId = simpleId();
		const trade = {
			id: tradeId,
			player1Id: initiatorId,
			player2Id: targetId,
			player1Offer: { credits: 0, items: {}, minerals: {} },
			player2Offer: { credits: 0, items: {}, minerals: {} },
			player1Accepted: false,
			player2Accepted: false,
			status: 'active',
			createdAt: Date.now(),
		};

		this.activeTrades.set(tradeId, trade);

		// Broadcast trade session started to both players
		this.broadcast('tradeSessionStarted', {
			trade,
			player1Name: initiator.name,
			player2Name: target.name,
		});

		return { success: true, tradeId };
	}

	updateTradeOffer(playerId, tradeId, offer) {
		const trade = this.activeTrades.get(tradeId);

		if (!trade) {
			return { success: false, error: 'Trade not found or expired' };
		}

		if (trade.status !== 'active') {
			return { success: false, error: 'Trade is no longer active' };
		}

		if (trade.player1Id !== playerId && trade.player2Id !== playerId) {
			return { success: false, error: 'You are not part of this trade' };
		}

		const player = this.players.get(playerId);
		if (!player) {
			return { success: false, error: 'Player not found' };
		}

		// Validate that player has what they're offering
		const validation = this.validateTradeResources(player, offer);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}

		// Update the offer and reset acceptance flags
		if (trade.player1Id === playerId) {
			trade.player1Offer = offer;
		} else {
			trade.player2Offer = offer;
		}

		// Reset both acceptance flags when either player changes their offer
		trade.player1Accepted = false;
		trade.player2Accepted = false;

		// Broadcast the updated trade state to both players
		this.broadcast('tradeUpdated', {
			tradeId,
			trade,
			updatedBy: playerId,
		});

		return { success: true };
	}

	acceptTrade(playerId, tradeId) {
		const trade = this.activeTrades.get(tradeId);

		if (!trade) {
			return { success: false, error: 'Trade not found or expired' };
		}

		if (trade.status !== 'active') {
			return { success: false, error: 'Trade is no longer active' };
		}

		if (trade.player1Id !== playerId && trade.player2Id !== playerId) {
			return { success: false, error: 'You are not part of this trade' };
		}

		// Mark this player as accepted
		if (trade.player1Id === playerId) {
			trade.player1Accepted = true;
		} else {
			trade.player2Accepted = true;
		}

		// Broadcast acceptance update
		this.broadcast('tradeAcceptanceChanged', {
			tradeId,
			playerId,
			player1Accepted: trade.player1Accepted,
			player2Accepted: trade.player2Accepted,
		});

		// If both players accepted, execute the trade
		if (trade.player1Accepted && trade.player2Accepted) {
			return this.executeTradeSession(trade);
		}

		return { success: true, waitingForOther: true };
	}

	executeTradeSession(trade) {
		const player1 = this.players.get(trade.player1Id);
		const player2 = this.players.get(trade.player2Id);

		if (!player1 || !player2) {
			return { success: false, error: 'One or both players no longer exist' };
		}

		// An offer can go stale between acceptances (credits spent elsewhere); both sides accept again
		const failed = [
			[player1, this.validateTradeResources(player1, trade.player1Offer)],
			[player2, this.validateTradeResources(player2, trade.player2Offer)],
		].find(([, validation]) => !validation.valid);

		if (failed) {
			const [player, validation] = failed;
			trade.player1Accepted = false;
			trade.player2Accepted = false;
			this.broadcast('tradeAcceptanceChanged', {
				tradeId: trade.id,
				playerId: player.id,
				player1Accepted: false,
				player2Accepted: false,
			});

			return { success: false, error: `${player.name}: ${validation.error}` };
		}

		// Execute the trade
		const player1Updates = {
			credits: player1.credits,
			items: { ...player1.items },
			hull: { ...player1.hull },
			stats: { ...player1.stats },
		};

		const player2Updates = {
			credits: player2.credits,
			items: { ...player2.items },
			hull: { ...player2.hull },
			stats: { ...player2.stats },
		};

		// Remove offered resources from player1
		if (trade.player1Offer.credits) {
			player1Updates.credits -= trade.player1Offer.credits;
		}

		if (trade.player1Offer.items) {
			Object.entries(trade.player1Offer.items).forEach(([itemName, quantity]) => {
				player1Updates.items[itemName] = (player1Updates.items[itemName] || 0) - quantity;
				if (player1Updates.items[itemName] <= 0) {
					delete player1Updates.items[itemName];
				}
			});
		}

		if (trade.player1Offer.minerals) {
			Object.entries(trade.player1Offer.minerals).forEach(([mineralName, quantity]) => {
				player1Updates.hull[mineralName] = (player1Updates.hull[mineralName] || 0) - quantity;
				if (player1Updates.hull[mineralName] <= 0) {
					delete player1Updates.hull[mineralName];
				}
			});
		}

		// Remove offered resources from player2
		if (trade.player2Offer.credits) {
			player2Updates.credits -= trade.player2Offer.credits;
		}

		if (trade.player2Offer.items) {
			Object.entries(trade.player2Offer.items).forEach(([itemName, quantity]) => {
				player2Updates.items[itemName] = (player2Updates.items[itemName] || 0) - quantity;
				if (player2Updates.items[itemName] <= 0) {
					delete player2Updates.items[itemName];
				}
			});
		}

		if (trade.player2Offer.minerals) {
			Object.entries(trade.player2Offer.minerals).forEach(([mineralName, quantity]) => {
				player2Updates.hull[mineralName] = (player2Updates.hull[mineralName] || 0) - quantity;
				if (player2Updates.hull[mineralName] <= 0) {
					delete player2Updates.hull[mineralName];
				}
			});
		}

		// Add received resources to player1
		if (trade.player2Offer.credits) {
			player1Updates.credits += trade.player2Offer.credits;
		}

		if (trade.player2Offer.items) {
			Object.entries(trade.player2Offer.items).forEach(([itemName, quantity]) => {
				player1Updates.items[itemName] = (player1Updates.items[itemName] || 0) + quantity;
			});
		}

		if (trade.player2Offer.minerals) {
			Object.entries(trade.player2Offer.minerals).forEach(([mineralName, quantity]) => {
				player1Updates.hull[mineralName] = (player1Updates.hull[mineralName] || 0) + quantity;
			});
		}

		// Add received resources to player2
		if (trade.player1Offer.credits) {
			player2Updates.credits += trade.player1Offer.credits;
		}

		if (trade.player1Offer.items) {
			Object.entries(trade.player1Offer.items).forEach(([itemName, quantity]) => {
				player2Updates.items[itemName] = (player2Updates.items[itemName] || 0) + quantity;
			});
		}

		if (trade.player1Offer.minerals) {
			Object.entries(trade.player1Offer.minerals).forEach(([mineralName, quantity]) => {
				player2Updates.hull[mineralName] = (player2Updates.hull[mineralName] || 0) + quantity;
			});
		}

		// Update stats
		player1Updates.stats.tradesCompleted = (player1Updates.stats.tradesCompleted || 0) + 1;
		player2Updates.stats.tradesCompleted = (player2Updates.stats.tradesCompleted || 0) + 1;

		// Apply updates
		this.players.set(trade.player1Id, { ...player1, ...player1Updates });
		this.players.set(trade.player2Id, { ...player2, ...player2Updates });

		// Update cargo weights
		this.updatePlayerCargo(trade.player1Id);
		this.updatePlayerCargo(trade.player2Id);

		trade.status = 'completed';
		this.activeTrades.delete(trade.id);

		this.broadcast('tradeCompleted', {
			tradeId: trade.id,
			player1Id: trade.player1Id,
			player2Id: trade.player2Id,
			player1Updates,
			player2Updates,
		});

		return { success: true, player1Updates, player2Updates };
	}

	cancelTrade(playerId, tradeId) {
		const trade = this.activeTrades.get(tradeId);

		if (!trade) {
			playerLog.warning('Attempted to cancel non-existent trade', { playerId, tradeId });
			return { success: false, error: 'Trade not found' };
		}
		if ((offer.credits || 0) > player.credits) return { valid: false, error: 'Insufficient credits' };

		if (trade.player1Id !== playerId && trade.player2Id !== playerId) {
			playerLog.warning('Player attempted to cancel trade they are not part of', { playerId, tradeId });
			return { success: false, error: 'You are not part of this trade' };
		}

		if (trade.status !== 'active') {
			playerLog.warning('Attempted to cancel non-active trade', { playerId, tradeId, status: trade.status });
			// Still delete it to clean up
			this.activeTrades.delete(tradeId);
			return { success: true }; // Return success to prevent errors on cleanup
		}

		playerLog.info('Trade cancelled', { playerId, tradeId });

		trade.status = 'cancelled';
		this.activeTrades.delete(tradeId);

		this.broadcast('tradeCancelled', {
			tradeId,
			cancelledBy: playerId,
			player1Id: trade.player1Id,
			player2Id: trade.player2Id,
		});

		return { success: true };
	}

	validateTradeResources(player, offer) {
		if (!offer || typeof offer !== 'object') return { valid: false, error: 'Offer required' };

		const isCount = value => Number.isInteger(value) && value >= 0;

		if (offer.credits !== undefined && !isCount(offer.credits)) {
			return { valid: false, error: 'Credits must be a whole number' };
		}

		for (const [itemName, quantity] of Object.entries(offer.items || {})) {
			if (!isCount(quantity)) return { valid: false, error: `${itemName} must be a whole number` };
			if (quantity > (player.items[itemName] || 0)) return { valid: false, error: `Insufficient ${itemName}` };
		}

		for (const [mineralName, quantity] of Object.entries(offer.minerals || {})) {
			if (!isCount(quantity)) return { valid: false, error: `${mineralName} must be a whole number` };
			if (quantity > (player.hull[mineralName] || 0)) return { valid: false, error: `Insufficient ${mineralName}` };
		}

		return visited.size;
	}

	hurtPlayers({ players, position, damage }) {
		if (position) {
			this.hurtPlayers({
				players: [...this.players.values()].flatMap(player =>
					player.position.x === position.x && player.position.y === position.y ? [player.id] : [],
				),
				damage,
			});
		} else if (players?.length > 0) {
			players.forEach(playerId =>
				this.players.update(playerId, _ => ({ ..._, health: Math.max(0, _.health - damage) })),
			);

			this.broadcast('hurtPlayers', { players: [...this.players.values()], damage });
		}
	}

	dissipateGas({ consumedPositions, ...position }) {
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const addedGas = [];
		const removedGas = [];

		consumedPositions = consumedPositions || [];

		Object.entries(surrounds).forEach(([surroundKey, { ground, hazards = [], x, y }]) => {
			const consumedPosition = consumedPositions.some(
				consumedPosition => consumedPosition.x === x && consumedPosition.y === y,
			);

			if (
				consumedPositions.length < 13 &&
				surroundKey !== 'bottom' &&
				this.world.grid[x]?.[y] &&
				!ground?.type &&
				!hazards?.some(hazard => hazard.type === 'lava' || hazard.type === 'gas') &&
				!consumedPositions.some(consumedPosition => consumedPosition.x === x && consumedPosition.y === y)
			) {
				this.world.grid[x][y].hazards = this.world.grid[x][y].hazards.filter(hazard => hazard.type !== 'alien');
				this.world.grid[x][y].hazards.push({ type: 'gas' });

				addedGas.push({ x, y, type: 'gas' });

				// Check if SpaceCo is at this position and take hazard damage
				if (
					this.world?.spaceco?.position &&
					this.world.spaceco.position.x === x &&
					this.world.spaceco.position.y === y
				) {
					this.checkSpacecoHazardDamage();
				}

				const collidedWithPlayers = [...this.players.values()].some(
					player => player.position.x === x && player.position.y === y,
				);

				if (collidedWithPlayers) {
					this.hurtPlayers({ position: { x, y }, damage: 3 });
				}
			} else if (!consumedPosition && hazards.some(hazard => hazard.type === 'gas')) {
				setTimeout(() => {
					this.dissipateGas({
						x,
						y,
						consumedPositions,
					});
				}, 500);
			}
		});

		removedGas.push(position);

		this.world.grid[position.x][position.y].hazards = this.world.grid[position.x][position.y].hazards.filter(
			hazard => hazard.type !== 'gas',
		);

		this.broadcast('dissipateGas', { addedGas, removedGas });

		if (addedGas.length > 0) {
			addedGas.forEach(gas => {
				consumedPositions.push({ x: gas.x, y: gas.y });

				setTimeout(() => {
					this.dissipateGas({ ...gas, consumedPositions });
				}, 500);
			});
		}

		this.save();
	}

	spillLava({ consumedPositions, ...position }) {
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const addedLava = [];
		const removedLava = [];

		consumedPositions = consumedPositions || [];

		Object.entries(surrounds).forEach(([surroundKey, { ground, hazards = [], x, y }]) => {
			const consumedPosition = consumedPositions.some(
				consumedPosition => consumedPosition.x === x && consumedPosition.y === y,
			);

			if (
				consumedPositions.length < 13 &&
				surroundKey !== 'top' &&
				this.world.grid[x]?.[y] &&
				!ground?.type &&
				!hazards.some(hazard => hazard.type === 'gas' || hazard.type === 'lava') &&
				!consumedPosition
			) {
				this.world.grid[x][y].hazards = this.world.grid[x][y].hazards.filter(hazard => hazard.type !== 'alien');
				this.world.grid[x][y].hazards.push({ type: 'lava' });

				addedLava.push({ x, y });

				// Check if SpaceCo is at this position and take hazard damage
				if (
					this.world?.spaceco?.position &&
					this.world.spaceco.position.x === x &&
					this.world.spaceco.position.y === y
				) {
					this.checkSpacecoHazardDamage();
				}

				const collidedWithPlayers = [...this.players.values()].some(
					player => player.position.x === x && player.position.y === y,
				);

				if (collidedWithPlayers) {
					this.hurtPlayers({ position: { x, y }, damage: 3 });
				}
			} else if (!consumedPosition && hazards.some(hazard => hazard.type === 'lava')) {
				setTimeout(() => {
					this.spillLava({ x, y, consumedPositions });
				}, 500);
			}
		});

		const contained = surrounds.left.ground?.type && surrounds.right.ground?.type && surrounds.bottom.ground?.type;

		if (!contained) {
			removedLava.push(position);

			this.world.grid[position.x][position.y].hazards = this.world.grid[position.x][position.y].hazards.filter(
				hazard => hazard.type !== 'lava',
			);
		}

		this.broadcast('spillLava', { addedLava, removedLava });

		if (addedLava.length > 0) {
			addedLava.forEach(lava => {
				consumedPositions.push({ x: lava.x, y: lava.y });

				setTimeout(() => {
					this.spillLava({ ...lava, consumedPositions });
				}, 500);
			});
		}

		this.save();
	}

	alien_wake({ name, ...position }) {
		const alienHazard = this.world.grid[position.x][position.y].hazards.find(hazard => hazard.name === name);
		if (!alienHazard) return;

		const alienConfig = aliens[name];
		if (!alienConfig) return;

		// Find triggering player
		const triggeringPlayer = this.findNearestPlayer(position);
		if (!triggeringPlayer) return;

		gameLog(2)(`Alien awakened`, {
			alienName: name,
			position,
			triggeringPlayer: triggeringPlayer.name,
			alienType: alienConfig.type,
		});

		const distanceToPlayer =
			Math.abs(triggeringPlayer.position.x - position.x) + Math.abs(triggeringPlayer.position.y - position.y);

		// Check detection range
		if (distanceToPlayer > alienConfig.behavior.detectionRange) {
			this.broadcast('alien_sleep', { name, position });
			return;
		}

		// Initialize state if needed
		this.initializeAlienState(alienHazard, alienConfig, triggeringPlayer);

		// Handle behavior-specific actions
		const actionResult = this.executeAlienBehavior(
			name,
			position,
			triggeringPlayer,
			distanceToPlayer,
			alienHazard,
			alienConfig,
		);

		// Broadcast wake event
		this.broadcast('alien_wake', {
			alien: name,
			position,
			behavior: alienConfig.behavior.type,
			triggeringPlayerId: triggeringPlayer.id,
		});

		// Schedule next action if needed
		if (actionResult.scheduleNext) {
			this.scheduleNextAction(
				name,
				actionResult.newPosition || position,
				actionResult.delay,
				actionResult.continueChance,
			);
		}
	}

	handleCuriousBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard, alienConfig) {
		const behavior = alienConfig.behavior;

		// On top of player - no damage, simply observe
		if (distanceToPlayer === 0) {
			if (chance(behavior.messageFrequency) && alienConfig.messages) {
				const message = randFromArray(alienConfig.messages);
				this.broadcast('alien_message', {
					name,
					position,
					message,
					targetPlayerId: triggeringPlayer.id,
				});
			}
			return;
		}

		// Check if alien can move
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const canMove = Object.values(surrounds).some(cell => !positionIsOccupied(cell, this.world.grid));

		if (!canMove) {
			if (chance(behavior.messageFrequency) && alienConfig.messages) {
				const message = randFromArray(alienConfig.messages);
				this.broadcast('alien_message', {
					name,
					position,
					message,
					targetPlayerId: triggeringPlayer.id,
				});
			}
			this.broadcast('alien_sleep', { name, position });
			return;
		}

		// Initialize or update curiosity state
		if (!alienHazard.curiosityState) {
			alienHazard.curiosityState = {
				targetPlayerId: triggeringPlayer.id,
				interestLevel: randInt(...behavior.interestDuration),
				lastMessageTime: 0,
			};
		}

		const curiosityState = alienHazard.curiosityState;

		// Send occasional messages
		const now = Date.now();
		if (chance(behavior.messageFrequency) && alienConfig.messages && now - curiosityState.lastMessageTime > 3000) {
			const message = randFromArray(alienConfig.messages);
			this.broadcast('alien_message', {
				name,
				position,
				message,
				targetPlayerId: triggeringPlayer.id,
			});
			curiosityState.lastMessageTime = now;
		}

		// Lose interest over time
		curiosityState.interestLevel--;
		if (curiosityState.interestLevel <= 0) {
			this.broadcast('alien_sleep', { name, position });
			return;
		}

		// Move based on movement type
		const newPosition = this.calculateMovementByType(position, triggeringPlayer.position, behavior.movement);

		if (newPosition && (newPosition.x !== position.x || newPosition.y !== position.y)) {
			this.moveAlien(name, position, newPosition, curiosityState);

			setTimeout(
				() => {
					if (chance(70)) {
						this.alien_wake({ name, ...newPosition });
					} else {
						this.broadcast('alien_sleep', { name, position: newPosition });
					}
				},
				randInt(800, 1500),
			);
		} else {
			this.broadcast('alien_sleep', { name, position });
		}
	}

	handleScaredBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard, alienConfig) {
		const behavior = alienConfig.behavior;

		// Player close - panic and try to flee instantly
		if (distanceToPlayer <= (behavior.panicThreshold || 1)) {
			if (chance(80) && alienConfig.messages) {
				const message = randFromArray(alienConfig.messages);
				this.broadcast('alien_message', {
					name,
					position,
					message,
					targetPlayerId: triggeringPlayer.id,
				});
			}

			this.attemptFleeMovement(name, position, triggeringPlayer.position, alienHazard, true, behavior);
			return;
		}

		// Initialize or update fear state
		if (!alienHazard.fearState) {
			alienHazard.fearState = {
				fleeTarget: { ...triggeringPlayer.position },
				panicLevel: distanceToPlayer <= 2 ? 5 : 3,
				lastSoundTime: 0,
			};
		}

		const fearState = alienHazard.fearState;
		fearState.fleeTarget = { ...triggeringPlayer.position };

		// Emit nervous sounds occasionally
		const now = Date.now();
		if (chance(behavior.messageFrequency) && alienConfig.messages && now - fearState.lastSoundTime > 2000) {
			const message = randFromArray(alienConfig.messages);
			this.broadcast('alien_message', {
				name,
				position,
				message,
				targetPlayerId: triggeringPlayer.id,
			});
			fearState.lastSoundTime = now;
		}

		// Attempt to flee based on flight response
		if (behavior.flightResponse === 'immediate' || (behavior.flightResponse === 'gradual' && chance(60))) {
			this.attemptFleeMovement(name, position, triggeringPlayer.position, alienHazard, false, behavior);
		} else {
			this.scheduleNextScaredCheck(name, position, randInt(1000, 2000));
		}
	}

	handleMeleeBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard, alienConfig) {
		const behavior = alienConfig.behavior;

		// Initialize or update melee state
		if (!alienHazard.meleeState) {
			alienHazard.meleeState = {
				targetPlayerId: triggeringPlayer.id,
				pursuitEnergy: randInt(...behavior.pursuitEnergy),
				exhaustionLevel: 0,
				lastAttackTime: 0,
			};
		}

		const meleeState = alienHazard.meleeState;
		const now = Date.now();

		// Check if alien is exhausted
		if (meleeState.exhaustionLevel >= 8) {
			if (chance(80)) {
				this.broadcast('alien_rest', { name, position });
				meleeState.exhaustionLevel = Math.max(0, meleeState.exhaustionLevel - 2);

				setTimeout(
					() => {
						if (chance(60)) {
							meleeState.exhaustionLevel = Math.max(0, meleeState.exhaustionLevel - 2);
							this.alien_wake({ name, ...position });
						} else {
							this.broadcast('alien_sleep', { name, position });
						}
					},
					randInt(2000, 4000),
				);
				return;
			}
		}

		// On top of player - ATTACK!
		if (distanceToPlayer === 0) {
			if (now - meleeState.lastAttackTime < behavior.attackCooldown) {
				this.broadcast('alien_menace', { name, position, targetPlayerId: triggeringPlayer.id });
				return;
			}

			this.broadcast('alien_attack', {
				name,
				position,
				damage: behavior.damage,
				targetPlayerId: triggeringPlayer.id,
			});

			this.hurtPlayers({ players: [triggeringPlayer.id], damage: behavior.damage });

			meleeState.lastAttackTime = now;
			meleeState.exhaustionLevel += 2;

			this.scheduleNextMeleeCheck(name, position, randInt(800, 1200), false);
			return;
		}

		// Handle movement based on movement type and aggression level
		const newPosition = this.calculateMovementByType(position, triggeringPlayer.position, behavior.movement);

		if (newPosition && (newPosition.x !== position.x || newPosition.y !== position.y)) {
			meleeState.pursuitEnergy--;
			meleeState.exhaustionLevel++;
			this.moveAlien(name, position, newPosition, meleeState);

			let moveSpeed;
			if (behavior.aggressionLevel === 'very_high') {
				moveSpeed = randInt(300, 600);
			} else if (behavior.aggressionLevel === 'high') {
				moveSpeed = randInt(400, 800);
			} else {
				moveSpeed = randInt(600, 1000);
			}

			this.scheduleNextMeleeCheck(name, newPosition, moveSpeed, meleeState.exhaustionLevel >= 5);
		} else {
			meleeState.exhaustionLevel += 2;
			this.scheduleNextMeleeCheck(name, position, randInt(1000, 1500), true);
		}
	}

	handleSpawnBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard, alienConfig) {
		const behavior = alienConfig.behavior;
		const spawnConfig = behavior.spawnConfig;

		// Initialize spawn state if needed
		if (!alienHazard.spawnState) {
			alienHazard.spawnState = {
				targetPlayerId: triggeringPlayer.id,
				spawnCooldown: 0,
				alertLevel: 0,
				activeSpawns: 0, // Track active spawns for spawn mothers
			};
		}

		const spawnState = alienHazard.spawnState;

		// Update target to nearest player
		const nearestPlayer = this.findNearestPlayer(position);
		if (nearestPlayer) {
			spawnState.targetPlayerId = nearestPlayer.id;
			distanceToPlayer =
				Math.abs(nearestPlayer.position.x - position.x) + Math.abs(nearestPlayer.position.y - position.y);
			triggeringPlayer = nearestPlayer;
		}

		// Reduce spawn cooldown
		if (spawnState.spawnCooldown > 0) {
			spawnState.spawnCooldown--;
		}

		// Increase alert level based on proximity and aggression level
		let alertIncrease;
		if (behavior.aggressionLevel === 'high') {
			alertIncrease = 2;
		} else if (behavior.aggressionLevel === 'medium') {
			alertIncrease = 1;
		} else {
			alertIncrease = 0.5;
		}

		if (distanceToPlayer <= 2) {
			spawnState.alertLevel = Math.min(10, spawnState.alertLevel + alertIncrease * 2);
		} else if (distanceToPlayer <= 4) {
			spawnState.alertLevel = Math.min(10, spawnState.alertLevel + alertIncrease);
		} else {
			spawnState.alertLevel = Math.max(0, spawnState.alertLevel - 1);
		}

		// Check if should attempt to spawn
		const shouldAttemptSpawn =
			spawnState.spawnCooldown === 0 &&
			spawnState.alertLevel >= 3 &&
			chance(spawnConfig.spawnChance) &&
			(!spawnConfig.maxSpawns || spawnState.activeSpawns < spawnConfig.maxSpawns);

		if (shouldAttemptSpawn) {
			this.attemptSpawn(name, position, alienConfig, spawnState);
		}

		// Handle movement
		this.handleSpawnMovement(
			name,
			position,
			triggeringPlayer,
			distanceToPlayer,
			alienHazard,
			behavior.movement,
			alienConfig,
		);
	}

	handleAmbushBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard, alienConfig) {
		const behavior = alienConfig.behavior;

		// Initialize ambush state
		if (!alienHazard.ambushState) {
			alienHazard.ambushState = {
				isRevealed: false,
				hasAttacked: false,
			};
		}

		const ambushState = alienHazard.ambushState;

		// Only trigger when player is within ambush radius
		if (distanceToPlayer <= behavior.ambushRadius) {
			if (!ambushState.isRevealed) {
				// Reveal the ambush predator
				ambushState.isRevealed = true;
				this.broadcast('alien_reveal_ambush', {
					name,
					position,
					targetPlayerId: triggeringPlayer.id,
				});
			}

			// Attack if on top of player and haven't attacked yet
			if (distanceToPlayer === 0 && !ambushState.hasAttacked) {
				let damage = behavior.damage;
				if (behavior.surpriseAttack) {
					damage = Math.floor(damage * 1.5); // 50% bonus for surprise
				}

				this.broadcast('alien_attack', {
					name,
					position,
					damage,
					targetPlayerId: triggeringPlayer.id,
					surpriseAttack: behavior.surpriseAttack,
				});

				this.hurtPlayers({ players: [triggeringPlayer.id], damage });

				ambushState.hasAttacked = true;

				// After ambush attack, become a regular melee creature
				setTimeout(
					() => {
						if (chance(70)) {
							// Convert to regular melee behavior
							alienConfig.behavior.type = 'melee';
							this.alien_wake({ name, ...position });
						} else {
							this.broadcast('alien_sleep', { name, position });
						}
					},
					randInt(500, 1000),
				);
			} else if (ambushState.isRevealed && distanceToPlayer > 0) {
				// Move toward player for attack
				const newPosition = this.calculateMovementByType(position, triggeringPlayer.position, 'approach');

				if (newPosition && (newPosition.x !== position.x || newPosition.y !== position.y)) {
					this.moveAlien(name, position, newPosition, ambushState);

					setTimeout(
						() => {
							this.alien_wake({ name, ...newPosition });
						},
						randInt(400, 800),
					);
				}
			}
		} else if (ambushState.isRevealed && distanceToPlayer > behavior.detectionRange) {
			// Player moved away, go back to sleep and reset ambush
			ambushState.isRevealed = false;
			ambushState.hasAttacked = false;
			this.broadcast('alien_sleep', { name, position });
		}
	}

	handleNeutralBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard) {
		const alienConfig = aliens[name];

		// On top of player - no damage, peacefully coexist
		if (distanceToPlayer === 0) {
			// Send neutral message with low chance (10%)
			if (chance(10) && alienConfig.messages) {
				const message = randFromArray(alienConfig.messages);
				this.broadcast('alien_message', {
					name,
					position,
					message,
					targetPlayerId: triggeringPlayer.id,
				});
			}
			// Go back to sleep instantly - neutral aliens don't care about players
			this.broadcast('alien_sleep', { name, position });
			return;
		}

		// Initialize or update neutral state
		if (!alienHazard.neutralState) {
			alienHazard.neutralState = {
				wanderMoves: randInt(1, 3), // How many moves before sleeping
				lastMessageTime: 0,
			};
		}

		const neutralState = alienHazard.neutralState;

		// Send occasional neutral messages (low chance - 5%)
		const now = Date.now();
		if (chance(5) && alienConfig.messages && now - neutralState.lastMessageTime > 5000) {
			const message = randFromArray(alienConfig.messages);
			this.broadcast('alien_message', {
				name,
				position,
				message,
				targetPlayerId: triggeringPlayer.id,
			});
			neutralState.lastMessageTime = now;
		}

		// Check if alien can move
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const canMove = Object.values(surrounds).some(cell => !positionIsOccupied(cell, this.world.grid));

		if (!canMove) {
			// Trapped, go to sleep
			this.broadcast('alien_sleep', { name, position });
			return;
		}

		// Decide whether to wander (60% chance) or go back to sleep
		if (chance(60) && neutralState.wanderMoves > 0) {
			// Wander in a random direction
			const newPosition = this.calculateRandomWanderMovement(position);

			if (newPosition && (newPosition.x !== position.x || newPosition.y !== position.y)) {
				neutralState.wanderMoves--;
				this.moveAlien(name, position, newPosition, neutralState);

				// Schedule next behavior check
				setTimeout(
					() => {
						if (neutralState.wanderMoves > 0 && chance(50)) {
							// Continue wandering
							this.alien_wake({ name, ...newPosition });
						} else {
							// Done wandering, go to sleep
							this.broadcast('alien_sleep', { name, position: newPosition });
						}
					},
					randInt(1000, 2000),
				); // Neutral aliens move slowly and deliberately
			} else {
				// Can't move in desired direction, give up and sleep
				this.broadcast('alien_sleep', { name, position });
			}
		} else {
			// Choose to sleep instead of wandering
			this.broadcast('alien_sleep', { name, position });
		}
	}

	attemptSpawn(name, position, alienConfig, spawnState) {
		const spawnConfig = alienConfig.behavior.spawnConfig;
		const spawnRadius = spawnConfig.spawnRadius || 1;

		// Find valid spawn positions within radius
		const validSpawnPositions = getSurroundingRadius(position, spawnRadius).filter(pos => {
			const cell = this.world.grid[pos.x]?.[pos.y];
			if (!cell) return false;

			switch (spawnConfig.spawnType) {
				case 'hazard':
					return !cell.ground?.type && cell.hazards.length === 0;
				case 'item':
					return !cell.ground?.type;
				case 'ground':
					return !cell.ground?.type;
				case 'alien':
					return !cell.ground?.type && cell.hazards.length === 0;
				default:
					return false;
			}
		});

		if (validSpawnPositions.length === 0) {
			spawnState.alertLevel = Math.min(10, spawnState.alertLevel + 1);
			return;
		}

		const spawnPosition = randFromArray(validSpawnPositions);

		// Determine what to spawn
		let spawnTarget;
		if (typeof spawnConfig.spawn === 'string') {
			spawnTarget = spawnConfig.spawn;
		} else if (Array.isArray(spawnConfig.spawn)) {
			spawnTarget = randFromArray(spawnConfig.spawn);
		} else if (typeof spawnConfig.spawn === 'object') {
			spawnTarget = weightedChance(spawnConfig.spawn);
		}

		// Execute spawn
		this.executeSpawn(spawnConfig.spawnType, spawnTarget, spawnPosition, name, position);

		// Set cooldown and update state
		spawnState.spawnCooldown = randInt(...spawnConfig.cooldown);
		spawnState.alertLevel = Math.max(0, spawnState.alertLevel - 2);

		if (spawnConfig.maxSpawns) {
			spawnState.activeSpawns++;
		}

		this.broadcast('alien_spawn', {
			spawnerName: name,
			spawnerPosition: position,
			spawnType: spawnConfig.spawnType,
			spawnTarget,
			spawnPosition,
		});
	}

	executeSpawn(spawnType, spawnTarget, spawnPosition) {
		const cell = this.world.grid[spawnPosition.x][spawnPosition.y];

		switch (spawnType) {
			case 'hazard':
				if (spawnTarget === 'lava') {
					cell.hazards.push({ type: 'lava' });
					// Check if SpaceCo is at this position and take hazard damage
					if (
						this.world?.spaceco?.position &&
						this.world.spaceco.position.x === spawnPosition.x &&
						this.world.spaceco.position.y === spawnPosition.y
					) {
						this.checkSpacecoHazardDamage();
					}
					// Trigger lava spreading
					setTimeout(() => this.spillLava(spawnPosition), 100);
				} else if (spawnTarget === 'gas') {
					cell.hazards.push({ type: 'gas' });
					// Check if SpaceCo is at this position and take hazard damage
					if (
						this.world?.spaceco?.position &&
						this.world.spaceco.position.x === spawnPosition.x &&
						this.world.spaceco.position.y === spawnPosition.y
					) {
						this.checkSpacecoHazardDamage();
					}
					// Trigger gas spreading
					setTimeout(() => this.dissipateGas(spawnPosition), 100);
				}
				break;

			case 'item':
				if (items[spawnTarget]) {
					cell.items.push({ name: spawnTarget });
				}
				break;

			case 'ground':
				if (minerals[spawnTarget]) {
					cell.ground = { type: spawnTarget };
				}
				break;

			case 'alien':
				if (aliens[spawnTarget]) {
					cell.hazards.push({
						type: 'alien',
						name: spawnTarget,
						orientation: 'right', // Default orientation
					});
				}
				break;
		}

		// Hurt players at spawn location for hazard types
		if (spawnType === 'hazard') {
			const playersAtLocation = [...this.players.values()].filter(
				player => player.position.x === spawnPosition.x && player.position.y === spawnPosition.y,
			);

			if (playersAtLocation.length > 0) {
				let damage;
				if (spawnTarget === 'lava') {
					damage = 5;
				} else if (spawnTarget === 'gas') {
					damage = 3;
				} else {
					damage = 2;
				}
				this.hurtPlayers({
					players: playersAtLocation.map(p => p.id),
					damage,
				});
			}
		}
	}

	handleSpawnMovement(name, position, triggeringPlayer, distanceToPlayer, alienHazard, movementType) {
		const newPosition = this.calculateMovementByType(position, triggeringPlayer.position, movementType);

		if (newPosition && (newPosition.x !== position.x || newPosition.y !== position.y)) {
			this.moveAlien(name, position, newPosition, alienHazard.spawnState);

			setTimeout(
				() => {
					if (chance(85)) {
						this.alien_wake({ name, ...newPosition });
					} else {
						this.broadcast('alien_sleep', { name, position: newPosition });
					}
				},
				randInt(800, 1500),
			);
		} else {
			setTimeout(
				() => {
					if (chance(70)) {
						this.alien_wake({ name, ...position });
					} else {
						this.broadcast('alien_sleep', { name, position });
					}
				},
				randInt(1000, 2000),
			);
		}
	}

	scheduleNextMeleeCheck(name, position, delay, isTired) {
		setTimeout(() => {
			if (isTired && chance(25)) {
				// Tired aliens have chance to fall asleep
				this.broadcast('alien_sleep', { name, position });
			} else if (chance(90)) {
				// High chance to continue being aggressive
				this.alien_wake({ name, ...position });
			} else {
				// Small chance to lose interest
				this.broadcast('alien_sleep', { name, position });
			}
		}, delay);
	}

	calculateRandomWanderMovement(currentPos) {
		const surrounds = getImmediateSurrounds(currentPos, ['left', 'right', 'bottom', 'top'], this.world.grid);

		// Get all valid moves (not occupied)
		const validMoves = [];
		for (const [, cell] of Object.entries(surrounds)) {
			if (cell && !positionIsOccupied(cell, this.world.grid)) {
				validMoves.push({ x: cell.x, y: cell.y });
			}
		}

		// Return random valid move, or null if none available
		return validMoves.length > 0 ? randFromArray(validMoves) : null;
	}

	attemptFleeMovement(name, position, threatPosition, alienHazard, isPanic) {
		// Calculate flee movement (away from threat)
		const newPosition = this.calculateAlienMovement(position, threatPosition, 'flee');

		if (newPosition && (newPosition.x !== position.x || newPosition.y !== position.y)) {
			// Successfully found escape route
			this.moveAlien(name, position, newPosition, alienHazard.fearState);

			// Schedule next behavior check (scared aliens move faster when panicking)
			const moveDelay = isPanic ? randInt(300, 600) : randInt(600, 1000);
			this.scheduleNextScaredCheck(name, newPosition, moveDelay);
		} else {
			// Trapped! Increase panic and try again soon, or cower
			if (alienHazard.fearState) {
				alienHazard.fearState.panicLevel = Math.min(10, alienHazard.fearState.panicLevel + 2);
			}

			// Send trapped/panic message
			const alienConfig = aliens[name];
			if (chance(60) && alienConfig.messages) {
				const message = randFromArray(alienConfig.messages);
				this.broadcast('alien_message', {
					name,
					position,
					message,
					targetPlayerId: this.findNearestPlayer(position)?.id,
				});
			}

			// Try again soon or give up and cower
			if (isPanic && alienHazard.fearState?.panicLevel < 8) {
				this.scheduleNextScaredCheck(name, position, randInt(400, 800));
			} else {
				// Too panicked to think clearly, or trapped - go dormant
				this.broadcast('alien_sleep', { name, position });
			}
		}
	}

	scheduleNextScaredCheck(name, position, delay) {
		setTimeout(() => {
			if (chance(85)) {
				// High chance to continue being scared
				this.alien_wake({ name, ...position });
			} else {
				// Small chance to calm down
				this.broadcast('alien_sleep', { name, position });
			}
		}, delay);
	}

	findNearestPlayer(position) {
		return [...this.players.values()].reduce((closest, player) => {
			const currentDistance = Math.abs(player.position.x - position.x) + Math.abs(player.position.y - position.y);
			const closestDistance = closest
				? Math.abs(closest.position.x - position.x) + Math.abs(closest.position.y - position.y)
				: Infinity;
			return currentDistance < closestDistance ? player : closest;
		}, null);
	}

	calculateAlienMovement(currentPos, targetPos, movementType) {
		const surrounds = getImmediateSurrounds(currentPos, ['left', 'right', 'bottom', 'top'], this.world.grid);

		const delta = {
			x: targetPos.x - currentPos.x,
			y: targetPos.y - currentPos.y,
		};

		let preferredMoves = [];

		if (movementType === 'approach') {
			// Move toward target
			if (Math.abs(delta.x) > Math.abs(delta.y)) {
				preferredMoves = [delta.x > 0 ? 'right' : 'left', delta.y > 0 ? 'bottom' : 'top'];
			} else {
				preferredMoves = [delta.y > 0 ? 'bottom' : 'top', delta.x > 0 ? 'right' : 'left'];
			}
		} else if (movementType === 'flee') {
			// Move away from target
			if (Math.abs(delta.x) > Math.abs(delta.y)) {
				preferredMoves = [delta.x > 0 ? 'left' : 'right', delta.y > 0 ? 'top' : 'bottom'];
			} else {
				preferredMoves = [delta.y > 0 ? 'top' : 'bottom', delta.x > 0 ? 'left' : 'right'];
			}
		}

		// Try preferred moves first
		for (const direction of preferredMoves) {
			const cell = surrounds[direction];
			if (cell && !positionIsOccupied(cell, this.world.grid)) {
				return { x: cell.x, y: cell.y };
			}
		}

		// Try any available move
		for (const [, cell] of Object.entries(surrounds)) {
			if (cell && !positionIsOccupied(cell, this.world.grid)) {
				return { x: cell.x, y: cell.y };
			}
		}

		return null; // Can't move
	}

	moveAlien(name, fromPos, toPos, state = null) {
		// Remove alien from old position
		this.world.grid[fromPos.x][fromPos.y].hazards = this.world.grid[fromPos.x][fromPos.y].hazards.filter(
			hazard => hazard.name !== name,
		);

		// Add alien to new position with preserved state
		const newHazard = {
			name,
			type: 'alien',
			orientation: toPos.x > fromPos.x ? 'right' : 'left',
			state, // Preserve unified state
		};

		this.world.grid[toPos.x][toPos.y].hazards.push(newHazard);

		this.broadcast('alien_move', {
			name,
			from: fromPos,
			to: toPos,
			orientation: newHazard.orientation,
		});
	}

	resolveHazard(hazardValue, context) {
		if (typeof hazardValue === 'string') {
			if (hazardTypes.includes(hazardValue)) {
				return { type: hazardValue };
			}
			if (alienNames.includes(hazardValue)) {
				return { type: 'alien', name: hazardValue };
			}
			throw new Error(
				`Invalid hazard "${hazardValue}" in ${context}. Must be hazard type (${hazardTypes.join(', ')}) or alien name`,
			);
		}

		if (Array.isArray(hazardValue)) {
			if (hazardValue.length === 0) {
				throw new Error(`Empty hazard array in ${context}`);
			}
			return this.resolveHazard(randFromArray(hazardValue), context);
		}

		if (typeof hazardValue === 'object' && hazardValue !== null) {
			// Check if it's a weighted distribution first
			if (Object.values(hazardValue).every(v => typeof v === 'number')) {
				const selectedHazard = weightedChance(hazardValue);
				return this.resolveHazard(selectedHazard, context);
			}

			// It's a hazard definition object
			const hazard = { ...hazardValue };

			// Handle mystery spawner type
			if (hazard.type === 'mystery_spawner') {
				return this.createMysterySpawner(hazard, context);
			}

			if (!hazard.type) {
				hazard.type = 'random';
			}

			if (hazard.type === 'random') {
				hazard.type = randFromArray(hazardTypes);
			}

			if (!hazardTypes.includes(hazard.type)) {
				throw new Error(
					`Invalid hazard type "${hazard.type}" in ${context}. Must be one of: ${hazardTypes.join(', ')}`,
				);
			}

			if (hazard.type === 'alien') {
				if (!hazard.name) {
					hazard.name = randFromArray(alienNames);
				} else if (hazard.name === 'random') {
					hazard.name = randFromArray(alienNames);
				} else if (hazard.alien) {
					// Traditional mystery spawner format
					hazard.name = 'mystery_spawner';
					if (Array.isArray(hazard.alien)) {
						hazard.alien = randFromArray(hazard.alien);
					} else if (typeof hazard.alien === 'object') {
						hazard.alien = weightedChance(hazard.alien);
					}
				}

				if (hazard.name === 'mystery_spawner' && hazard.alien && !alienNames.includes(hazard.alien)) {
					throw new Error(
						`Invalid alien spawn "${hazard.alien}" in ${context}. Must be one of: ${alienNames.join(', ')}`,
					);
				} else if (hazard.name !== 'mystery_spawner' && !alienNames.includes(hazard.name)) {
					throw new Error(
						`Invalid alien name "${hazard.name}" in ${context}. Must be one of: ${alienNames.join(', ')}`,
					);
				}
			}

			return hazard;
		}

		throw new Error(`Invalid hazard definition in ${context}: ${typeof hazardValue}`);
	}

		const updatedPlayer = { ...player, position, orientation, stats: { ...player.stats } };

	createMysterySpawner(hazardConfig, context) {
		if (!hazardConfig.spawnTable || !Array.isArray(hazardConfig.spawnTable)) {
			throw new Error(`Mystery spawner in ${context} must have a spawnTable array`);
		}

		// Validate spawn table
		const totalWeight = hazardConfig.spawnTable.reduce((sum, entry) => {
			if (!entry.weight || !entry.spawn) {
				throw new Error(`Invalid spawn table entry in ${context}: must have weight and spawn properties`);
			}
			return sum + entry.weight;
		}, 0);

		if (totalWeight !== 100) {
	stopMovement(playerId) {
		clearTimeout(this.movementTimeouts.get(playerId));
		this.movementTimeouts.delete(playerId);
		this.players.update(playerId, _ => ({ ..._, moving: false, _movementSessionId: null }));
	}

			throw new Error(`Mystery spawner spawn table in ${context} must sum to 100, got ${totalWeight}`);
		}

		// Validate each spawn entry
		hazardConfig.spawnTable.forEach((entry, index) => {
			const spawn = entry.spawn;
			if (!spawn.type || !spawn.name) {
				throw new Error(`Spawn entry ${index} in ${context} must have type and name properties`);
			}

			const validTypes = ['alien', 'item', 'hazard', 'ground'];
			if (!validTypes.includes(spawn.type)) {
				throw new Error(`Invalid spawn type "${spawn.type}" in ${context}. Must be one of: ${validTypes.join(', ')}`);
			}

			// Validate based on type
			switch (spawn.type) {
				case 'alien':
					if (!alienNames.includes(spawn.name)) {
						throw new Error(`Invalid alien name "${spawn.name}" in spawn entry ${index} of ${context}`);
					}
					break;
				case 'item':
					if (!itemNames.includes(spawn.name)) {
						throw new Error(`Invalid item name "${spawn.name}" in spawn entry ${index} of ${context}`);
					}
					break;
				case 'hazard':
					if (!hazardTypes.includes(spawn.name)) {
						throw new Error(`Invalid hazard type "${spawn.name}" in spawn entry ${index} of ${context}`);
					}
					break;
				case 'ground':
					if (!mineralColors.includes(spawn.name)) {
						throw new Error(`Invalid mineral type "${spawn.name}" in spawn entry ${index} of ${context}`);
					}
					break;
			}

			// Validate elite chance if present
			if (spawn.eliteChance !== undefined) {
				if (typeof spawn.eliteChance !== 'number' || spawn.eliteChance < 0 || spawn.eliteChance > 100) {
					throw new Error(`Elite chance in spawn entry ${index} of ${context} must be a number between 0-100`);
				}
			}
		});

		return {
			type: 'mystery_spawner',
			spawnTable: hazardConfig.spawnTable,
		};
	}

	initializeAlienState(alienHazard, alienConfig, triggeringPlayer) {
		const behavior = alienConfig.behavior;

		if (!alienHazard.state) {
			alienHazard.state = {
				targetPlayerId: triggeringPlayer.id,
				energy: (() => {
					if (behavior.pursuitEnergy) {
						return randInt(...behavior.pursuitEnergy);
					} else if (behavior.interestDuration) {
						return randInt(...behavior.interestDuration);
					} else {
						return 5;
					}
				})(),
				alertLevel: 0,
				exhaustion: 0,
				lastActionTime: 0,
				panicLevel: 0,
				activeSpawns: 0,
				cooldown: 0,
				isRevealed: false,
				hasAttacked: false,
			};
		}

		// Update target to current triggering player
		alienHazard.state.targetPlayerId = triggeringPlayer.id;
	}

	// Unified behavior execution
	executeAlienBehavior(name, position, triggeringPlayer, distanceToPlayer, alienHazard, alienConfig) {
		const behavior = alienConfig.behavior;
		const state = alienHazard.state;
		const now = Date.now();

		// Handle messages for communicative types
		if (behavior.messageFrequency && alienConfig.messages && this.shouldSendMessage(state, behavior, now)) {
			this.sendAlienMessage(name, position, triggeringPlayer.id, alienConfig.messages);
			state.lastActionTime = now;
		}

		switch (behavior.type) {
			case 'curious':
				return this.handleCuriousAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior);

			case 'scared':
				return this.handleScaredAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior);

			case 'neutral':
				return this.handleNeutralAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior);

			case 'melee':
				return this.handleMeleeAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior, now);

			case 'spawn':
				return this.handleSpawnAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior, alienConfig);

			case 'ambush':
				return this.handleAmbushAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior, now);

			default:
				return { scheduleNext: false };
		}
	}

	// Unified movement calculation
	calculateMovement(currentPos, targetPos, movementType, canMoveCheck = true) {
		if (canMoveCheck) {
			const surrounds = getImmediateSurrounds(currentPos, ['left', 'right', 'bottom', 'top'], this.world.grid);
			const canMove = Object.values(surrounds).some(cell => !positionIsOccupied(cell, this.world.grid));
			if (!canMove) return null;
		}

		const surrounds = getImmediateSurrounds(currentPos, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const delta = { x: targetPos.x - currentPos.x, y: targetPos.y - currentPos.y };

		let preferredMoves;

		switch (movementType) {
			case 'approach':
			case 'aggressive':
			case 'coordinated':
				if (Math.abs(delta.x) > Math.abs(delta.y)) {
					preferredMoves = [delta.x > 0 ? 'right' : 'left', delta.y > 0 ? 'bottom' : 'top'];
				} else {
					preferredMoves = [delta.y > 0 ? 'bottom' : 'top', delta.x > 0 ? 'right' : 'left'];
				}
				break;

			case 'flee':
			case 'cautious':
				if (Math.abs(delta.x) > Math.abs(delta.y)) {
					preferredMoves = [delta.x > 0 ? 'left' : 'right', delta.y > 0 ? 'top' : 'bottom'];
				} else {
					preferredMoves = [delta.y > 0 ? 'top' : 'bottom', delta.x > 0 ? 'left' : 'right'];
				}
				break;

			case 'wander':
			case 'random':
				preferredMoves = [randFromArray(['left', 'right', 'bottom', 'top'])];
				break;

			case 'territorial':
			case 'guardian':
			case 'defensive':
				// Stay close but move strategically
				if (Math.abs(delta.x) + Math.abs(delta.y) <= 2) {
					// Close enough, move to flanking position
					preferredMoves =
						Math.abs(delta.x) > Math.abs(delta.y)
							? [delta.y > 0 ? 'top' : 'bottom', delta.x > 0 ? 'right' : 'left']
							: [delta.x > 0 ? 'left' : 'right', delta.y > 0 ? 'bottom' : 'top'];
				} else {
					// Too far, approach
					preferredMoves =
						Math.abs(delta.x) > Math.abs(delta.y)
							? [delta.x > 0 ? 'right' : 'left', delta.y > 0 ? 'bottom' : 'top']
							: [delta.y > 0 ? 'bottom' : 'top', delta.x > 0 ? 'right' : 'left'];
				}
				break;

			default:
				// Default to approach behavior
	broadcastXpGain(playerId, xpGained) {
		this.broadcast('xpGain', { playerId, xpGained, totalXp: this.players.get(playerId).xp });
	}

				preferredMoves =
					Math.abs(delta.x) > Math.abs(delta.y)
						? [delta.x > 0 ? 'right' : 'left', delta.y > 0 ? 'bottom' : 'top']
						: [delta.y > 0 ? 'bottom' : 'top', delta.x > 0 ? 'right' : 'left'];
		}

		// Try preferred moves first
		for (const direction of preferredMoves) {
			const cell = surrounds[direction];
			if (cell && !positionIsOccupied(cell, this.world.grid)) {
				return { x: cell.x, y: cell.y };
			}
		}

		// Try any available move
		for (const [, cell] of Object.entries(surrounds)) {
			if (cell && !positionIsOccupied(cell, this.world.grid)) {
				return { x: cell.x, y: cell.y };
			}
		}

		return null;
	}

	// Simplified behavior handlers
	handleCuriousAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior) {
		// On top of player - observe
		if (distanceToPlayer === 0) {
			return { scheduleNext: false };
		}

		// Lose interest over time
		state.energy--;
		if (state.energy <= 0) {
			this.broadcast('alien_sleep', { name, position });
			return { scheduleNext: false };
		}

		// Try to move closer
		const newPosition = this.calculateMovement(position, triggeringPlayer.position, behavior.movement);
		if (newPosition) {
			this.moveAlien(name, position, newPosition, state);
			return {
				scheduleNext: true,
				newPosition,
				delay: randInt(800, 1500),
				continueChance: 70,
			};
		}

		return { scheduleNext: false };
	}

	handleScaredAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior) {
		// Update panic based on distance
		if (distanceToPlayer <= (behavior.panicThreshold || 1)) {
			state.panicLevel = Math.min(10, state.panicLevel + 3);
		} else if (distanceToPlayer <= 2) {
			state.panicLevel = Math.min(10, state.panicLevel + 1);
		} else {
			state.panicLevel = Math.max(0, state.panicLevel - 1);
		}

		// Try to flee
		const newPosition = this.calculateMovement(position, triggeringPlayer.position, 'flee');
		if (newPosition) {
			this.moveAlien(name, position, newPosition, state);
			const moveDelay = state.panicLevel > 5 ? randInt(300, 600) : randInt(600, 1000);
			return {
				scheduleNext: true,
				newPosition,
				delay: moveDelay,
				continueChance: 85,
			};
		}

		// Trapped - increase panic
		state.panicLevel = Math.min(10, state.panicLevel + 2);
		if (state.panicLevel >= 8) {
			this.broadcast('alien_sleep', { name, position });
			return { scheduleNext: false };
		}

		return {
			scheduleNext: true,
			delay: randInt(400, 800),
			continueChance: 70,
		};
	}

	handleNeutralAction(name, position, triggeringPlayer, distanceToPlayer, state) {
		// Neutral aliens don't care much about players
		if (distanceToPlayer === 0) {
			this.broadcast('alien_sleep', { name, position });
			return { scheduleNext: false };
		}

		// Random wandering
		if (chance(60) && state.energy > 0) {
			const newPosition = this.calculateMovement(position, triggeringPlayer.position, 'wander');
			if (newPosition) {
				state.energy--;
				this.moveAlien(name, position, newPosition, state);
				return {
					scheduleNext: true,
					newPosition,
					delay: randInt(1000, 2000),
					continueChance: state.energy > 0 ? 50 : 0,
				};
			}
		}

		this.broadcast('alien_sleep', { name, position });
		return { scheduleNext: false };
	}

	handleMeleeAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior, now) {
		// Check exhaustion
		if (state.exhaustion >= 8) {
			if (chance(80)) {
				this.broadcast('alien_rest', { name, position });
				state.exhaustion = Math.max(0, state.exhaustion - 2);
				return {
					scheduleNext: true,
					delay: randInt(2000, 4000),
					continueChance: 60,
				};
			}
		}

		// Attack if on top of player
		if (distanceToPlayer === 0) {
			if (now - state.lastActionTime < behavior.attackCooldown) {
				this.broadcast('alien_menace', { name, position, targetPlayerId: triggeringPlayer.id });
				return {
					scheduleNext: true,
					delay: randInt(500, 800),
					continueChance: 90,
				};
			}

			this.broadcast('alien_attack', {
				name,
				position,
				damage: behavior.damage,
				targetPlayerId: triggeringPlayer.id,
			});

			this.hurtPlayers({ players: [triggeringPlayer.id], damage: behavior.damage });
			state.lastActionTime = now;
			state.exhaustion += 2;

			return {
				scheduleNext: true,
				delay: randInt(800, 1200),
				continueChance: 90,
			};
		}

		// Move toward player
		const newPosition = this.calculateMovement(position, triggeringPlayer.position, behavior.movement);
		if (newPosition) {
			state.energy--;
			state.exhaustion++;
			this.moveAlien(name, position, newPosition, state);

			let moveSpeed;
			if (behavior.aggressionLevel === 'very_high') {
				moveSpeed = randInt(300, 600);
			} else if (behavior.aggressionLevel === 'high') {
				moveSpeed = randInt(400, 800);
			} else {
				moveSpeed = randInt(600, 1000);
			}

			return {
				scheduleNext: true,
				newPosition,
				delay: moveSpeed,
				continueChance: state.energy > 0 ? 90 : 50,
			};
		}

		state.exhaustion += 2;
		return {
			scheduleNext: true,
			delay: randInt(1000, 1500),
			continueChance: 80,
		};
	}

	handleSpawnAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior, alienConfig) {
		const spawnConfig = behavior.spawnConfig;

		// Update alert level
		let alertIncrease;
		if (behavior.aggressionLevel === 'high') {
			alertIncrease = 2;
		} else if (behavior.aggressionLevel === 'medium') {
			alertIncrease = 1;
		} else {
			alertIncrease = 0.5;
		}

		if (distanceToPlayer <= 2) {
			state.alertLevel = Math.min(10, state.alertLevel + alertIncrease * 2);
		} else if (distanceToPlayer <= 4) {
			state.alertLevel = Math.min(10, state.alertLevel + alertIncrease);
		} else {
			state.alertLevel = Math.max(0, state.alertLevel - 1);
		}

		// Reduce cooldown
		if (state.cooldown > 0) state.cooldown--;

		// Try to spawn
		const shouldSpawn =
			state.cooldown === 0 &&
			state.alertLevel >= 3 &&
			chance(spawnConfig.spawnChance) &&
			(!spawnConfig.maxSpawns || state.activeSpawns < spawnConfig.maxSpawns);

		if (shouldSpawn) {
			this.attemptSpawn(name, position, alienConfig, state);
		}

		// Handle movement
		const newPosition = this.calculateMovement(position, triggeringPlayer.position, behavior.movement);
		if (newPosition) {
			this.moveAlien(name, position, newPosition, state);
			return {
				scheduleNext: true,
				newPosition,
				delay: randInt(800, 1500),
				continueChance: 85,
			};
		}

		return {
			scheduleNext: true,
			delay: randInt(1000, 2000),
			continueChance: 70,
		};
	}

	handleAmbushAction(name, position, triggeringPlayer, distanceToPlayer, state, behavior) {
		// Only act within ambush radius
		if (distanceToPlayer > behavior.ambushRadius) {
			if (state.isRevealed) {
				// Reset ambush state if player moved away
				state.isRevealed = false;
				state.hasAttacked = false;
				this.broadcast('alien_sleep', { name, position });
			}
			return { scheduleNext: false };
		}

		// Reveal ambush
		if (!state.isRevealed) {
			state.isRevealed = true;
			this.broadcast('alien_reveal_ambush', {
				name,
				position,
				targetPlayerId: triggeringPlayer.id,
			});
		}

		// Attack on contact
		if (distanceToPlayer === 0 && !state.hasAttacked) {
			const damage = behavior.surpriseAttack ? Math.floor(behavior.damage * 1.5) : behavior.damage;

			this.broadcast('alien_attack', {
				name,
				position,
				damage,
				targetPlayerId: triggeringPlayer.id,
				surpriseAttack: behavior.surpriseAttack,
			});

			this.hurtPlayers({ players: [triggeringPlayer.id], damage });
			state.hasAttacked = true;

			// Convert to melee after ambush
			return {
				scheduleNext: true,
				delay: randInt(500, 1000),
				continueChance: 70,
			};
		}

		// Move toward player for attack
		const newPosition = this.calculateMovement(position, triggeringPlayer.position, 'approach');
		if (newPosition) {
			this.moveAlien(name, position, newPosition, state);
			return {
				scheduleNext: true,
				newPosition,
				delay: randInt(400, 800),
				continueChance: 90,
			};
		}

		return { scheduleNext: false };
	}

	// Unified message handling
	shouldSendMessage(state, behavior, now) {
		return chance(behavior.messageFrequency) && now - state.lastActionTime > 3000;
	}

	sendAlienMessage(name, position, targetPlayerId, messages) {
		const message = randFromArray(messages);
		this.broadcast('alien_message', {
			name,
			position,
			message,
			targetPlayerId,
		});
	}

	scheduleNextAction(name, position, delay, continueChance) {
		setTimeout(() => {
			if (chance(continueChance)) {
				this.alien_wake({ name, ...position });
			} else {
				this.broadcast('alien_sleep', { name, position });
			}
		}, delay);
	}

	spacecoFall(falling = false) {
		const { bottomLeft, bottom, bottomRight } = getImmediateSurrounds(
			this.world.spaceco.position,
			['bottomLeft', 'bottom', 'bottomRight'],
			this.world.grid,
		);

		if (!bottomLeft?.ground?.type && !bottom?.ground?.type && !bottomRight?.ground?.type) {
			const landingPosition = {
				x: bottom?.x ?? this.world.spaceco.position.x,
				y: bottom?.y ?? this.world.spaceco.position.y + 1,
			};

			this.world.spaceco.health = Math.max(0, this.world.spaceco.health - 1);
			this.world.spaceco.position = landingPosition;

			this.spacecoFall(true);
		} else if (falling) {
			// Check for hazard damage when SpaceCo lands
			this.checkSpacecoHazardDamage();

			this.broadcastWithSpacecoState(
				'spacecoFall',
				{
					position: this.world.spaceco.position,
					health: this.world.spaceco.health,
				},
				['health'],
			);
		}
	}

	checkSpacecoHazardDamage() {
		const spacecoCell = this.world.grid[this.world.spaceco.position.x]?.[this.world.spaceco.position.y];
		if (!spacecoCell) return;

		let totalDamage = 0;
		spacecoCell.hazards.forEach(hazard => {
			if (hazard.type === 'lava') {
				totalDamage += 2; // SpaceCo is more resilient than players
			} else if (hazard.type === 'gas') {
				totalDamage += 1; // Reduced gas damage for SpaceCo
			}
			// Note: alien hazards don't damage SpaceCo outposts
		});

		if (totalDamage > 0) {
			const oldHealth = this.world.spaceco.health;
			this.world.spaceco.health = Math.max(0, this.world.spaceco.health - totalDamage);

			spacecoLog.info('SpaceCo outpost took hazard damage', {
				totalDamage,
				oldHealth,
				newHealth: this.world.spaceco.health,
			});

			// Broadcast hazard damage event
			this.broadcastWithSpacecoState(
				'spacecoHazardDamage',
				{
					position: this.world.spaceco.position,
					damage: totalDamage,
					health: this.world.spaceco.health,
					hazards: spacecoCell.hazards.map(h => h.type),
				},
				['health'],
			);
		}
	}

	applyGroundMiningEffects(position, groundType, playerId) {
		// Green ground (byzanium) - can release gas when stressed
		if (groundType === 'green') {
			// 12% chance of releasing gas when mined
			if (chance(12)) {
				const cell = this.world.grid[position.x][position.y];

				// Add gas hazard at this position
				cell.hazards.push({ type: 'gas' });

				// Check if SpaceCo or players are at this position for immediate damage
				if (
					this.world?.spaceco?.position &&
					this.world.spaceco.position.x === position.x &&
					this.world.spaceco.position.y === position.y
				) {
					this.checkSpacecoHazardDamage();
				}

				// Check for player damage
				const playersAtPosition = [...this.players.values()].filter(
					player => player.position.x === position.x && player.position.y === position.y,
				);
				if (playersAtPosition.length > 0) {
					this.hurtPlayers({
						players: playersAtPosition.map(p => p.id),
						damage: 3, // Gas damage
					});
				}

				// Broadcast gas release event
				this.broadcast('groundEffect', {
					type: 'gasRelease',
					position,
					groundType,
					playerId,
				});

				// Trigger gas spreading after a short delay
				setTimeout(() => this.dissipateGas(position), 500);
			}
		}

		// Red ground (adamantite) - can explode due to density and stress
		else if (groundType === 'red') {
			// 12% chance of explosion when mined
			if (chance(12)) {
				// Broadcast explosion warning first
				this.broadcast('groundEffect', {
					type: 'explosionWarning',
					position,
					groundType,
					playerId,
				});

				// Explosion after a brief delay
				setTimeout(() => {
					// Create small explosion (radius 1)
					const explosionRadius = 1;

					this.broadcast('groundEffect', {
						type: 'explosion',
						position,
						radius: explosionRadius,
						groundType,
						playerId,
					});

					// Use existing explosion effect system
					explode({ game: this, position, radius: explosionRadius, playerId });
				}, 600); // Delay for tension buildup
			}
		}

		// Pink ground (saronite) - pulsates and may cause visions
		else if (groundType === 'pink') {
			// 3% chance of triggering psychic effect when mined
			if (chance(3)) {
				// Broadcast psychic effect event
				this.broadcast('groundEffect', {
					type: 'psychicPulse',
					position,
					groundType,
					playerId,
				});
			}
		}
	}

	checkForPlayerFalls() {
		// Check all players to see if they need to fall after ground destruction
		this.players.forEach((player, playerId) => {
			// Skip players who are dead
			if (player.health <= 0) return;

			if (!hasWheelSupport(player.position, this.world.grid, [], player.orientation).hasSupport) {
				playerLog.info('Player lost wheel support, triggering fall', { playerId });
				if (player.moving) this.stopMovement(playerId);
				this.playerFall(playerId);
			}
		});
	}

	findNearestWheelSupport(position) {
		// Search downward from the player's position to find the nearest position with wheel support
		const startY = position.y + 1; // Start searching one position below the player

		// First try directly below the player
		for (let y = startY; y < this.world.depth - 1; y++) {
			const testPos = { x: position.x, y };

			// Check if position is clear and has wheel support
			const cell = this.world.grid[testPos.x][testPos.y];
			if (!cell.ground?.type && !(cell.hazards && cell.hazards.length > 0)) {
				const wheelSupport = hasWheelSupport(testPos, this.world.grid, [], 'right');
				if (wheelSupport.hasSupport) {
					return testPos;
				}
			}
		}

		// If no direct path down, search in expanding radius
		for (let searchRadius = 1; searchRadius <= 5; searchRadius++) {
			for (let y = startY; y < this.world.depth - 1; y++) {
				for (let dx = -searchRadius; dx <= searchRadius; dx++) {
					const testPos = { x: position.x + dx, y };

					// Check bounds
					if (testPos.x < 1 || testPos.x >= this.world.width - 1) continue;

					// Check if position is clear and has wheel support
					const cell = this.world.grid[testPos.x][testPos.y];
					if (!cell.ground?.type && !(cell.hazards && cell.hazards.length > 0)) {
						const wheelSupport = hasWheelSupport(testPos, this.world.grid, [], 'right');
						if (wheelSupport.hasSupport) {
							return testPos;
						}
					}
				}
			}
		}

		// Emergency fallback - find any position with solid ground nearby
		for (let y = startY; y < this.world.depth - 1; y++) {
			for (let dx = -3; dx <= 3; dx++) {
				const testPos = { x: position.x + dx, y };

				// Check bounds
				if (testPos.x < 1 || testPos.x >= this.world.width - 1) continue;

				// Check if position is clear
				const cell = this.world.grid[testPos.x][testPos.y];
				if (!cell.ground?.type && !(cell.hazards && cell.hazards.length > 0)) {
					// Check if there's solid ground directly below
					const belowY = y + 1;
					if (belowY < this.world.depth) {
						const belowCell = this.world.grid[testPos.x][belowY];
						if (belowCell.ground?.type) {
							playerLog.debug('Emergency landing position found', { position: testPos });
							return testPos;
						}
					}
				}
			}
		}

		// Final fallback - bottom of the world with created platform
		const emergencyPos = { x: position.x, y: this.world.depth - 2 };

		// Ensure there's ground at the bottom
		if (!this.world.grid[emergencyPos.x][this.world.depth - 1].ground?.type) {
			this.world.grid[emergencyPos.x][this.world.depth - 1].ground = { type: 'white' };
			gameLog.info('Created emergency platform for falling player');
		}

		return emergencyPos;
	}

	playerFall(playerId, falling = false) {
		const player = this.players.get(playerId);

		const supportCheck = hasWheelSupport(player.position, this.world.grid, [], player.orientation);
		const playerShouldFall = !supportCheck.hasSupport;

		if (playerShouldFall) {
			// Find the nearest supported position below the player
			const landingPosition = this.findNearestWheelSupport(player.position);
			const fallDistance = landingPosition.y - player.position.y;
			const fallDamage = Math.max(0, (fallDistance - 1) * 2); // 2 damage per block fallen (after first block)

			playerLog.info('Player falling', {
				playerId,
				fromPosition: player.position,
				toPosition: landingPosition,
				fallDistance,
				fallDamage,
			});

			const updates = {
				position: landingPosition,
				health: Math.max(0, player.health - fallDamage),
			};

			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('playerFall', { playerId, updates, fallDistance });

			// Check if player landed near lava and trigger spilling
			const landingCell = this.world.grid[landingPosition.x]?.[landingPosition.y];
			if (landingCell?.hazards?.some(h => h.type === 'lava')) {
				this.spillLava(landingPosition);
			}
		} else if (falling) {
			this.broadcast('playerFall', { playerId, updates: { position: player.position, health: player.health } });
		}
	}

	processEnvironmentalEffects(position, surrounds) {
		// Handle gas disturbance
		const disturbedGas = [
			...this.world.grid[position.x][position.y].hazards.map(hazard => ({ ...hazard, ...position })),
			...(surrounds.left.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.left) })),
			...(surrounds.right.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.right) })),
			...(surrounds.bottom.hazards || []).map(hazard => ({
				...hazard,
				...(({ x, y }) => ({ x, y }))(surrounds.bottom),
			})),
		].filter(hazard => hazard.type === 'gas');

		if (disturbedGas.length > 0) {
			disturbedGas.forEach(({ x, y }) => {
				this.dissipateGas({ x, y });
			});
		}

		// Handle lava disturbance
		const disturbedLava = [
			...this.world.grid[position.x][position.y].hazards.map(hazard => ({ ...hazard, ...position })),
			...(surrounds.left.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.left) })),
			...(surrounds.right.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.right) })),
			...(surrounds.top.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.top) })),
		].filter(hazard => hazard.type === 'lava');

		if (disturbedLava.length > 0) {
			disturbedLava.forEach(({ x, y }) => {
				this.spillLava({ x, y });
			});
		}

		// Handle alien disturbance
		const disturbedAliens = getSurroundingRadius(position, 3, this.world.grid).flatMap(({ x, y, hazards }) =>
			(hazards || []).filter(hazard => hazard.type === 'alien').map(hazard => ({ ...hazard, x, y })),
		);

		if (disturbedAliens.length > 0) {
			disturbedAliens.forEach(({ x, y, name }) => {
				this.alien_wake({ x, y, name });
			});
		}

		// Handle SpaceCo proximity and falling
		const isNearSpaceco = getSurroundingRadius(position, 2).some(
			position => this.world.spaceco.position.x === position.x && this.world.spaceco.position.y === position.y,
		);

		if (isNearSpaceco) {
			this.spacecoFall();
			// Also check for hazards when SpaceCo position is affected
			this.checkSpacecoHazardDamage();
		}
	}

	movePlayerStep(playerId, position) {
		const cell = getGridCell(this.world.grid, position.x, position.y);
		if (!cell) {
			throw new Error(`Invalid grid position: ${position.x}, ${position.y}`);
		}

		const player = this.players.get(playerId);
		if (!player) {
			throw new Error(`Player ${playerId} not found`);
		}

		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const orientation = calculateDrillOrientation(player.position, position, this.world.grid, player);
		const fuelConsumption = stepFuelCost(player, cell);

		if (fuelConsumption > player.fuel) {
			this.players.update(playerId, _ => ({
				..._,
				stats: { ..._.stats, outOfFuelEvents: _.stats.outOfFuelEvents + 1 },
			}));
			this.stopMovement(playerId);
			this.broadcast('playerCantMove', { playerId, player: this.players.get(playerId) });
			return;
		}

		if (this.world.grid[position.x][position.y].ground?.type) {
			const { type } = this.world.grid[position.x][position.y].ground;

			updatedPlayer.hull[type] = updatedPlayer.hull[type] || 0;
			++updatedPlayer.hull[type];

			++updatedPlayer.stats.tilesDug;
			updatedPlayer.stats.oreTypesCollected[type] = true;
		}

		++updatedPlayer.stats.tilesMoved;
		updatedPlayer.stats.totalConsumedFuel += fuelConsumption;
		updatedPlayer.stats.deepestDepthReached = Math.max(updatedPlayer.stats.deepestDepthReached, position.y);
		updatedPlayer.fuel = Math.max(0, updatedPlayer.fuel - fuelConsumption);

		const ground = { ...this.world.grid[position.x][position.y] };

		this.world.grid[position.x][position.y].items.forEach(({ name, placed }) => {
			if (placed) return;
			if (name.startsWith('mineral')) {
				updatedPlayer.hull[name] = updatedPlayer.hull[name] || 0;
				++updatedPlayer.hull[name];
			} else {
				updatedPlayer.items[name] = updatedPlayer.items[name] || 0;
				++updatedPlayer.items[name];
			}
		});

		this.players.set(playerId, updatedPlayer);

		let damage = 0;
		if (this.world.grid[position.x][position.y]) {
			const cell = this.world.grid[position.x][position.y];

			// Apply mineral-specific effects before clearing ground
			if (cell.ground?.type) {
				this.applyGroundMiningEffects(position, cell.ground.type, playerId);
			}

			cell.ground = {};
			cell.items = cell.items.filter(item => item.placed);

			cell.hazards.forEach(hazard => {
				if (hazard.type === 'lava') damage += 10;
				else if (hazard.type === 'gas') damage += 5;
				else if (hazard.type === 'alien') damage += 3;
			});
		}

		this.broadcast('playerMove', { player: this.players.get(playerId), ground });

		// Check for player falls after ground destruction from mining
		this.checkForPlayerFalls();

		this.updatePlayerCargo(playerId);

		if (damage) {
			this.hurtPlayers({ players: [playerId], damage });

			const damagedPlayer = this.players.get(playerId);
			if (damagedPlayer.health <= 0) {
				this.stopMovement(playerId);

				this.broadcast('playerMovementInterrupted', {
					playerId,
					reason: 'no_health',
					finalPosition: damagedPlayer.position,
					player: damagedPlayer, // Include full player state
				});

				return; // Stop movement execution
			}
		}

		this.processEnvironmentalEffects(position, surrounds);
	}

	movePlayer(playerId, path) {
		const player = this.players.get(playerId);

		if (!player) {
			playerLog.warning('Player not found during movement', { playerId });
			return;
		}

		gameLog.debug('Player movement started', { playerId, pathLength: path.length, startPosition: player.position });

		const validation = validateMovementPath({
			player,
			path,
			grid: this.world.grid,
			maxPathLength: 30,
		});

		if (!validation.valid) {
			gameLog.warning('Invalid movement path', {
				playerId,
				reason: validation.reason,
				playerPosition: player.position,
				playerOrientation: player.orientation,
				attemptedPath: path,
				debugInfo: validation.debug,
			});

			this.stopMovement(playerId);

			this.broadcast('invalidMovement', {
				playerId,
				reason: validation.reason,
				validPath: validation.validPath,
			});
			return;
		}

		// A path is a session: a timer from an earlier path that fires late finds a different id and stops
		const movementSessionId = Date.now() + Math.random();
		this.players.update(playerId, _ => ({ ..._, moving: true, _movementSessionId: movementSessionId }));

		// Use the validated path and process steps with error handling
		this.processMovementStep(playerId, validation.validPath, 0, movementSessionId);
	}

	processMovementStep(playerId, path, stepIndex, movementSessionId) {
		gameLog.debug('Processing movement step', {
			playerId,
			stepIndex,
			pathLength: path.length,
			sessionId: movementSessionId,
		});
		const player = this.players.get(playerId);

		if (!player || player._movementSessionId !== movementSessionId) return;

		if (stepIndex >= path.length) {
			this.stopMovement(playerId);

			this.broadcast('playerMovementComplete', {
				playerId,
				finalPosition: player.position,
				player: player, // Include full player state with updated cargo
			});

			this.save();
			return;
		}

		const nextCell = getGridCell(this.world.grid, path[stepIndex].x, path[stepIndex].y);

		if (player.health <= 0 || stepFuelCost(player, nextCell) > player.fuel) {
			this.stopMovement(playerId);

			const stopped = this.players.get(playerId);

			this.broadcast('playerMovementInterrupted', {
				playerId,
				reason: player.health <= 0 ? 'no_health' : 'no_fuel',
				finalPosition: player.position,
				player: player, // Include full player state
			});

			if (player.health > 0) this.broadcast('playerCantMove', { playerId, player: stopped });

			this.save();
			return;
		}

		try {
			this.movePlayerStep(playerId, path[stepIndex]);

			if (this.players.get(playerId)?._movementSessionId !== movementSessionId) return;

			this.movementTimeouts.set(
				playerId,
				setTimeout(() => this.processMovementStep(playerId, path, stepIndex + 1, movementSessionId), 500),
			);
		} catch (error) {
			playerLog.error(`Player movement error`, { playerId, stepIndex, error: error.message, stack: error.stack });

			this.stopMovement(playerId);

			const stopped = this.players.get(playerId);

			this.broadcast('playerMovementError', {
				playerId,
				error: error.message,
				stepIndex,
				finalPosition: player.position,
				player: player, // Include full player state
			});

			this.save();
		}
	}

	/**
	 * Override framework method to provide SpaceCo state data
	 * @param {Array<string>} additionalFields - Extra SpaceCo fields to include
	 * @returns {object} SpaceCo state object
	 */
	createGameStateData(additionalFields = []) {
		const baseState = {
			xp: this.world.spaceco.xp,
			stats: this.world.spaceco.stats,
		};

		// Add extra fields as requested
		additionalFields.forEach(field => {
			if (this.world.spaceco[field] !== undefined) {
				baseState[field] = this.world.spaceco[field];
			}
		});

		return baseState;
	}

	/**
	 * Add SpaceCo experience and broadcast the change for achievements
	 * @param {number} amount - XP to add
	 */
	addSpacecoXp(amount) {
		this.world.spaceco.xp += amount;
		this.broadcast('spacecoXp', { xpGained: amount, totalXp: this.world.spaceco.xp });
	}

	broadcastWithSpacecoState(event, data, spacecoFields = []) {
		this.broadcastWithGameState(event, data, spacecoFields, 'spaceco');
	}

	disarmBomb(playerId, position) {
		const player = this.players.get(playerId);
		if (!player) return { success: false, error: 'Player not found' };

		const { x, y } = position;
		const cell = this.world.grid[x]?.[y];
		if (!cell) return { success: false, error: 'No such position' };

		const bombIndex = cell.items.findIndex(item => item.name === 'remote_charge' || item.name === 'void_implosion');
		if (bombIndex === -1) return { success: false, error: 'No charge at that position' };

		const bombType = cell.items[bombIndex].name;

		// Remove the bomb from the cell
		cell.items.splice(bombIndex, 1);

		// Remove appropriate detonator from ALL players who have it
		const detonatorKey = bombType === 'void_implosion' ? `void_detonator_${x}_${y}` : `detonator_${x}_${y}`;
		this.players.forEach((playerData, playerIdIter) => {
			if (playerData.items[detonatorKey]) {
				const updates = { items: { ...playerData.items, [detonatorKey]: playerData.items[detonatorKey] - 1 } };
				if (updates.items[detonatorKey] <= 0) {
					delete updates.items[detonatorKey];
				}
				this.players.update(playerIdIter, _ => ({ ..._, ...updates }));

				// Broadcast the inventory update to the affected player
				this.broadcast('useItem', {
					playerId: playerIdIter,
					updates: updates,
					item: 'remove_detonator',
				});
			}
		});

		playerLog.info('Bomb disarmed successfully', { playerId, position });

		// Broadcast the bomb removal
		this.broadcast('useItem', {
			playerId,
			updates: { items: player.items },
			item: 'disarm_bomb',
			bombPosition: position,
		});

		return { success: true };
	}

	deactivateTeleporter(playerId, position) {
		const player = this.players.get(playerId);
		if (!player) return { success: false, error: 'Player not found' };

		const { x, y } = position;
		const cell = this.world.grid[x]?.[y];
		if (!cell) return { success: false, error: 'No such position' };

		const teleporterIndex = cell.items.findIndex(item => item.name === 'teleport_station');
		if (teleporterIndex === -1) return { success: false, error: 'No beacon at that position' };

		// Remove the teleporter from the cell
		cell.items.splice(teleporterIndex, 1);

		// Remove activated teleporter from ALL players who have it
		const teleporterKey = `activated_teleporter_${x}_${y}`;
		this.players.forEach((playerData, playerIdIter) => {
			if (playerData.items[teleporterKey]) {
				const updates = { items: { ...playerData.items, [teleporterKey]: playerData.items[teleporterKey] - 1 } };
				if (updates.items[teleporterKey] <= 0) {
					delete updates.items[teleporterKey];
				}
				this.players.update(playerIdIter, _ => ({ ..._, ...updates }));

				// Broadcast the inventory update to the affected player
				this.broadcast('useItem', {
					playerId: playerIdIter,
					updates: updates,
					item: 'remove_teleporter',
				});
			}
		});

		playerLog.info('Teleporter deactivated successfully', { playerId, position });

		// Broadcast the teleporter removal
		this.broadcast('useItem', {
			playerId,
			updates: { items: player.items },
			item: 'deactivate_teleporter',
			stationPosition: position,
		});

		return { success: true };
	}
}
