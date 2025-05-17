import { debounce } from 'vanilla-bean-components/utils';

import {
	simpleId,
	chance,
	randFromArray,
	randInt,
	weightedChance,
	getSurroundingRadius,
	getImmediateSurrounds,
	hasFooting,
	shuffleArray,
} from '../utils';
import worlds from '../worlds';
import gamesDatabase from './database/games';
import { url, socketBroadcast } from './server';

const WORLDS = {
	...Object.fromEntries(worlds.map(world => [world.name, world])),
};

const mineralColors = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];
const mineralNames = {
	white: 'tritanium',
	orange: 'duranium',
	yellow: 'pentrilium',
	green: 'byzanium',
	teal: 'etherium',
	blue: 'mithril',
	purple: 'octanium',
	pink: 'saronite',
	red: 'adamantite',
	black: 'quadium',
};
const groundEffects = {
	white: ['bonus:~:2:~:white:~:[1,2]'],
	orange: ['bonus:~:2:~:orange:~:[1,2]'],
	yellow: ['bonus:~:2:~:yellow:~:[1,2]'],
	green: ['poisonous_gas:~:12'],
	teal: ['teleporting:~:5'],
	blue: ['freezing:~:15'],
	purple: ['noxious_gas:~:12'],
	pink: ['bonus:~:10:~:pink:~:1', 'exploding:~:10'],
	red: ['bonus:~:2:~:red:~:[1,2]', 'lava:~:35', 'exploding:~:5'],
	black: ['impenetrable'],
};
const densities = {
	white: 400,
	orange: 500,
	yellow: 560,
	green: 620,
	teal: 700,
	blue: 740,
	purple: 760,
	pink: 780,
	red: 800,
	black: 900,
};
const items = {
	oil: { price: 20, description: 'A portable gas can' },
	battery: { price: 30, description: 'A replacement energy cell' },
	super_oxygen_liquid_nitrogen: { price: 50, description: 'A portable SOLN fuel cell' },
	teleporter: { price: 7, description: 'Teleport back to spaceco' },
	responder_teleporter: { price: 9, description: 'Place a responder, then teleport back to it later' },
	repair_nanites: { price: 30, description: 'Repair yourself on the go' },
	timed_charge: { price: 13, description: '3s delay 3 radius explosive charge' },
	remote_charge: { price: 22, description: '5 radius explosive charge with a remote detonator' },
};
const itemNames = Object.keys(items);

const vehicles = {
	TY37: { price: 30, spriteIndex: 0, tracks: true, maxHealth: 5, maxFuel: 5, maxCargo: 20 },
	T2B20: { price: 25, spriteIndex: 1, tracks: true, maxHealth: 15, maxFuel: 5, maxCargo: 5 },
	WB70: { price: 40, spriteIndex: 2, wheels: true, maxHealth: 20, maxFuel: 10, maxCargo: 10 },
	TB74: { price: 35, spriteIndex: 3, tracks: true, maxHealth: 20, maxFuel: 10, maxCargo: 5 },
	WB20: { price: 35, spriteIndex: 4, wheels: true, maxHealth: 10, maxFuel: 20, maxCargo: 5 },
	WY37: { price: 35, spriteIndex: 5, wheels: true, maxHealth: 5, maxFuel: 15, maxCargo: 15 },
	TO24: { price: 60, spriteIndex: 6, tracks: true, maxHealth: 20, maxFuel: 20, maxCargo: 20 },
	T2O24: { price: 30, spriteIndex: 7, tracks: true, maxHealth: 15, maxFuel: 10, maxCargo: 5 },
	WY37C: { price: 40, spriteIndex: 8, wheels: true, maxHealth: 10, maxFuel: 10, maxCargo: 20 },
	WB20F: { price: 40, spriteIndex: 9, wheels: true, maxHealth: 10, maxFuel: 20, maxCargo: 10 },
	T2Y37: { price: 50, spriteIndex: 10, tracks: true, maxHealth: 20, maxFuel: 10, maxCargo: 20 },
	WO24: { price: 30, spriteIndex: 11, wheels: true, maxHealth: 10, maxFuel: 10, maxCargo: 10 },
	TB20: { price: 35, spriteIndex: 12, tracks: true, maxHealth: 10, maxFuel: 10, maxCargo: 15 },
	TY37X: { price: 45, spriteIndex: 13, tracks: true, maxHealth: 15, maxFuel: 15, maxCargo: 15 },
};
const vehicleNames = Object.keys(vehicles);

