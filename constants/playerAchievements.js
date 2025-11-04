import { aliens } from './aliens';

export const playerAchievements = [
	// -------------------
	// FIRST EXPERIENCES
	// -------------------
	{
		id: 'first_peaceful_alien_encounter',
		category: 'Encounters',
		name: 'Peaceful Contact',
		summary: 'Encounter a non-hostile alien lifeform.',
		flavor: 'First documented peaceful xenobiological interaction. Incident classified for review.',
		difficulty: 3, // Medium - requires finding peaceful aliens
		hidden: true, // Spoils alien presence
		trigger: {
			type: 'alien_wake',
			check: ({ event }) => {
				const alienConfig = aliens[event.alien];
				return alienConfig && ['curious', 'scared', 'neutral'].includes(alienConfig.behavior?.type);
			},
		},
		awards: [
			['xp', 100],
			['credits', 30],
		],
	},
	{
		id: 'first_pure_mineral',
		category: 'Extraction',
		name: 'Shiny Discovery',
		summary: 'Collect your first pure mineral.',
		flavor: 'Uncut, unprocessed, and undeniably valuable. SpaceCo is already calculating margins.',
		trigger: {
			type: 'playerMove',
			check: ({ event }) => event.ground.items.some(({ name }) => name.startsWith('mineral')),
		},
		awards: [
			['xp', 75],
			['credits', 30],
		],
	},
	{
		id: 'first_breakdown',
		category: 'Incidents',
		name: 'Learning the Hard Way',
		summary: 'Experience your first rig breakdown or rescue situation.',
		flavor: 'Field failure logged. Maintenance schedule updated.',
		hidden: true, // Reveals failure mechanics
		trigger: { type: 'removePlayer', check: ({ player }) => player.stats.deaths >= 1 },
		awards: [
			['xp', 20],
			['credits', 0],
		],
	},
	{
		id: 'first_repair',
		category: 'Operations',
		name: 'Patch Job',
		summary: 'Repair your rig using nanites or SpaceCo services for the first time.',
		flavor: "Rough edges smoothed out. You're operational again.",
		trigger: { type: 'spacecoRepair', check: ({ event }) => event?.type === 'player' },
		awards: [
			['xp', 30],
			['credits', 0],
		],
	},
	{
		id: 'inventory_management',
		category: 'Operations',
		name: 'Pack Rat',
		summary: 'Fill your inventory to maximum capacity.',
		flavor: 'Every slot utilized. SpaceCo approves of efficient resource management.',
		trigger: {
			type: 'spacecoBuyItem',
			check: ({ player }) => {
				const currentItemCount = Object.values(player.items).reduce((sum, count) => sum + count, 0);
				return currentItemCount >= player.maxItemSlots;
			},
		},
		awards: [
			['xp', 60],
			['credits', 25],
		],
	},
	{
		id: 'first_trade',
		category: 'Commerce',
		name: 'Deal Maker',
		summary: 'Complete your first trade with another player.',
		flavor: 'Negotiations complete. SpaceCo HR notified.',
		trigger: { type: 'tradeCompleted', check: () => true },
		awards: [
			['xp', 40],
			['credits', 20],
		],
	},
	{
		id: 'first_facility_relocation',
		category: 'Operations',
		name: 'Mobile Operations',
		summary: 'Use a SpaceCo teleport station to relocate an outpost.',
		flavor: 'Advanced logistics deployment successful. Facility mobility protocols engaged.',
		trigger: {
			type: 'useItem',
			check: ({ event }) => event.item === 'spaceco_teleport_station',
		},
		awards: [
			['xp', 150],
			['credits', 50],
		],
	},
	{
		id: 'first_egg_collection',
		category: 'Extraction',
		name: 'Quantum Specimen',
		summary: 'Collect your first quantum-resonant mineral specimen.',
		flavor: 'High-priority specimen secured. The Collective expresses satisfaction.',
		difficulty: 5, // Very Hard - rare endgame items with story significance
		hidden: true, // Major story spoiler - reveals alien control and egg importance
		trigger: {
			type: 'playerMove',
			check: ({ event }) => event.ground.items.some(({ name }) => name === 'psykick_egg'),
		},
		awards: [
			['xp', 200],
			['credits', 100],
		],
	},

	// -------------------
	// MOVEMENT & EXPLORATION
	// -------------------
	{
		id: 'hundred_clicks',
		category: 'Exploration',
		name: 'Pathfinder',
		summary: 'Drive a total of 100 grid units underground.',
		flavor: '100 units of subterranean navigation recorded. Pathing efficiency nominal.',
		difficulty: 1, // Easy - happens with regular play
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.tilesMoved >= 100 },
		awards: [
			['xp', 40],
			['credits', 15],
		],
	},
	{
		id: 'long_hauler',
		category: 'Exploration',
		name: 'Long Hauler',
		summary: 'Navigate a total of 1,000 grid units underground.',
		flavor: '1,000 units logged. Belt-wide mobility metrics continue to climb.',
		difficulty: 2, // Easy-Medium - requires sustained play
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.tilesMoved >= 1000 },
		awards: [
			['xp', 90],
			['credits', 25],
		],
	},
	{
		id: 'depth_finder',
		category: 'Exploration',
		name: 'Dark Reaches',
		summary: 'Reach depth 50.',
		flavor: 'Depth 50 milestone reached. Sensor fidelity degraded at current levels.',
		difficulty: 2, // Easy-Medium - requires going deep
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.deepestDepthReached >= 50 },
		awards: [
			['xp', 60],
			['credits', 20],
		],
	},
	{
		id: 'depth_diver',
		category: 'Exploration',
		name: 'Depth Diver',
		summary: 'Reach depth 100.',
		flavor: 'Depth 100 milestone achieved. Structural stresses acceptable - for now.',
		difficulty: 3, // Medium - requires significant depth exploration
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.deepestDepthReached >= 100 },
		awards: [
			['xp', 200],
			['credits', 40],
		],
	},
	{
		id: 'abyss_walker',
		category: 'Exploration',
		name: 'Abyss Walker',
		summary: 'Reach depth 200.',
		flavor: 'Depth 200 achieved. Congratulations on surviving where sensors fear to function.',
		difficulty: 4, // Hard - extreme depth with dangerous conditions
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.deepestDepthReached >= 200 },
		awards: [
			['xp', 400],
			['credits', 80],
		],
	},

	// -------------------
	// EXTRACTION & RESOURCES
	// -------------------
	{
		id: 'excavation_expert',
		category: 'Extraction',
		name: 'Heavy Machinery',
		summary: 'Drill through 250 tiles of rock.',
		flavor: '250 structural tiles removed from target environment. Tool integrity adequate.',
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.tilesDug >= 250 },
		awards: [
			['xp', 60],
			['credits', 30],
		],
	},
	{
		id: 'multi_miner',
		category: 'Extraction',
		name: 'Diversified Portfolio',
		summary: 'Collect and sell at least 5 different ore types.',
		flavor: 'Five distinct mineral types collected! SpaceCo geology department celebrates successful diversification.',
		difficulty: 2, // Easy-Medium - requires exploration of different areas
		trigger: { type: 'spacecoSell', check: ({ player }) => Object.keys(player.stats.oreTypesCollected).length >= 5 },
		awards: [
			['xp', 300],
			['credits', 75],
		],
	},
	{
		id: 'mineral_specialist',
		category: 'Extraction',
		name: 'Full Spectrum Miner',
		summary: 'Collect and sell all 10 mineral types.',
		flavor: 'Complete mineral classification achieved. Geological survey department impressed.',
		difficulty: 4, // Hard - requires visiting many different worlds/depths
		trigger: { type: 'spacecoSell', check: ({ player }) => Object.keys(player.stats.oreTypesCollected).length >= 10 },
		awards: [
			['xp', 750],
			['credits', 225],
		],
	},

	// -------------------
	// UPGRADE PROGRESSION
	// -------------------
	{
		id: 'soln_adopter',
		category: 'Upgrades',
		name: 'SOLN Technology Adopter',
		summary: 'Equip your first SOLN-powered engine.',
		flavor: 'Advanced cryogenic propulsion online. Peak efficiency achieved.',
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ player }) =>
				player.configuration.engine?.includes('T9') ||
				player.configuration.engine?.includes('T10') ||
				player.configuration.engine?.includes('T11') ||
				player.configuration.engine?.includes('T12'),
		},
		awards: [
			['xp', 150],
			['credits', 75],
		],
	},
	{
		id: 'alien_tech_user',
		category: 'Upgrades',
		name: 'Unconventional Engineering',
		summary: 'Equip any alien-influenced technology.',
		flavor:
			'Mysterious technology integration complete. Your rig operates with impossible efficiency through... unconventional principles.',
		difficulty: 5, // Very Hard - endgame alien technology
		hidden: true, // Spoils alien technology existence and late-game content
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ player }) =>
				['T11', 'T12', 'T13', 'T14'].some(tier =>
					Object.values(player.configuration).some(item => item?.includes(tier)),
				),
		},
		awards: [
			['xp', 500],
			['credits', 150],
		],
	},

	// -------------------
	// OPERATIONS & ECONOMY
	// -------------------
	{
		id: 'supply_hoarder',
		category: 'Operations',
		name: 'Well Stocked',
		summary: 'Hold 10 or more items in your inventory at the same time.',
		flavor: 'Inventory optimization maximized. Procurement efficiency noted.',
		trigger: { type: 'spacecoBuyItem', check: ({ player }) => Object.keys(player.items).length >= 10 },
		awards: [
			['xp', 70],
			['credits', 25],
		],
	},
	{
		id: 'fuel_burner',
		category: 'Operations',
		name: 'Fuel Consumer',
		summary: 'Consume a total of 200 fuel across your operations.',
		flavor: '200 fuel units consumed. Efficiency metrics under review.',
		trigger: { type: 'playerMove', check: ({ player }) => player.stats.totalConsumedFuel >= 200 },
		awards: [
			['xp', 60],
			['credits', 20],
		],
	},
	{
		id: 'demolition_expert',
		category: 'Operations',
		name: 'Demolitionist',
		summary: 'Detonate a total of 15 explosive devices.',
		flavor: '15 controlled detonations logged. Collateral losses within approved margins.',
		trigger: {
			type: 'explodeBomb',
			check: ({ player }) =>
				(player.stats.itemsUsed?.remote_charge ?? 0) +
					(player.stats.itemsUsed?.timed_charge ?? 0) +
					(player.stats.itemsUsed?.gravity_charge ?? 0) +
					(player.stats.itemsUsed?.void_implosion ?? 0) >=
				15,
		},
		awards: [
			['xp', 120],
			['credits', 40],
			['remote_charge', 1],
		],
	},
	{
		id: 'nanite_specialist',
		category: 'Operations',
		name: 'Self-Repair Specialist',
		summary: 'Use repair nanites 15 times.',
		flavor: '15 nanite repair cycles administered. Autonomous maintenance systems optimized.',
		trigger: { type: 'useItem', check: ({ player }) => player.stats.itemsUsed?.repair_nanites >= 15 },
		awards: [
			['xp', 100],
			['credits', 40],
			['repair_nanites', 2],
		],
	},

	// -------------------
	// ECONOMY
	// -------------------
	{
		id: 'big_spender',
		category: 'Commerce',
		name: 'High Roller',
		summary: 'Spend at least 1,000 credits in a single SpaceCo transaction.',
		flavor: '1,000 credits dispensed in single transaction. Premium customer status confirmed.',
		trigger: { type: 'spacecoBuyItem', check: ({ event }) => event.cost >= 1000 },
		awards: [
			['xp', 100],
			['credits', 0],
			['battery', 1],
		],
	},
	{
		id: 'profit_generator',
		category: 'Commerce',
		name: 'Cashflow Positive',
		summary: 'Earn a total of 2,500 credits from mineral sales.',
		flavor: '2,500 credits earned. Sustained profitability confirmed.',
		trigger: { type: 'spacecoSell', check: ({ player }) => player.stats.creditsEarned >= 2500 },
		awards: [
			['xp', 100],
			['credits', 100],
		],
	},
	{
		id: 'big_customer',
		category: 'Commerce',
		name: 'Valued Customer',
		summary: 'Spend a total of 5,000 credits at SpaceCo.',
		flavor: '5,000 credits expended. Premium customer services unlocked.',
		trigger: { type: 'spacecoBuyItem', check: ({ player }) => player.stats.creditsSpent >= 5000 },
		awards: [
			['xp', 100],
			['credits', 0],
		],
	},

	// -------------------
	// ALIEN ENCOUNTERS
	// -------------------
	{
		id: 'first_alien_contact',
		category: 'Encounters',
		name: 'First Contact',
		summary: 'Encounter your first alien lifeform.',
		flavor: 'Xenobiological contact confirmed. Incident logged for review.',
		hidden: true, // Spoils alien presence
		trigger: {
			type: 'alien_wake',
			check: ({ event }) =>
				[
					'psykick_scout',
					'psykick_warrior',
					'rock_mite',
					'void_drifter',
					'hive_drone',
					'tunnel_chomper',
					'lava_spitter',
					'gas_sporecyst',
					'mimic_ore',
					'spawn_mother',
					'depth_guardian',
				].includes(event.alien),
		},
		awards: [
			['xp', 80],
			['credits', 0],
		],
	},
	{
		id: 'psykick_encounter',
		category: 'Encounters',
		name: 'Psykick Contact',
		summary: 'Encounter a Psykick alien.',
		flavor: 'Psykick lifeform detected. Telepathic communication protocols... unclear.',
		hidden: true, // Spoils main alien race
		trigger: {
			type: 'alien_wake',
			check: ({ event }) => ['psykick_scout', 'psykick_warrior'].includes(event.alien),
		},
		awards: [
			['xp', 100],
			['credits', 25],
		],
	},

	// -------------------
	// PROGRESSION MILESTONES
	// -------------------
	{
		id: 'belt_explorer',
		category: 'Progression',
		name: 'Belt Explorer',
		summary: 'Visit 5 different asteroid zones via transport.',
		flavor: 'Five asteroid environments surveyed. Belt-wide presence established.',
		trigger: { type: 'spacecoBuyTransport', check: ({ player }) => player.stats.asteroidsVisited >= 5 },
		awards: [
			['xp', 400],
			['credits', 110],
			['transport_insurance', 1],
			['spaceco_teleport_station', 1],
		],
	},
	{
		id: 'trade_network',
		category: 'Commerce',
		name: 'Trade Network',
		summary: 'Complete 8 trades with other contractors.',
		flavor: 'Inter-contractor commerce network established. Market efficiency improved.',
		trigger: { type: 'playerTrade', check: ({ player }) => player.stats.tradesCompleted >= 8 },
		awards: [
			['xp', 120],
			['credits', 60],
		],
	},

	// -------------------
	// INCIDENTS
	// -------------------
	{
		id: 'fuel_emergency',
		category: 'Incidents',
		name: 'Stranded',
		summary: 'Run out of fuel at least once.',
		flavor: 'Fuel reserves fully depleted. Emergency protocols engaged.',
		hidden: true, // Reveals failure state mechanic
		trigger: { type: 'playerCantMove', check: ({ player }) => player.stats.outOfFuelEvents >= 1 },
		awards: [
			['xp', 30],
		],
	},
	{
		id: 'emergency_evacuation',
		category: 'Incidents',
		name: 'Emergency Protocol',
		summary: 'Use an emergency teleport at least once.',
		flavor: 'Emergency evacuation procedure executed. Incident report filed.',
		hidden: true, // Reveals emergency mechanics
		trigger: { type: 'spacecoRescue', check: ({ player }) => player.stats.emergencyTeleports >= 1 },
		awards: [
			['xp', 50],
			['credits', 0],
		],
	},

	// -------------------
	// RETIREMENT TIERS
	// -------------------
	{
		id: 'retirement_tier_1',
		category: 'Progression',
		name: 'Pension Eligible',
		summary: 'Reach 1,000 Pension Credits.',
		flavor: 'Minimum retirement eligibility achieved. Current projections: modest.',
		trigger: { type: 'xpGain', check: ({ player }) => player.xp >= 1000 },
		awards: [['credits', 300]],
	},
	{
		id: 'retirement_tier_2',
		category: 'Progression',
		name: 'Secure Retirement',
		summary: 'Reach 2,500 Pension Credits.',
		flavor: 'Comfortable retirement secured. Oxygen and nutrition guaranteed.',
		trigger: { type: 'xpGain', check: ({ player }) => player.xp >= 2500 },
		awards: [['credits', 500]],
	},
	{
		id: 'retirement_tier_3',
		category: 'Progression',
		name: 'Premium Package',
		summary: 'Reach 5,000 Pension Credits.',
		flavor: 'Premium retirement package unlocked. Private quarters and real gravity included.',
		trigger: { type: 'xpGain', check: ({ player }) => player.xp >= 5000 },
		awards: [['credits', 750]],
	},
	{
		id: 'retirement_tier_4',
		category: 'Progression',
		name: 'Executive Status',
		summary: 'Reach 10,000 Pension Credits.',
		flavor: 'Executive retirement status achieved. Off-world villa and personal transport secured.',
		trigger: { type: 'xpGain', check: ({ player }) => player.xp >= 10000 },
		awards: [['credits', 1200]],
	},
	{
		id: 'retirement_tier_5',
		category: 'Progression',
		name: 'Corporate Legend',
		summary: 'Reach 25,000 Pension Credits.',
		flavor: 'Legendary contractor status. Your name graces SpaceCo hall of fame.',
		difficulty: 5, // Very Hard - requires massive time investment
		hidden: true, // High-end achievement that spoils endgame scale
		trigger: { type: 'xpGain', check: ({ player }) => player.xp >= 25000 },
		awards: [['credits', 2000]],
	},

	// -------------------
	// ITEM DISCOVERY
	// -------------------
	{
		id: 'find_oil',
		category: 'Discovery',
		name: 'Fuel Cache',
		summary: 'Find an oil canister in the field.',
		flavor: 'Unmarked fuel canister recovered. Previous owner: unknown.',
		trigger: {
			type: 'playerMove',
			check: ({ event }) => event.ground.items.some(({ name }) => name === 'oil'),
		},
		awards: [['xp', 160]],
	},
];