const drills = {
	QTD5: { price: 20, spriteIndex: 0, maxHealth: 20, maxFuel: 0 },
	T2Q5: { price: 17, spriteIndex: 1, maxHealth: 11, maxFuel: 6 },
	M3: { price: 14, spriteIndex: 2, maxHealth: 7, maxFuel: 7 },
	DT2: { price: 9, spriteIndex: 3, maxHealth: 5, maxFuel: 4 },
	PD2: { price: 11, spriteIndex: 4, maxHealth: 5, maxFuel: 6 },
	P2: { price: 14, spriteIndex: 5, maxHealth: 4, maxFuel: 10 },
	EP4: { price: 15, spriteIndex: 6, maxHealth: 5, maxFuel: 10 },
	T2E1: { price: 13, spriteIndex: 7, maxHealth: 6, maxFuel: 7 },
	E4: { price: 8, spriteIndex: 8, maxHealth: 5, maxFuel: 3 },
	EQ1: { price: 20, spriteIndex: 9, maxHealth: 10, maxFuel: 10 },
	T2: { price: 14, spriteIndex: 10, maxHealth: 6, maxFuel: 8 },
	T2M2: { price: 16, spriteIndex: 11, maxHealth: 9, maxFuel: 7 },
	D3: { price: 12, spriteIndex: 12, maxHealth: 6, maxFuel: 6 },
};
const drillNames = Object.keys(drills);

const engines = {
	OTMD: { price: 20, spriteIndex: 0, fuelType: 'oil', maxHealth: 6, maxFuel: 10, fuelEfficiency: 4 },
	OTMDE: { price: 17, spriteIndex: 1, fuelType: 'oil', maxHealth: 4, maxFuel: 15, fuelEfficiency: 3 },
	OQTDME: { price: 14, spriteIndex: 2, fuelType: 'oil', maxHealth: 20, maxFuel: 5, fuelEfficiency: 2 },
	ODETP: { price: 9, spriteIndex: 3, fuelType: 'oil', maxHealth: 12, maxFuel: 5, fuelEfficiency: 2 },
	BTDE: { price: 11, spriteIndex: 4, fuelType: 'battery', maxHealth: 8, maxFuel: 5, fuelEfficiency: 4 },
	BTDMP: { price: 14, spriteIndex: 5, fuelType: 'battery', maxHealth: 5, maxFuel: 5, fuelEfficiency: 5 },
	BBDPE: { price: 15, spriteIndex: 6, fuelType: 'battery', maxHealth: 10, maxFuel: 10, fuelEfficiency: 5 },
	BQEDPT: { price: 13, spriteIndex: 7, fuelType: 'battery', maxHealth: 20, maxFuel: 10, fuelEfficiency: 4 },
	SSODQMTB: { price: 8, spriteIndex: 8, fuelType: 'super_oxygen_liquid_nitrogen', maxHealth: 15, maxFuel: 5, fuelEfficiency: 4 },
	SBQODTM: { price: 20, spriteIndex: 9, fuelType: 'super_oxygen_liquid_nitrogen', maxHealth: 15, maxFuel: 10, fuelEfficiency: 6 },
	STQED: { price: 14, spriteIndex: 10, fuelType: 'super_oxygen_liquid_nitrogen', maxHealth: 10, maxFuel: 10, fuelEfficiency: 5 },
	SEQ: { price: 16, spriteIndex: 11, fuelType: 'super_oxygen_liquid_nitrogen', maxHealth: 20, maxFuel: 10, fuelEfficiency: 5 },
};
const engineNames = Object.keys(engines);

export const games = {};

class Players extends Map {
	constructor() {
		super();
	}

	update(playerId, updater = current => current) {
		this.set(playerId, updater(this.get(playerId)));
	}
}

export default class Game {
	constructor({ saveState = {}, ...options }) {
		this.id = saveState.id || simpleId();
		this.name = saveState.name || options.name || simpleId();
		this.options = saveState.options || options;
		this.world = saveState.world || this.generateWorld(WORLDS[options.worldName] || options);

		this.url = url;
		this.players = new Players();

		this.save = debounce(() => gamesDatabase.set({ id: this.id, game: this.toSaveState() }), 5000);

		if (saveState.players) saveState.players.map(player => this.players.set(player.id, player));

		gamesDatabase.create(this.toSaveState());
	}

	toClient() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,

			url,
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

	broadcast(key, data) {
		socketBroadcast({ id: this.id, update: key, ...data });

		this.save();
	}

	addPlayer(name) {
		const id = simpleId();
		this.players.set(id, {
			id,
			name,
			position: { x: randInt(1, this.world.width - 1), y: this.world.airGap },
			orientation: 'right',
			configuration: {
				vehicle: randFromArray(vehicleNames),
				drill: randFromArray(drillNames),
				engine: randFromArray(engineNames),
			},
			items: {},
			hull: {},
			cargo: 0,
			health: 0,
			fuel: 0,
			credits: 1000,
		});

		this.updatePlayerConfiguration(id);

		this.players.update(id, _ => ({
			..._,
			health: _.maxHealth,
			fuel: _.maxFuel,
			credits: _.credits - vehicles[_.configuration.vehicle].price - drills[_.configuration.drill].price,
		}));

		const newPlayer = this.players.get(id);

		this.broadcast('addPlayer', { newPlayer });

		return newPlayer;
	}

	updatePlayerConfiguration(id, configuration) {
		if (configuration) this.players.update(id, _ => ({ ..._, configuration }));

		const player = this.players.get(id);
		const vehicleConfig = vehicles[player.configuration.vehicle];
		const drillConfig = drills[player.configuration.drill];

		let maxHealth = 30;
		let maxFuel = 30;
		let maxCargo = 30;

		if (vehicleConfig.maxHealth) maxHealth += vehicleConfig.maxHealth;
		if (vehicleConfig.maxFuel) maxFuel += vehicleConfig.maxFuel;
		if (vehicleConfig.maxCargo) maxCargo += vehicleConfig.maxCargo;
		if (drillConfig.maxHealth) maxHealth += drillConfig.maxHealth;
		if (drillConfig.maxFuel) maxFuel += drillConfig.maxFuel;
		if (drillConfig.maxCargo) maxCargo += drillConfig.maxCargo;

		this.players.update(id, _ => ({ ..._, maxHealth, maxFuel, maxCargo }));
	}

	updatePlayerCargo(id) {
		const player = this.players.get(id);
		let cargo = 0;

		Object.entries(player.hull).forEach(([key, value]) => {
			if (key.startsWith('mineral')) cargo += (densities[key.replace('mineral_', '')] / 2000) * value;
			else cargo += (densities[key] / 1000) * value;
		});

		this.players.update(id, _ => ({ ..._, cargo: Math.min(cargo, player.maxCargo) }));
	}

	spacecoSell(playerId) {
		const player = this.players.get(playerId);
		let gain = 0;

		Object.entries(player.hull).forEach(([key, count]) => {
			if (key.startsWith('mineral')) {
				gain +=
					Math.max(0.01, densities[key.replace('mineral_', '')] / (500 + (this.world.spaceco.hull?.[key] || 0))) *
					count;
			} else gain += Math.max(0.01, densities[key] / (1000 + (this.world.spaceco.hull?.[key] || 0))) * count;

			this.world.spaceco.hull[key] = this.world.spaceco.hull?.[key] || 0;
			this.world.spaceco.hull[key] += count;
		});

		const updates = { credits: player.credits + gain, hull: {} };

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		this.updatePlayerCargo(playerId);

		this.broadcast('spacecoSell', {
			playerId,
			updates: { ...updates, cargo: this.players.get(playerId).cargo },
			gain,
			spacecoHull: this.world.spaceco.hull,
		});
	}

	spacecoRefuel(playerId, amount) {
		const player = this.players.get(playerId);
		const engineConfig = engines[player.configuration.engine];
		const pricePerLiter = { oil: 0.9, battery: 1.3, super_oxygen_liquid_nitrogen: 1.7 }[engineConfig.fuelType];
		const purchasedFuel = amount ? amount / pricePerLiter : player.maxFuel - player.fuel;
		const cost = purchasedFuel * pricePerLiter;

		const updates = { fuel: purchasedFuel, credits: player.credits - cost };

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		this.broadcast('spacecoRefuel', { playerId, updates, purchasedFuel, cost });
	}

	spacecoRepair(playerId, amount, type = 'player') {
		const player = this.players.get(playerId);

		if (type === 'player') {
			const pricePerHealth = 1.3;
			const purchasedRepairs = amount ? amount / pricePerHealth : player.maxHealth - player.health;
			const cost = purchasedRepairs * pricePerHealth;

			const updates = { health: purchasedRepairs, credits: player.credits - cost };

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.broadcast('spacecoRepair', { playerId, updates, purchasedRepairs, cost });
		} else if (type === 'outpost') {
			const purchasedRepairs = 9 - this.world.spaceco.health;
			const cost = purchasedRepairs * 10;

			this.world.spaceco.health = 9;

			const updates = { credits: player.credits - cost };

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.broadcast('spacecoRepair', { playerId, updates, purchasedRepairs, cost, type });
		}
	}

	spacecoBuyItem(playerId, item, count = 1) {
		if (!this.world.spaceco.items[item].stock) return;

		const player = this.players.get(playerId);
		const cost = 10;

		const updates = { items: { ...player.items }, credits: player.credits - cost };
		updates.items[item] = updates.items[item] || 0;
		updates.items[item] += count;

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		this.world.spaceco.items[item].stock -= count;

		this.broadcast('spacecoBuyItem', {
			playerId,
			updates,
			item,
			count,
			cost,
			spacecoUpdates: { items: this.world.spaceco.items },
		});
	}

	spacecoBuyUpgrade(playerId, upgrade, type) {
		const player = this.players.get(playerId);
		const upgradeConfig = this.world.spaceco[type][upgrade];

		if (!upgradeConfig) return;

		const updates = {
			configuration: { ...player.configuration, [type.replace(/s$/, '')]: upgrade },
			credits: player.credits - upgradeConfig.price,
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		delete this.world.spaceco[type][upgrade];

		this.broadcast('spacecoBuyUpgrade', {
			playerId,
			updates,
			upgrade,
			type,
			cost: upgradeConfig.price,
			spacecoUpdates: { [type]: this.world.spaceco[type] },
		});
	}

	spacecoBuyTransport(playerId) {
		const player = this.players.get(playerId);
		const price = 100;

		const updates = {
			credits: player.credits - price,
		};

		this.players.update(playerId, _ => ({ ..._, ...updates }));

		this.world = this.generateWorld(WORLDS[randFromArray(Object.keys(WORLDS))]);

		this.broadcast('spacecoBuyTransport', {
			playerId,
			updates,
			cost: price,
		});
	}

	useItem(playerId, item) {
		const player = this.players.get(playerId);

		const updates = {
			items: { ...player.items, [item]: (player.items[item] -= 1) },
		};

		if (item === 'teleporter') {
			updates.position = { ...this.world.spaceco.position };
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item });
		} else if (item === 'repair_nanites') {
			updates.health = player.maxHealth;
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item });
		} else if (item === 'timed_charge') {
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			const bombPosition = { ...player.position };
			const radius = 3;

			// TODO update player & update world to show bomb
			// this.broadcast('useItem', { playerId, updates, item, position: bombPosition });

			setTimeout(() => {
				const playersToFall = [];

				getSurroundingRadius(bombPosition, radius).forEach(({ x, y }) => {
					if (this.world.grid[x]?.[y]) this.world.grid[x][y] = { ground: {}, items: [], hazards: [] };

					if (this.world.spaceco.position.x === x && this.world.spaceco.position.y === y) {
						this.world.spaceco.health = Math.max(0, this.world.spaceco.health - 1);
					}

					this.players.forEach(player => {
						if (player.position.x === x && player.position.y === y) playersToFall.push(player.id);
					});
				});

				this.broadcast('explodeBomb', { playerId, item, radius, position: bombPosition });

				this.spacecoFall();

				playersToFall.forEach(playerId => this.playerFall(playerId));
			}, 3000);
		} else {
			this.players.update(playerId, _ => ({ ..._, ...updates }));
			this.broadcast('useItem', { playerId, updates, item });
		}
	}

	removePlayer(id) {
		this.players.delete(id);

		this.broadcast('removePlayer', { id });

		return id;
	}

	generatePart() {
		const part = {
			name: simpleId(),
			price: 10,
			spritesheet: 'img/items.png',
			spriteIndex: randInt(0, 47),
			maxHealth: 0,
			maxFuel: 0,
			maxCargo: 0,
		};

		part.type = randFromArray(['tracks', 'wheels', 'hull', 'fuelTank']);

		if (part.type === 'tracks') {
			part.tracks = true;
			part.subType = weightedChance({ boosted: 70, hardened: 20, antigravidic: 10 });

			if (part.subType === 'boosted') {
				part.maxFuel += 10;
			} else if (part.subType === 'hardened') {
				part.maxHealth += 10;
			} else if (part.subType === 'antigravidic') {
				part.maxFuel += 15;
			}
		} else if (part.type === 'wheels') {
			part.wheels = true;
			part.subType = weightedChance({ boosted: 40, hardened: 60 });

			if (part.subType === 'boosted') {
				part.maxFuel += 10;
			} else if (part.subType === 'hardened') {
				part.maxHealth += 10;
			}
		} else if (part.type === 'hull') {
			part.wheels = true;
			part.subType = weightedChance({ enhanced: 70, reinforced: 30 });

			if (part.subType === 'enhanced') {
				part.maxFuel += 10;
			} else if (part.subType === 'reinforced') {
				part.maxHealth += 20;
			}
		} else if (part.type === 'fuelTank') {
			part.wheels = true;
			part.subType = weightedChance({ large: 30, bulky: 50, pressurized: 20 });

			if (part.subType === 'large') {
				part.maxFuel += 10;
			} else if (part.subType === 'bulky') {
				part.maxHealth -= 5;
				part.maxFuel += 15;
			} else if (part.subType === 'pressurized') {
				part.maxFuel += 20;
			}
		}

		part.price = part.maxHealth + part.maxFuel + part.maxCargo;

		return part;
	}

	generateWorld(options) {
		const world = {
			name: options.id,
			airGap: 1,
			holeChance: 33,
			mineralChance: 33,
			randomMineralChance: 1,
			hazardChance: 33,
			itemChance: 1,
			safeDepth: 9,
			items: false,
			hazards: false,
			layers: [{ ground: 'white' }],
			width: [30, 50],
			depth: [180, 250],
			gravity: [350, 500],
			...options,
			grid: [],
			groundEffects,
			densities,
			mineralNames,
			itemNames,
			vehicles,
			vehicleNames,
			drills,
			drillNames,
			engines,
			engineNames,
			spaceco: {
				items,
				variant: randInt(0, 2),
				health: 9,
				hull: {},
			},
		};

		['airGap', 'safeDepth', 'width', 'depth', 'gravity'].forEach(key => {
			if (world[key] instanceof Array) world[key] = randInt(...world[key]);
		});

		world.spaceco.vehicles = Object.fromEntries(
			shuffleArray(vehicleNames)
				.slice(0, randInt(3, vehicleNames.length + 1))
				.map(name => [name, vehicles[name]]),
		);
		world.spaceco.drills = Object.fromEntries(
			shuffleArray(drillNames)
				.slice(0, randInt(3, drillNames.length + 1))
				.map(name => [name, drills[name]]),
		);
		world.spaceco.engines = Object.fromEntries(
			shuffleArray(engineNames)
				.slice(0, randInt(3, engineNames.length + 1))
				.map(name => [name, engines[name]]),
		);

		world.spaceco.items.oil.stock = randInt(0, 9);
		world.spaceco.items.battery.stock = randInt(0, 9);
		world.spaceco.items.battery.stock = randInt(0, 9);
		world.spaceco.items.super_oxygen_liquid_nitrogen.stock = randInt(0, 9);
		world.spaceco.items.teleporter.stock = randInt(9, 99);
		world.spaceco.items.responder_teleporter.stock = randInt(9, 39);
		world.spaceco.items.repair_nanites.stock = randInt(3, 13);
		world.spaceco.items.timed_charge.stock = randInt(9, 99);
		world.spaceco.items.remote_charge.stock = randInt(9, 99);

		if (!world.spaceco.position) world.spaceco.position = { x: randInt(3, world.width - 3), y: world.airGap };

		if (!world.spaceco.parts) {
			world.spaceco.parts = {};

			const partCount = randInt(3, 9);

			for (let x = 0; x < partCount; ++x) {
				const part = this.generatePart();

				world.spaceco.parts[part.name] = part;
			}
		}

		let holeChance,
			mineralChance,
			randomMineralChance,
			depthPercent,
			layer,
			groundType,
			itemChance,
			hazardChance,
			item,
			hazard;

		for (let x = 0, y; x < world.width; ++x) {
			for (y = 0; y < world.depth; ++y) {
				depthPercent = y / world.depth;
				layer = world.layers[Math.floor(depthPercent * world.layers.length)];

				holeChance = layer.holeChance || depthPercent * world.holeChance;
				mineralChance = layer.mineralChance || depthPercent * world.mineralChance;
				randomMineralChance = layer.randomMineralChance || depthPercent * world.randomMineralChance;
				itemChance = layer.itemChance || depthPercent * world.itemChance;
				hazardChance = layer.hazardChance || depthPercent * world.hazardChance;
				hazard = layer.hazards || world.hazards;
				item = layer.items || world.items;

				if (!world.grid[x]) world.grid[x] = [];

				world.grid[x][y] = { ground: {}, items: [], hazards: [] };

				if (y <= world.airGap) continue;

				groundType = layer.ground;

				if (groundType instanceof Array) groundType = randFromArray(groundType);
				else if (typeof groundType === 'object') groundType = weightedChance(groundType);

				if (groundType === 'random') groundType = randFromArray(mineralColors);

				if (y < world.safeDepth || !chance(holeChance)) {
					world.grid[x][y].ground.type = groundType;

					if (chance(mineralChance)) {
						const mineralType = chance(randomMineralChance) ? randFromArray(mineralColors) : groundType;

						world.grid[x][y].items.push(
							...new Array(randInt(1, chance(mineralChance) ? 2 : 4)).fill({ name: `mineral_${mineralType}` }),
						);
					}
				} else {
					if (!!hazard && chance(hazardChance)) {
						if (hazard instanceof Array) hazard = randFromArray(hazard);
						else if (typeof hazard === 'object') hazard = weightedChance(hazard);

						if (hazard === 'random') {
							hazard = randFromArray(['red_monster', 'purple_monster', 'poisonous_gas', 'noxious_gas', 'lava']);
						} else if (hazard === 'gas') hazard = chance() ? 'poisonous_gas' : 'noxious_gas';
						else if (hazard === 'monster') hazard = chance() ? 'red_monster' : 'purple_monster';

						world.grid[x][y].hazards.push({ name: hazard });
					} else if (!!item && chance(itemChance)) {
						if (item instanceof Array) item = randFromArray(item);
						else if (typeof item === 'object') item = weightedChance(item);

						if (item === 'random') item = randFromArray(itemNames);

						world.grid[x][y].items.push({ name: item });
					}
				}

				if (
					!world.grid[x][y].ground.type &&
					world.grid[x][y].hazards.length === 0 &&
					world.grid[x][y].items.length === 0
				) {
					if (
						world.grid[x - 1]?.[y]?.hazards?.some(hazard => hazard.name === 'lava' || hazard.name.endsWith('gas')) ||
						world.grid[x][y - 1]?.hazards?.some(hazard => hazard.name === 'lava' || hazard.name.endsWith('gas'))
					) {
						world.grid[x][y].hazards =
							world.grid[x - 1]?.[y]?.hazards?.length > 0 ? world.grid[x - 1][y].hazards : world.grid[x][y - 1].hazards;
					}
				}

				if (
					world.grid[x][y].hazards.some(hazard => hazard.name === 'lava' || hazard.name.endsWith('gas')) &&
					world.grid[x - 1]?.[y] &&
					!world.grid[x - 1][y].ground.type &&
					world.grid[x - 1][y].hazards.length === 0 &&
					world.grid[x - 1][y].items.length === 0
				) {
					world.grid[x - 1][y].hazards = world.grid[x][y].hazards;
				}
			}
		}

		return world;
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

	dissipateGas({ name, consumedPositions, ...position }) {
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const addedGas = [];
		const removedGas = [];

		consumedPositions = consumedPositions || [];

		Object.entries(surrounds).forEach(([surroundKey, { ground, hazards = [], x, y }]) => {
			const consumedPosition = consumedPositions.some(
				consumedPosition => consumedPosition.x === x && consumedPosition.y === y,
			);

			if (
				surroundKey !== 'bottom' &&
				this.world.grid[x]?.[y] &&
				!ground?.type &&
				!hazards?.some(hazard => hazard.name === 'lava' || hazard.name?.endsWith('gas')) &&
				!consumedPositions.some(consumedPosition => consumedPosition.x === x && consumedPosition.y === y)
			) {
				this.world.grid[x][y].hazards = this.world.grid[x][y].hazards.filter(
					hazard => !hazard.name?.endsWith('monster'),
				);
				this.world.grid[x][y].hazards.push({ name });

				addedGas.push({ x, y, name });

				const collidedWithPlayers = [...this.players.values()].some(
					player => player.position.x === x && player.position.y === y,
				);

				if (collidedWithPlayers) {
					this.hurtPlayers({ position: { x, y }, damage: 3 });
				}
			} else if (!consumedPosition && hazards.some(hazard => hazard.name?.endsWith('gas'))) {
				setTimeout(() => {
					this.dissipateGas({
						x,
						y,
						name: hazards.find(hazard => hazard.name?.endsWith('gas'))?.name || name,
						consumedPositions,
					});
				}, 500);
			}
		});

		removedGas.push(position);

		this.world.grid[position.x][position.y].hazards = this.world.grid[position.x][position.y].hazards.filter(
			hazard => !hazard.name?.endsWith('gas'),
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
				surroundKey !== 'top' &&
				this.world.grid[x]?.[y] &&
				!ground?.type &&
				!hazards.some(hazard => hazard.name?.endsWith('gas') || hazard.name === 'lava') &&
				!consumedPosition
			) {
				this.world.grid[x][y].hazards = this.world.grid[x][y].hazards.filter(
					hazard => !hazard.name?.endsWith('monster'),
				);
				this.world.grid[x][y].hazards.push({ name: 'lava' });

				addedLava.push({ x, y });

				const collidedWithPlayers = [...this.players.values()].some(
					player => player.position.x === x && player.position.y === y,
				);

				if (collidedWithPlayers) {
					this.hurtPlayers({ position: { x, y }, damage: 3 });
				}
			} else if (!consumedPosition && hazards.some(hazard => hazard.name === 'lava')) {
				setTimeout(() => {
					this.spillLava({ x, y, consumedPositions });
				}, 500);
			}
		});

		const contained = surrounds.left.ground?.type && surrounds.right.ground?.type && surrounds.bottom.ground?.type;

		if (!contained) {
			removedLava.push(position);

			this.world.grid[position.x][position.y].hazards = this.world.grid[position.x][position.y].hazards.filter(
				hazard => hazard.name !== 'lava',
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

	wakeChomper({ name, ...position }) {
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);

		const trapped =
			(surrounds.left.ground?.type || surrounds.left.hazards.length > 0) &&
			(surrounds.right.ground?.type || surrounds.right.hazards.length > 0) &&
			(surrounds.bottom.ground?.type || surrounds.bottom.hazards.length > 0) &&
			(surrounds.top.ground?.type || surrounds.top.hazards.length > 0);

		if (trapped) return;

		const nearestPlayer = [...this.players.values()].sort(
			(a, b) =>
				Math.abs(a.x - position.x) +
				Math.abs(a.y - position.y) -
				(Math.abs(b.x - position.x) + Math.abs(b.y - position.y)),
		)[0];

		const delta = {
			x: nearestPlayer.position.x - position.x,
			y: nearestPlayer.position.y - position.y,
		};

		// on top of player
		if (delta.x === 0 && delta.y === 0) {
			this.hurtPlayers({ position, damage: 3 });

			return;
		}

		// player too far
		if (Math.abs(delta.x) > 3 && Math.abs(delta.y) > 3) {
			this.broadcast('sleepChomper', { name, position });

			return;
		}

		let move;

		if (Math.abs(delta.x) > Math.abs(delta.y)) {
			move = delta.x > 0 ? 'right' : 'left';
		} else {
			move = delta.y > 0 ? 'bottom' : 'top';
		}

		if (surrounds[move].ground?.type || surrounds[move].hazards.length > 0) {
			if (Math.abs(delta.x) > Math.abs(delta.y) && Math.abs(delta.y)) {
				move = delta.y > 0 ? 'bottom' : 'top';
			} else if (Math.abs(delta.x) < Math.abs(delta.y) && Math.abs(delta.x)) {
				move = delta.x > 0 ? 'right' : 'left';
			}
		}

		if (!surrounds[move].ground?.type || surrounds[move].hazards.length > 0) {
			move = (({ x, y }) => ({ x, y }))(surrounds[move]);
		} else {
			move = (({ x, y }) => ({ x, y }))(
				Object.values(surrounds).find(({ ground, hazards }) => !ground?.type && hazards.length === 0),
			);
		}

		const moveDelta = {
			x: move.x - position.x,
			y: move.y - position.y,
		};
		const orientation = moveDelta.x > 0 ? 'right' : 'left';

		this.world.grid[position.x][position.y].hazards = this.world.grid[position.x][position.y].hazards.filter(
			hazard => hazard.name !== name,
		);

		this.world.grid[move.x][move.y].hazards.push({ name, orientation });

		this.broadcast('wakeChomper', { name, position, move, orientation });

		setTimeout(() => {
			if (chance(40)) {
				this.broadcast('sleepChomper', { name, position: move });
			} else {
				this.wakeChomper({ name, ...move });
			}
		}, 500);

		this.save();
	}

	spacecoFall(falling = false) {
		const { bottomLeft, bottom, bottomRight } = getImmediateSurrounds(
			this.world.spaceco.position,
			['bottomLeft', 'bottom', 'bottomRight'],
			this.world.grid,
		);

		if (!bottomLeft.ground.type && !bottom.ground.type && !bottomRight.ground.type) {
			const landingPosition = { x: bottom.x, y: bottom.y };

			this.world.spaceco.health = Math.max(0, this.world.spaceco.health - 1);
			this.world.spaceco.position = landingPosition;

			this.spacecoFall(true);
		} else if (falling) {
			this.broadcast('spacecoFall', { position: this.world.spaceco.position, health: this.world.spaceco.health });
		}
	}

	playerFall(playerId, falling = false) {
		const player = this.players.get(playerId);

		const playerShouldFall = !hasFooting(player.position, this.world.grid);

		if (playerShouldFall) {
			const updates = {
				position: { x: player.position.x, y: player.position.y + 1 },
				health: Math.max(0, player.health - 3),
			};

			this.players.update(playerId, _ => ({ ..._, ...updates }));

			this.playerFall(playerId, true);
		} else if (falling) {
			this.broadcast('playerFall', { updates: { position: player.position, health: player.health } });
		}
	}

	movePlayerStep(playerId, position) {
		const player = this.players.get(playerId);
		const surrounds = getImmediateSurrounds(position, ['left', 'right', 'bottom', 'top'], this.world.grid);
		const delta = {
			x: position.x - player.position.x,
			y: position.y - player.position.y,
		};

		let orientation;

		if (delta.y === 0) orientation = delta.x < 0 ? 'left' : 'right';
		else {
			orientation = `${delta.y < 0 ? 'up' : 'down'}_`;

			if (
				(surrounds.left.ground?.type || surrounds.right.ground?.type || surrounds.bottom.ground?.type) &&
				delta.x < 0
			) {
				orientation += 'left';
			} else if (
				(surrounds.left.ground?.type || surrounds.right.ground?.type || surrounds.bottom.ground?.type) &&
				delta.x > 0
			) {
				orientation += 'right';
			} else if (surrounds.left.ground?.type && player.orientation.includes('left')) {
				orientation += 'left';
			} else if (surrounds.right.ground?.type && player.orientation.includes('right')) {
				orientation += 'right';
			} else if (surrounds.left.ground?.type) {
				orientation += 'left';
			} else if (surrounds.right.ground?.type) {
				orientation += 'right';
			} else {
				orientation += player.orientation.includes('_') ? player.orientation.split('_')[1] : player.orientation;
			}

			if (Math.abs(delta.x) > 0 && Math.abs(delta.y) > 0) orientation += '_angle';
		}

		const updatedPlayer = { ...player, position, orientation, fuel: Math.max(0, (player.fuel -= 0.1)) };

		if (this.world.grid[position.x][position.y].ground?.type) {
			const { type } = this.world.grid[position.x][position.y].ground;
			const engineConfig = engines[player.configuration.engine];

			updatedPlayer.fuel = Math.max(0, updatedPlayer.fuel - densities[type] / (engineConfig.fuelEfficiency * 1000));

			updatedPlayer.hull[type] = updatedPlayer.hull[type] || 0;
			++updatedPlayer.hull[type];
		}

		if (this.world.grid[position.x][position.y].items.length > 0) {
			this.world.grid[position.x][position.y].items.forEach(({ name }) => {
				if (name.startsWith('mineral')) {
					updatedPlayer.hull[name] = updatedPlayer.hull[name] || 0;
					++updatedPlayer.hull[name];
				} else {
					updatedPlayer.items[name] = updatedPlayer.items[name] || 0;
					++updatedPlayer.items[name];
				}
			});
		}

		this.world.grid[position.x][position.y].ground = {};
		this.world.grid[position.x][position.y].items = [];

		this.players.set(playerId, updatedPlayer);

		let damage = 0;

		this.world.grid[position.x][position.y].hazards.forEach(hazard => {
			if (hazard?.name === 'lava') damage += 3;
			else if (hazard?.name === 'red_monster') damage += 3;
			else if (hazard?.name === 'purple_monster') damage += 3;
			else if (hazard?.name === 'poisonous_gas') damage += 3;
			else if (hazard?.name === 'noxious_gas') damage += 3;
		});

		this.broadcast('playerMove', { player: this.players.get(playerId) });

		this.updatePlayerCargo(playerId);

		if (damage) this.hurtPlayers({ players: [playerId], damage });

		const disturbedGas = [
			...this.world.grid[position.x][position.y].hazards.map(hazard => ({ ...hazard, ...position })),
			...(surrounds.left.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.left) })),
			...(surrounds.right.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.right) })),
			...(surrounds.bottom.hazards || []).map(hazard => ({
				...hazard,
				...(({ x, y }) => ({ x, y }))(surrounds.bottom),
			})),
		].filter(hazard => hazard.name?.endsWith('gas'));

		if (disturbedGas.length > 0) {
			disturbedGas.forEach(({ name, x, y }) => {
				this.dissipateGas({ x, y, name });
			});
		}

		const disturbedLava = [
			...this.world.grid[position.x][position.y].hazards.map(hazard => ({ ...hazard, ...position })),
			...(surrounds.left.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.left) })),
			...(surrounds.right.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.right) })),
			...(surrounds.top.hazards || []).map(hazard => ({ ...hazard, ...(({ x, y }) => ({ x, y }))(surrounds.top) })),
		].filter(hazard => hazard.name?.endsWith('lava'));

		if (disturbedLava.length > 0) {
			disturbedLava.forEach(({ x, y }) => {
				this.spillLava({ x, y });
			});
		}

		const disturbedChompers = getSurroundingRadius(position, 2, this.world.grid).flatMap(({ x, y, hazards }) =>
			(hazards || []).filter(hazard => hazard?.name.endsWith('monster')).map(hazard => ({ ...hazard, x, y })),
		);

		if (disturbedChompers.length > 0) {
			disturbedChompers.forEach(({ x, y, name }) => {
				this.wakeChomper({ x, y, name });
			});
		}

		const isNearSpaceco = getSurroundingRadius(position, 2).some(
			position => this.world.spaceco.position.x === position.x && this.world.spaceco.position.y === position.y,
		);

		if (isNearSpaceco) this.spacecoFall();
	}

	movePlayer(playerId, path) {
		// TODO reject move if:
		// - delta is greater than 1
		// - there is no supporting ground

		this.players.update(playerId, _ => ({ ..._, moving: true }));

		try {
			this.movePlayerStep(playerId, path.shift());
		} catch (error) {
			console.error('Player Move Error', error);

			this.players.update(playerId, _ => ({ ..._, moving: false }));

			this.save();
		}

		setTimeout(() => {
			if (path.length > 0) this.movePlayer(playerId, path);
			else {
				this.players.update(playerId, _ => ({ ..._, moving: false }));

				this.save();
			}
		}, 500);
	}
}
