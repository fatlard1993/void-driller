export const worlds = [
	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 1: TRAINING SHALLOWS - SURFACE LIES PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Pure corporate enthusiasm, no alien presence, straightforward mining
	{
		id: 'training_shallows',
		name: 'Training Shallows',
		description:
			'Entry-level asteroid cluster designated for new contractor orientation and basic extraction training.',
		transportRequirements: [],
		transportPrice: 25,
		width: [25, 35],
		depth: [60, 80],
		mineralChance: 30,
		itemChance: 2,
		holeChance: 25,
		items: 'oil',
		tunnelSystems: {
			count: [1, 2],
			branchProbability: 0.2,
			maxBranches: 2,
			segmentLength: [3, 6],
			wanderStrength: 0.3,
		},
		spaceco: {
			variant: 0,
			shop: {
				oil: [2, 3],
				transport_insurance: 1,
			},
			vehicles: ['T2'],
			drills: ['T2'],
			engines: ['T2'],
			parts: [],
		},
		newPlayer: {
			credits: 0,
			items: { oil: 1 },
			configuration: {
				vehicle: 'T1',
				drill: 'T1',
				engine: 'T1',
			},
		},
		layers: [
			{
				ground: { white: 85, orange: 10, black: 5 },
			},
			{
				ground: { white: 80, orange: 15, black: 5 },
				mineralChance: 40,
			},
			{
				ground: { white: 75, orange: 20, black: 5 },
				mineralChance: 50,
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 2: SURFACE PROSPECTS - SURFACE LIES PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate confidence with standard safety warnings, no alien acknowledgment
	{
		id: 'surface_prospects',
		name: 'Surface Prospects',
		description: 'Shallow asteroid fields with reliable mineral deposits. Perfect for building operational experience.',
		transportRequirements: [['white', 120]],
		transportPrice: 75,
		width: [30, 40],
		depth: [80, 100],
		mineralChance: 35,
		itemChance: 1,
		holeChance: 30,
		items: { oil: 70, repair_nanites: 30 },
		hazards: ['lava'],
		tunnelSystems: {
			count: [2, 3],
			branchProbability: 0.25,
			maxBranches: 2,
			segmentLength: [4, 7],
			wanderStrength: 0.35,
		},
		spaceco: {
			variant: 0,
			shop: {
				oil: [2, 4],
				repair_nanites: [1, 2],
				transport_insurance: 1,
			},
			vehicles: ['T3'],
			drills: ['T3'],
			engines: ['T3'],
			parts: ['T1'], // First introduction to parts
		},
		newPlayer: {
			credits: 200,
			items: { oil: 2, repair_nanites: 1 },
			configuration: {
				vehicle: 'T2',
				drill: 'T2',
				engine: 'T2',
			},
		},
		layers: [
			{
				ground: { orange: 70, white: 20, yellow: 5, black: 5 },
			},
			{
				ground: { orange: 75, yellow: 15, black: 10 },
				hazardChance: 15,
			},
			{
				ground: { orange: 65, yellow: 25, black: 10 },
				mineralChance: 45,
				hazardChance: 20,
			},
			{
				ground: { orange: 50, yellow: 35, black: 15 },
				hazardChance: 25,
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 3: AMBER EXTRACTION ZONE - SURFACE LIES PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate confidence with minor "environmental complications" - aliens present but hidden
	{
		id: 'amber_extraction_zone',
		name: 'Amber Extraction Zone',
		description: 'Mid-tier asteroid belt showing promising pentrilium concentrations and manageable heat signatures.',
		transportRequirements: [['orange', 150]],
		transportPrice: 150,
		width: [35, 45],
		depth: [100, 120],
		mineralChance: 40,
		itemChance: 1,
		holeChance: 35,
		items: { oil: 60, repair_nanites: 25, spaceco_teleporter: 15 },
		hazards: ['lava'],
		tunnelSystems: {
			count: [2, 4],
			branchProbability: 0.3,
			maxBranches: 3,
			segmentLength: [4, 8],
			wanderStrength: 0.4,
		},
		spaceco: {
			variant: 0,
			shop: {
				oil: [3, 4],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				transport_insurance: 1,
			},
			vehicles: ['T4'],
			drills: ['T4'],
			engines: ['T4'],
			parts: ['T1', 'T2'], // Expand parts selection
		},
		newPlayer: {
			credits: 300,
			items: { oil: 2, repair_nanites: 1 },
			configuration: {
				vehicle: 'T3',
				drill: 'T3',
				engine: 'T3',
			},
		},
		layers: [
			{
				ground: { yellow: 65, orange: 25, green: 5, black: 5 },
			},
			{
				ground: { yellow: 70, green: 20, black: 10 },
				hazardChance: 20,
			},
			{
				ground: { yellow: 60, green: 30, black: 10 },
				mineralChance: 50,
				hazardChance: 25,
				hazards: ['lava', 'rock_mite'],
			},
			{
				ground: { yellow: 45, green: 40, black: 15 },
				hazardChance: 30,
				hazards: [
					'lava',
					'rock_mite',
					{
						type: 'mystery_spawner',
						spawnTable: [{ weight: 100, spawn: { type: 'alien', name: 'rock_mite' } }],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 4: VERDANT VOLATILES - SURFACE LIES PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate optimism with enhanced safety measures, aliens dismissed as indigenous life
	{
		id: 'verdant_volatiles',
		name: 'Verdant Volatiles',
		description:
			'Byzanium-rich asteroid cluster with elevated instability readings. Proceed with standard caution protocols.',
		transportRequirements: [['yellow', 180]],
		transportPrice: 250,
		width: [40, 50],
		depth: [120, 140],
		mineralChance: 45,
		itemChance: 1,
		holeChance: 40,
		items: { oil: 40, battery: 30, repair_nanites: 20, spaceco_teleporter: 10 },
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [3, 5],
			branchProbability: 0.35,
			maxBranches: 3,
			segmentLength: [5, 9],
			wanderStrength: 0.45,
		},
		spaceco: {
			variant: 0,
			shop: {
				oil: [2, 3],
				battery: [1, 2],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: [0, 1],
				transport_insurance: 1,
			},
			vehicles: ['T5'],
			drills: ['T5'],
			engines: ['T5'],
			parts: ['T2', 'T3'], // Continue expanding parts
		},
		newPlayer: {
			credits: 400,
			items: { oil: 1, battery: 1, repair_nanites: 1 },
			configuration: {
				vehicle: 'T4',
				drill: 'T4',
				engine: 'T4',
			},
		},
		layers: [
			{
				ground: { green: 60, yellow: 30, teal: 5, black: 5 },
			},
			{
				ground: { green: 65, teal: 25, black: 10 },
				hazardChance: 25,
			},
			{
				ground: { green: 55, teal: 35, black: 10 },
				mineralChance: 55,
				hazardChance: 30,
				hazards: ['lava', 'gas', 'gas_sporecyst', 'hive_drone', 'gift_bearer'],
			},
			{
				ground: { green: 40, teal: 45, black: 15 },
				hazardChance: 35,
				hazards: [
					'lava',
					'gas',
					'gas_sporecyst',
					'hive_drone',
					'rock_mite',
					'gift_bearer',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 50, spawn: { type: 'alien', name: 'gas_sporecyst' } },
							{ weight: 50, spawn: { type: 'alien', name: 'hive_drone' } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 5: ETHEREAL DEPTHS - SURFACE LIES PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate confidence with "scientific interest" - deeper alien encounters but covered up
	{
		id: 'ethereal_depths',
		name: 'Ethereal Depths',
		description: 'Deep etherium deposits detected in stable geological formations. Excellent profit margins projected.',
		transportRequirements: [['green', 220]],
		transportPrice: 375,
		width: [45, 55],
		depth: [140, 160],
		mineralChance: 50,
		itemChance: 1,
		holeChance: 42,
		items: { oil: 25, battery: 40, repair_nanites: 20, spaceco_teleporter: 10, timed_charge: 5 },
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [3, 6],
			branchProbability: 0.4,
			maxBranches: 4,
			segmentLength: [6, 10],
			wanderStrength: 0.5,
		},
		spaceco: {
			variant: 0,
			shop: {
				oil: [2, 3],
				battery: [1, 2],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: 1,
				timed_charge: [1, 2],
				transport_insurance: 1,
			},
			vehicles: ['T6'],
			drills: ['T6'],
			engines: ['T6'],
			parts: ['T3', 'T4'], // Mid-tier parts available
		},
		newPlayer: {
			credits: 600,
			items: { battery: 1, repair_nanites: 1 },
			configuration: {
				vehicle: 'T5',
				drill: 'T5',
				engine: 'T5',
			},
		},
		layers: [
			{
				ground: { teal: 60, green: 25, blue: 10, black: 5 },
			},
			{
				ground: { teal: 65, blue: 25, black: 10 },
				hazardChance: 30,
			},
			{
				ground: { teal: 55, blue: 35, black: 10 },
				mineralChance: 60,
				hazardChance: 35,
				hazards: ['gas', 'gas_sporecyst', 'hive_drone', 'void_drifter'],
			},
			{
				ground: { teal: 40, blue: 45, black: 15 },
				hazardChance: 40,
				hazards: [
					'lava',
					'gas',
					'gas_sporecyst',
					'rock_mite',
					'void_drifter',
					'gift_bearer',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 30, spawn: { type: 'alien', name: 'gas_sporecyst' } },
							{ weight: 35, spawn: { type: 'alien', name: 'rock_mite' } },
							{ weight: 34, spawn: { type: 'alien', name: 'void_drifter' } },
							{ weight: 1, spawn: { type: 'alien', name: 'gift_bearer' } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 6: AZURE ANOMALIES - HIDDEN DEPTHS PHASE BEGINS
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate bureaucracy increases, "specialists" appear, aliens covered up as phenomena
	{
		id: 'azure_anomalies',
		name: 'Azure Anomalies',
		description:
			'Mithril-bearing formations with unusual energy signatures. Geological surveys report minor sensor interference.',
		transportRequirements: [['teal', 260]],
		transportPrice: 550,
		width: [50, 60],
		depth: [160, 180],
		mineralChance: 55,
		itemChance: 1,
		holeChance: 45,
		items: { battery: 50, super_oxygen_liquid_nitrogen: 20, repair_nanites: 15, timed_charge: 10, remote_charge: 5 },
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [4, 7],
			branchProbability: 0.45,
			maxBranches: 4,
			segmentLength: [7, 12],
			wanderStrength: 0.55,
		},
		spaceco: {
			variant: 1, // Enhanced/militarized facility
			shop: {
				battery: [2, 3],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: 1,
				timed_charge: [1, 2],
				remote_charge: [0, 1],
				transport_insurance: 1,
			},
			vehicles: ['T7'],
			drills: ['T7'],
			engines: ['T7'],
			parts: ['T4', 'T5'], // Higher tier parts available
		},
		newPlayer: {
			credits: 750,
			items: { battery: 1, repair_nanites: 1 },
			configuration: {
				vehicle: 'T6',
				drill: 'T6',
				engine: 'T6',
			},
		},
		layers: [
			{
				ground: { blue: 60, teal: 25, purple: 10, black: 5 },
			},
			{
				ground: { blue: 65, purple: 25, black: 10 },
				hazardChance: 35,
			},
			{
				ground: { blue: 55, purple: 35, black: 10 },
				mineralChance: 65,
				hazardChance: 40,
				hazards: ['gas', 'void_drifter', 'psykick_scout', 'earth_mover'],
			},
			{
				ground: { blue: 40, purple: 45, black: 15 },
				hazardChance: 45,
				hazards: [
					'lava',
					'depth_guardian',
					'psykick_scout',
					'earth_mover',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 55, spawn: { type: 'alien', name: 'psykick_scout' } },
							{ weight: 40, spawn: { type: 'alien', name: 'depth_guardian' } },
							{ weight: 5, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 15 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 7: PRISMATIC CONFLUENCE - HIDDEN DEPTHS PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate facade maintained but cracks showing, enhanced protocols, more red tape
	{
		id: 'prismatic_confluence',
		name: 'Prismatic Confluence',
		description:
			'High-grade octanium deposits in complex crystalline matrices. Extraction teams report "unusual acoustic phenomena."',
		transportRequirements: [['blue', 300]],
		transportPrice: 750,
		width: [55, 65],
		depth: [180, 200],
		mineralChance: 60,
		itemChance: 1,
		holeChance: 48,
		items: {
			battery: 40,
			super_oxygen_liquid_nitrogen: 30,
			repair_nanites: 15,
			remote_charge: 10,
			spaceco_teleport_station: 5,
		},
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [5, 8],
			branchProbability: 0.5,
			maxBranches: 5,
			segmentLength: [8, 14],
			wanderStrength: 0.6,
		},
		spaceco: {
			variant: 1,
			shop: {
				battery: [2, 3],
				super_oxygen_liquid_nitrogen: [1, 1],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: 1,
				remote_charge: 1,
				spaceco_teleport_station: [0, 1],
				transport_insurance: 1,
			},
			vehicles: ['T8'],
			drills: ['T8'],
			engines: ['T8'],
			parts: ['T5', 'T6'], // Advanced parts
		},
		newPlayer: {
			credits: 800,
			items: { battery: 1, super_oxygen_liquid_nitrogen: 1, repair_nanites: 1 },
			configuration: {
				vehicle: 'T7',
				drill: 'T7',
				engine: 'T7',
			},
		},
		layers: [
			{
				ground: { purple: 60, blue: 25, pink: 10, black: 5 },
			},
			{
				ground: { purple: 65, pink: 25, black: 10 },
				hazardChance: 40,
			},
			{
				ground: { purple: 55, pink: 35, black: 10 },
				mineralChance: 70,
				hazardChance: 45,
				hazards: ['gas', 'mimic_ore', 'psykick_scout', 'hive_drone', 'earth_mover'],
			},
			{
				ground: { purple: 40, pink: 45, black: 15 },
				hazardChance: 50,
				hazards: [
					'lava',
					'hive_soldier',
					'mimic_ore',
					'earth_mover',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 65, spawn: { type: 'alien', name: 'mimic_ore' } },
							{ weight: 25, spawn: { type: 'alien', name: 'hive_soldier' } },
							{ weight: 10, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 20 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 8: RESONANT CAVERNS - COLLAPSE PHASE BEGINS
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Corporate language becomes bureaucratic, less human, decisions made by "committees"
	{
		id: 'resonant_caverns',
		name: 'Resonant Caverns',
		description:
			'Saronite veins embedded in acoustically active rock formations. Equipment malfunctions reported but profits remain strong.',
		transportRequirements: [['purple', 340]],
		transportPrice: 1000,
		width: [60, 70],
		depth: [200, 220],
		mineralChance: 65,
		itemChance: 1,
		holeChance: 50,
		items: { battery: 30, super_oxygen_liquid_nitrogen: 40, repair_nanites: 20, gravity_charge: 10 },
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [6, 10],
			branchProbability: 0.55,
			maxBranches: 6,
			segmentLength: [10, 16],
			wanderStrength: 0.65,
		},
		spaceco: {
			variant: 1,
			shop: {
				battery: [1, 2],
				super_oxygen_liquid_nitrogen: [1, 2],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: 1,
				remote_charge: [1, 2],
				spaceco_teleport_station: 1,
				gravity_charge: [0, 1],
				transport_insurance: 1,
			},
			vehicles: ['T9'],
			drills: ['T9'],
			engines: ['T9'],
			parts: ['T6', 'T7'], // High-tier parts
		},
		newPlayer: {
			credits: 1000,
			items: { super_oxygen_liquid_nitrogen: 1, repair_nanites: 1 },
			configuration: {
				vehicle: 'T8',
				drill: 'T8',
				engine: 'T8',
			},
		},
		layers: [
			{
				ground: { pink: 60, purple: 25, red: 10, black: 5 },
			},
			{
				ground: { pink: 65, red: 25, black: 10 },
				hazardChance: 45,
			},
			{
				ground: { pink: 55, red: 35, black: 10 },
				mineralChance: 75,
				hazardChance: 50,
				hazards: ['gas', 'tunnel_chomper', 'psykick_scout', 'hive_soldier', 'earth_mover'],
			},
			{
				ground: { pink: 40, red: 45, black: 15 },
				hazardChance: 55,
				hazards: [
					'lava',
					'psykick_warrior',
					'spawn_mother',
					'earth_mover',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 75, spawn: { type: 'alien', name: 'psykick_warrior' } },
							{ weight: 20, spawn: { type: 'alien', name: 'spawn_mother' } },
							{ weight: 5, spawn: { type: 'alien', name: 'alpha_tunnel_chomper', eliteChance: 25 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 9: CRIMSON FOUNDRIES - COLLAPSE PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Passive voice dominates, human staff "optimized", decisions made by unnamed authorities
	{
		id: 'crimson_foundries',
		name: 'Crimson Foundries',
		description:
			'Dense adamantite deposits in thermally unstable substrates. Communications with field teams increasingly irregular.',
		transportRequirements: [['pink', 380]],
		transportPrice: 1350,
		width: [65, 75],
		depth: [220, 240],
		mineralChance: 70,
		itemChance: 1,
		holeChance: 52,
		items: { super_oxygen_liquid_nitrogen: 60, repair_nanites: 25, gravity_charge: 15 },
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [7, 12],
			branchProbability: 0.6,
			maxBranches: 7,
			segmentLength: [12, 18],
			wanderStrength: 0.7,
		},
		spaceco: {
			variant: 1,
			shop: {
				super_oxygen_liquid_nitrogen: [2, 3],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: 1,
				remote_charge: [1, 2],
				spaceco_teleport_station: 1,
				gravity_charge: 1,
				transport_insurance: 1,
			},
			vehicles: ['T10'],
			drills: ['T10'],
			engines: ['T10'],
			parts: ['T7', 'T8'], // Premium parts
		},
		newPlayer: {
			credits: 1200,
			items: { super_oxygen_liquid_nitrogen: 2, repair_nanites: 1 },
			configuration: {
				vehicle: 'T9',
				drill: 'T9',
				engine: 'T9',
			},
		},
		layers: [
			{
				ground: { red: 60, pink: 25, black: 15 },
			},
			{
				ground: { red: 70, black: 30 },
				hazardChance: 50,
				hazards: ['lava', 'gas', 'lava_spitter'],
			},
			{
				ground: { red: 65, black: 35 },
				mineralChance: 80,
				hazardChance: 55,
				hazards: ['lava', 'gas', 'tunnel_chomper', 'lava_spitter', 'earth_mover'],
			},
			{
				ground: { red: 50, black: 50 },
				hazardChance: 60,
				hazards: [
					'lava',
					'psykick_warrior',
					'spawn_mother',
					'lava_spitter',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 55, spawn: { type: 'alien', name: 'psykick_warrior' } },
							{ weight: 30, spawn: { type: 'alien', name: 'lava_spitter' } },
							{ weight: 15, spawn: { type: 'alien', name: 'volatile_lava_spitter', eliteChance: 30 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 10: OBSIDIAN THRONE - SUBJUGATION COMPLETE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Aliens control SpaceCo but maintain corporate structure, passive voice throughout
	{
		id: 'obsidian_throne',
		name: 'Obsidian Throne',
		description:
			'Maximum-density quadium concentrations detected. All previous survey data has been reclassified. Proceed as directed.',
		transportRequirements: [['red', 420]],
		transportPrice: 1750,
		width: [70, 80],
		depth: [240, 280],
		mineralChance: 75,
		itemChance: 1,
		holeChance: 55,
		items: { super_oxygen_liquid_nitrogen: 50, repair_nanites: 30, gravity_charge: 15, void_implosion: 5 },
		hazards: ['lava', 'gas'],
		tunnelSystems: {
			count: [8, 15],
			branchProbability: 0.65,
			maxBranches: 8,
			segmentLength: [15, 22],
			wanderStrength: 0.75,
		},
		spaceco: {
			variant: 2, // Alien-influenced facility
			shop: {
				super_oxygen_liquid_nitrogen: [2, 3],
				repair_nanites: [1, 2],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: [1, 2],
				remote_charge: [1, 2],
				spaceco_teleport_station: 1,
				gravity_charge: [1, 2],
				void_implosion: [0, 1],
				transport_insurance: 1,
			},
			vehicles: ['T11'],
			drills: ['T11'],
			engines: ['T11'],
			parts: ['T8', 'T9'], // Elite parts
		},
		newPlayer: {
			credits: 1500,
			items: { super_oxygen_liquid_nitrogen: 2, repair_nanites: 2 },
			configuration: {
				vehicle: 'T10',
				drill: 'T10',
				engine: 'T10',
			},
		},
		layers: [
			{
				ground: { black: 80, red: 20 },
			},
			{
				ground: { black: 85, red: 15 },
				hazardChance: 55,
				hazards: ['gas', 'depth_guardian', 'void_drifter', 'earth_mover'],
			},
			{
				ground: { black: 90, red: 10 },
				mineralChance: 85,
				hazardChance: 60,
				hazards: ['lava', 'psykick_warrior', 'depth_guardian', 'hive_soldier', 'spawn_mother'],
			},
			{
				ground: { black: 95, red: 5 },
				hazardChance: 65,
				hazards: [
					'gas',
					'spawn_mother',
					'psykick_warrior',
					'lava_spitter',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 65, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 40 } },
							{ weight: 20, spawn: { type: 'alien', name: 'ancient_depth_guardian', eliteChance: 35 } },
							{ weight: 15, spawn: { type: 'alien', name: 'grand_spawn_mother', eliteChance: 30 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LEVEL 11: SACRED FRAGMENTS - PSYKICK REGIME
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Aliens using corporate structure, awkward formal language, priority on egg recovery
	{
		id: 'sacred_fragments',
		name: 'Sacred Fragments',
		description:
			'High-value quantum-resonant mineral deposits identified. Recovery of these specimens is of utmost priority to the Collective.',
		transportRequirements: [['black', 500]],
		transportPrice: 2500,
		width: [75, 90],
		depth: [280, 320],
		mineralChance: 80,
		itemChance: 1,
		holeChance: 45,
		items: { super_oxygen_liquid_nitrogen: 40, psykick_egg: 30, repair_nanites: 20, void_implosion: 10 },
		minerals: { black: 60, purple: 25, blue: 15 }, // Mixed mineral distribution for alien influence
		tunnelSystems: {
			count: [10, 18],
			branchProbability: 0.7,
			maxBranches: 10,
			segmentLength: [18, 25],
			wanderStrength: 0.8,
		},
		spaceco: {
			variant: 2,
			shop: {
				super_oxygen_liquid_nitrogen: [2, 4],
				repair_nanites: [2, 3],
				spaceco_teleporter: [1, 2],
				advanced_teleporter: [1, 2],
				remote_charge: [1, 2],
				spaceco_teleport_station: 1,
				gravity_charge: [1, 2],
				void_implosion: 1,
				transport_insurance: [3, 5],
			},
			vehicles: ['T12'],
			drills: ['T12'],
			engines: ['T12'],
			parts: ['T9', 'T10'], // Top-tier parts
		},
		newPlayer: {
			credits: 1800,
			items: { super_oxygen_liquid_nitrogen: 3, repair_nanites: 2 },
			configuration: {
				vehicle: 'T11',
				drill: 'T11',
				engine: 'T11',
			},
		},
		layers: [
			{
				ground: { black: 70, purple: 20, blue: 10 },
				itemChance: 2,
				hazards: ['psykick_scout', 'gift_bearer'],
			},
			{
				ground: { black: 75, purple: 25 },
				hazardChance: 60,
				itemChance: 0,
				hazards: ['psykick_scout', 'void_drifter', 'hive_drone', 'gift_bearer', 'earth_mover'],
			},
			{
				ground: { black: 80, purple: 20 },
				mineralChance: 90,
				hazardChance: 65,
				itemChance: 5,
				hazards: ['psykick_warrior', 'depth_guardian', 'psykick_scout', 'spawn_mother', 'earth_mover'],
			},
			{
				ground: { black: 85, purple: 15 },
				hazardChance: 70,
				itemChance: 0,
				hazards: [
					'elite_psykick_warrior',
					'depth_guardian',
					'spawn_mother',
					'gift_bearer',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 89, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 50 } },
							{ weight: 10, spawn: { type: 'alien', name: 'ancient_depth_guardian', eliteChance: 45 } },
							{ weight: 1, spawn: { type: 'alien', name: 'master_gift_bearer', eliteChance: 40 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// SIDE LEVEL 3B: FRACTURED PROSPECTS B - SURFACE LIES PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Standard corporate operations with minor instability warnings
	{
		id: 'fractured_prospects_b',
		name: 'Fractured Prospects B',
		description: 'Secondary extraction site with elevated instability markers. Designated as backup operations zone.',
		transportRequirements: [
			['orange', 165],
			['xp', 600],
		],
		transportPrice: 180,
		width: [25, 35],
		depth: [90, 110],
		mineralChance: 50,
		itemChance: 5,
		holeChance: 50,
		items: { oil: 40, repair_nanites: 35, spaceco_teleporter: 20, timed_charge: 5 },
		hazards: ['lava'],
		minerals: { yellow: 40, green: 30, teal: 20, orange: 10 }, // More varied mineral distribution
		tunnelSystems: {
			count: [3, 6],
			branchProbability: 0.4,
			maxBranches: 4,
			segmentLength: [6, 12],
			wanderStrength: 0.6,
		},
		spaceco: {
			variant: 2,
			shop: {
				oil: [4, 6],
				repair_nanites: [2, 4],
				spaceco_teleporter: [2, 3],
				timed_charge: [1, 2],
				transport_insurance: 1,
			},
			vehicles: ['T4'],
			parts: ['T2', 'T3'], // Side level gets good parts selection
		},
		newPlayer: {
			credits: 650,
			items: { oil: 2, repair_nanites: 2 },
			configuration: {
				vehicle: 'T3',
				drill: 'T3',
				engine: 'T3',
			},
		},
		layers: [
			{
				ground: { yellow: 55, orange: 25, green: 15, teal: 5 },
				hazardChance: 30,
			},
			{
				ground: { yellow: 60, green: 25, teal: 15 },
				hazardChance: 40,
				mineralChance: 60,
				hazards: ['lava', 'gas', 'gas_sporecyst', 'gift_bearer'],
			},
			{
				ground: { yellow: 45, green: 35, teal: 20 },
				hazardChance: 55,
				mineralChance: 70,
				hazards: [
					'lava',
					'gas',
					'rock_mite',
					'gas_sporecyst',
					'hive_drone',
					'gift_bearer',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 65, spawn: { type: 'alien', name: 'rock_mite' } },
							{ weight: 25, spawn: { type: 'alien', name: 'gas_sporecyst' } },
							{ weight: 10, spawn: { type: 'hazard', name: 'gas' } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// SIDE LEVEL 7B: UNSTABLE CONFLUENCE B - HIDDEN DEPTHS PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Enhanced protocols, irregular phenomena, bureaucratic caution
	{
		id: 'unstable_confluence_b',
		name: 'Unstable Confluence B',
		description:
			'Volatile secondary site with irregular crystalline formations. Mining operations proceed at contractor discretion.',
		transportRequirements: [
			['blue', 330],
			['xp', 3000],
		],
		transportPrice: 900,
		width: [35, 45],
		depth: [160, 180],
		mineralChance: 60,
		itemChance: 3,
		holeChance: 55,
		items: {
			battery: 30,
			super_oxygen_liquid_nitrogen: 35,
			repair_nanites: 20,
			remote_charge: 10,
			advanced_teleporter: 5,
		},
		hazards: ['lava', 'gas'],
		minerals: { purple: 35, pink: 25, blue: 20, red: 15, white: 5 }, // Out-of-band white minerals showing alien influence
		tunnelSystems: {
			count: [6, 12],
			branchProbability: 0.65,
			maxBranches: 7,
			segmentLength: [10, 18],
			wanderStrength: 0.75,
		},
		spaceco: {
			variant: 0,
			shop: {
				battery: [3, 5],
				super_oxygen_liquid_nitrogen: [2, 3],
				repair_nanites: [2, 4],
				spaceco_teleporter: [2, 3],
				advanced_teleporter: [1, 2],
				remote_charge: [2, 3],
				transport_insurance: 1,
			},
			engines: ['T8'],
			parts: ['T6', 'T7'], // Premium parts for side level
		},
		newPlayer: {
			credits: 1750,
			items: { battery: 2, super_oxygen_liquid_nitrogen: 1, repair_nanites: 2 },
			configuration: {
				vehicle: 'T7',
				drill: 'T7',
				engine: 'T7',
			},
		},
		layers: [
			{
				ground: { purple: 50, blue: 30, pink: 15, red: 5 },
				hazardChance: 45,
			},
			{
				ground: { purple: 55, pink: 30, red: 15 },
				hazardChance: 55,
				mineralChance: 70,
				hazards: ['gas', 'mimic_ore', 'gas_sporecyst', 'hive_soldier', 'psykick_scout', 'earth_mover'],
			},
			{
				ground: { purple: 40, pink: 35, red: 25 },
				hazardChance: 65,
				mineralChance: 80,
				hazards: [
					'lava',
					'psykick_scout',
					'mimic_ore',
					'hive_soldier',
					'void_drifter',
					'earth_mover',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 55, spawn: { type: 'alien', name: 'mimic_ore' } },
							{ weight: 20, spawn: { type: 'alien', name: 'hive_soldier' } },
							{ weight: 15, spawn: { type: 'alien', name: 'enhanced_gas_sporecyst', eliteChance: 35 } },
							{ weight: 10, spawn: { type: 'hazard', name: 'gas' } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// SIDE LEVEL 9B: THERMAL BREACH B - COLLAPSE PHASE
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Administrative optimization language, passive voice, enhanced protocol requirements
	{
		id: 'thermal_breach_b',
		name: 'Thermal Breach B',
		description:
			'High-temperature secondary site with extreme geological instability. Operations authorized despite elevated risk profile.',
		transportRequirements: [
			['pink', 418],
			['xp', 6000],
		],
		transportPrice: 1600,
		width: [40, 50],
		depth: [200, 220],
		mineralChance: 75,
		itemChance: 5,
		holeChance: 60,
		items: { super_oxygen_liquid_nitrogen: 50, repair_nanites: 30, gravity_charge: 15, remote_charge: 5 },
		hazards: ['lava', 'gas'],
		minerals: { red: 50, black: 30, pink: 15, green: 5 }, // Out-of-band green showing disruption
		tunnelSystems: {
			count: [10, 18],
			branchProbability: 0.7,
			maxBranches: 9,
			segmentLength: [14, 22],
			wanderStrength: 0.8,
		},
		spaceco: {
			variant: 1,
			shop: {
				super_oxygen_liquid_nitrogen: [4, 6],
				repair_nanites: [3, 5],
				spaceco_teleporter: [2, 4],
				advanced_teleporter: [2, 3],
				remote_charge: [2, 4],
				spaceco_teleport_station: [1, 2],
				gravity_charge: [1, 2],
				transport_insurance: 1,
			},
			vehicles: ['T10'],
			drills: ['T10'],
			parts: ['T8', 'T9'], // Elite parts
		},
		newPlayer: {
			credits: 2750,
			items: { super_oxygen_liquid_nitrogen: 3, repair_nanites: 2 },
			configuration: {
				vehicle: 'T9',
				drill: 'T9',
				engine: 'T9',
			},
		},
		layers: [
			{
				ground: { red: 50, pink: 30, black: 20 },
				hazardChance: 55,
			},
			{
				ground: { red: 60, black: 40 },
				hazardChance: 65,
				mineralChance: 85,
				hazards: ['lava', 'lava_spitter', 'tunnel_chomper', 'psykick_scout', 'earth_mover'],
			},
			{
				ground: { red: 45, black: 55 },
				hazardChance: 75,
				mineralChance: 90,
				hazards: [
					'lava',
					'psykick_warrior',
					'volatile_lava_spitter',
					'alpha_tunnel_chomper',
					'spawn_mother',
					'earth_mover',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 55, spawn: { type: 'alien', name: 'volatile_lava_spitter', eliteChance: 40 } },
							{ weight: 40, spawn: { type: 'alien', name: 'alpha_tunnel_chomper', eliteChance: 35 } },
							{ weight: 5, spawn: { type: 'alien', name: 'grand_spawn_mother', eliteChance: 30 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// SIDE LEVEL 11B: RESONANCE CHAMBER B - PSYKICK REGIME
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Alien corporate language, harmonic optimization, specimen recovery priority
	{
		id: 'resonance_chamber_b',
		name: 'Resonance Chamber B',
		description:
			'Secondary quantum-mineral site with elevated harmonic signatures. Priority recovery operations for specialized specimens.',
		transportRequirements: [
			['black', 550],
			['xp', 15000],
		],
		transportPrice: 3000,
		width: [50, 65],
		depth: [260, 300],
		mineralChance: 85,
		itemChance: 2,
		holeChance: 50,
		items: { super_oxygen_liquid_nitrogen: 35, psykick_egg: 40, repair_nanites: 20, void_implosion: 5 },
		minerals: { black: 40, purple: 30, teal: 20, yellow: 10 }, // Out-of-band yellow and teal showing alien energy
		tunnelSystems: {
			count: [12, 22],
			branchProbability: 0.75,
			maxBranches: 12,
			segmentLength: [20, 28],
			wanderStrength: 0.85,
		},
		spaceco: {
			variant: 2,
			shop: {
				super_oxygen_liquid_nitrogen: [4, 7],
				repair_nanites: [3, 5],
				spaceco_teleporter: [3, 5],
				advanced_teleporter: [2, 4],
				remote_charge: [2, 4],
				spaceco_teleport_station: [2, 3],
				gravity_charge: [3, 5],
				void_implosion: [2, 3],
				transport_insurance: 1,
			},
			vehicles: ['T13'],
			drills: ['T12', 'T13'],
			engines: ['T12'],
			parts: ['T11', 'T12'], // Alien-tech parts
		},
		newPlayer: {
			credits: 4000,
			items: { super_oxygen_liquid_nitrogen: 4, repair_nanites: 3 },
			configuration: {
				vehicle: 'T11',
				drill: 'T11',
				engine: 'T11',
			},
		},
		layers: [
			{
				ground: { black: 60, purple: 25, blue: 15 },
				itemChance: 28,
				hazardChance: 60,
				hazards: ['psykick_scout', 'hive_drone', 'gift_bearer', 'earth_mover'],
			},
			{
				ground: { black: 70, purple: 30 },
				hazardChance: 70,
				itemChance: 32,
				mineralChance: 90,
				hazards: ['psykick_scout', 'void_drifter', 'depth_guardian', 'gift_bearer', 'spawn_mother'],
			},
			{
				ground: { black: 80, purple: 20 },
				hazardChance: 80,
				itemChance: 35,
				mineralChance: 95,
				hazards: [
					'elite_psykick_warrior',
					'ancient_depth_guardian',
					'psykick_warrior',
					'psykick_scout',
					'spawn_mother',
					'gift_bearer',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 60, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 60 } },
							{ weight: 35, spawn: { type: 'alien', name: 'ancient_depth_guardian', eliteChance: 55 } },
							{ weight: 5, spawn: { type: 'alien', name: 'master_gift_bearer', eliteChance: 50 } },
						],
					},
				],
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// SIDE LEVEL 11C: VOID SANCTUM B - PSYKICK REGIME
	// ═══════════════════════════════════════════════════════════════════════════
	// NARRATIVE STATE: Peak alien corporate mimicry, universal harmony language, specimen recovery obsession
	{
		id: 'void_sanctum_b',
		name: 'Void Sanctum B',
		description:
			'Tertiary quantum-mineral extraction zone with maximum resonance density. The Collective requires complete specimen recovery.',
		transportRequirements: [
			['black', 625],
			['xp', 20000],
		],
		transportPrice: 3500,
		width: [45, 60],
		depth: [280, 320],
		mineralChance: 90,
		itemChance: 2,
		holeChance: 55,
		items: { super_oxygen_liquid_nitrogen: 30, psykick_egg: 50, repair_nanites: 15, void_implosion: 5 },
		minerals: { black: 35, purple: 25, blue: 20, teal: 15, white: 5 }, // Extreme out-of-band minerals showing alien reality warping
		tunnelSystems: {
			count: [15, 25],
			branchProbability: 0.8,
			maxBranches: 15,
			segmentLength: [22, 30],
			wanderStrength: 0.9,
		},
		spaceco: {
			variant: 2,
			shop: {
				super_oxygen_liquid_nitrogen: [4, 8],
				repair_nanites: [4, 6],
				spaceco_teleporter: [3, 6],
				advanced_teleporter: [3, 5],
				remote_charge: [3, 5],
				spaceco_teleport_station: [2, 4],
				gravity_charge: [3, 6],
				void_implosion: [2, 4],
				transport_insurance: 1,
			},
			vehicles: ['T14'],
			drills: ['T13'],
			engines: ['T12'],
			parts: ['T13', 'T14', 'T15', 'T16'], // Ultimate alien-tech parts
		},
		newPlayer: {
			credits: 4500,
			items: { super_oxygen_liquid_nitrogen: 5, repair_nanites: 4 },
			configuration: {
				vehicle: 'T12',
				drill: 'T11',
				engine: 'T11',
			},
		},
		layers: [
			{
				ground: { black: 55, purple: 30, teal: 15 },
				hazardChance: 65,
				hazards: ['psykick_scout', 'hive_drone', 'void_drifter', 'gift_bearer', 'earth_mover'],
			},
			{
				ground: { black: 70, purple: 30 },
				hazardChance: 75,
				itemChance: 5,
				mineralChance: 95,
				hazards: ['psykick_scout', 'psykick_warrior', 'depth_guardian', 'gift_bearer', 'spawn_mother'],
			},
			{
				ground: { black: 85, purple: 15 },
				hazardChance: 85,
				itemChance: 0,
				mineralChance: 98,
				hazards: [
					'spawn_mother',
					'ancient_depth_guardian',
					'elite_psykick_warrior',
					'psykick_scout',
					'gift_bearer',
					'earth_mover',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 20, spawn: { type: 'alien', name: 'spawn_mother' } },
							{ weight: 70, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 70 } },
							{ weight: 9, spawn: { type: 'alien', name: 'master_gift_bearer', eliteChance: 65 } },
							{ weight: 1, spawn: { type: 'item', name: 'psykick_egg' } },
						],
					},
				],
			},
		],
	},

	// DEVELOPER_WORLDS
	{
		id: 'sandbox_paradise',
		name: 'Sandbox Paradise',
		description: 'Complete testing environment with all game mechanics, aliens, items, and minerals available.',
		transportRequirements: [], // No requirements - immediate access
		transportPrice: 1,
		width: 60,
		depth: 100,
		mineralChance: 80, // Very high mineral spawn
		itemChance: 25, // Very high item spawn
		holeChance: 35,
		items: {
			// All items with good distribution
			oil: 15,
			battery: 15,
			super_oxygen_liquid_nitrogen: 15,
			spaceco_teleporter: 10,
			advanced_teleporter: 8,
			repair_nanites: 10,
			timed_charge: 8,
			remote_charge: 8,
			gravity_charge: 5,
			void_implosion: 3,
			spaceco_teleport_station: 2,
			psykick_egg: 1,
		},
		hazards: {
			// All alien types with reasonable distribution
			psykick_scout: 8,
			psykick_warrior: 6,
			rock_mite: 10,
			tunnel_chomper: 6,
			lava_spitter: 5,
			void_drifter: 8,
			depth_guardian: 4,
			hive_drone: 8,
			hive_soldier: 5,
			gas_sporecyst: 6,
			mimic_ore: 4,
			spawn_mother: 2,
			gift_bearer: 6,
			earth_mover: 6,
			resource_seeker: 5,
			elite_psykick_warrior: 3,
			ancient_depth_guardian: 2,
			alpha_tunnel_chomper: 3,
			volatile_lava_spitter: 3,
			enhanced_gas_sporecyst: 3,
			grand_spawn_mother: 1,
			master_gift_bearer: 2,
			// Environmental hazards
			lava: 10,
			gas: 10,
		},
		tunnelSystems: {
			count: [8, 12],
			branchProbability: 0.6,
			maxBranches: 6,
			segmentLength: [5, 15],
			wanderStrength: 0.7,
		},
		spaceco: {
			variant: 2, // Alien-influenced facility
			shop: {
				oil: [5, 8],
				battery: [4, 6],
				super_oxygen_liquid_nitrogen: [3, 5],
				spaceco_teleporter: [3, 5],
				advanced_teleporter: [2, 4],
				repair_nanites: [4, 6],
				timed_charge: [3, 5],
				remote_charge: [3, 5],
				gravity_charge: [2, 4],
				void_implosion: [1, 3],
				spaceco_teleport_station: [1, 2],
				transport_insurance: 5,
			},
			vehicles: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14'], // Almost all vehicles
			drills: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13'], // Almost all drills
			engines: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'], // Almost all engines
			parts: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16'], // All parts
		},
		newPlayer: {
			credits: 5000, // Lots of starting credits
			items: {
				oil: 3,
				battery: 2,
				super_oxygen_liquid_nitrogen: 2,
				repair_nanites: 3,
				spaceco_teleporter: 2,
				advanced_teleporter: 1,
				timed_charge: 2,
				remote_charge: 2,
				transport_insurance: 2,
			},
			configuration: {
				vehicle: 'T3',
				drill: 'T3',
				engine: 'T3',
			},
		},
		layers: [
			{
				// Surface layer - all easy minerals
				ground: { white: 30, orange: 25, yellow: 25, green: 15, teal: 5 },
				hazardChance: 20,
				hazards: ['rock_mite', 'psykick_scout', 'gift_bearer'],
			},
			{
				// Mid layer - mixed difficulty
				ground: { yellow: 25, green: 20, teal: 20, blue: 15, purple: 15, pink: 5 },
				hazardChance: 35,
				mineralChance: 85,
				hazards: [
					'psykick_scout',
					'tunnel_chomper',
					'void_drifter',
					'hive_drone',
					'gas_sporecyst',
					'lava_spitter',
					'earth_mover',
					'gift_bearer',
					'lava',
					'gas',
				],
			},
			{
				// Deep layer - all minerals including rare ones
				ground: { purple: 20, pink: 20, red: 25, black: 35 },
				hazardChance: 50,
				mineralChance: 90,
				itemChance: 30,
				hazards: [
					'psykick_warrior',
					'depth_guardian',
					'spawn_mother',
					'mimic_ore',
					'resource_seeker',
					'volatile_lava_spitter',
					'enhanced_gas_sporecyst',
					'elite_psykick_warrior',
					'ancient_depth_guardian',
					'master_gift_bearer',
					'lava',
					'gas',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 40, spawn: { type: 'alien', name: 'elite_psykick_warrior', eliteChance: 50 } },
							{ weight: 30, spawn: { type: 'alien', name: 'ancient_depth_guardian', eliteChance: 40 } },
							{ weight: 20, spawn: { type: 'item', name: 'psykick_egg' } },
							{ weight: 10, spawn: { type: 'alien', name: 'master_gift_bearer', eliteChance: 30 } },
						],
					},
				],
			},
		],
	},
	{
		id: 'rapid_prototyping_zone',
		name: 'Rapid Prototyping Zone',
		description: 'Compact test environment for quick iteration and debugging of specific mechanics.',
		transportRequirements: [],
		transportPrice: 1,
		width: 30,
		depth: 60, // Smaller for faster testing
		mineralChance: 95, // Almost guaranteed minerals
		itemChance: 40, // Very high item spawn
		holeChance: 50, // Lots of open space for movement testing
		items: 'random', // Will distribute all items randomly
		hazards: 'random', // Will include all hazard types randomly
		tunnelSystems: {
			count: [4, 6],
			branchProbability: 0.8,
			maxBranches: 8,
			segmentLength: [3, 10],
			wanderStrength: 0.9,
		},
		spaceco: {
			variant: [0, 2], // Random variant each time
			shop: {
				oil: 10,
				battery: 8,
				super_oxygen_liquid_nitrogen: 6,
				spaceco_teleporter: 5,
				advanced_teleporter: 4,
				repair_nanites: 8,
				timed_charge: 5,
				remote_charge: 5,
				gravity_charge: 4,
				void_implosion: 3,
				spaceco_teleport_station: 2,
				transport_insurance: 10,
			},
			vehicles: 'random', // Will randomly select from all vehicles
			drills: 'random', // Will randomly select from all drills
			engines: 'random', // Will randomly select from all engines
			parts: 'random', // Will randomly select from all parts
		},
		newPlayer: {
			credits: 10000, // Tons of credits for rapid testing
			items: {
				oil: 5,
				battery: 5,
				super_oxygen_liquid_nitrogen: 5,
				repair_nanites: 5,
				spaceco_teleporter: 3,
				advanced_teleporter: 2,
				timed_charge: 3,
				remote_charge: 3,
				gravity_charge: 2,
				void_implosion: 1,
				transport_insurance: 5,
			},
			configuration: {
				vehicle: 'T5', // Mid-tier starting equipment
				drill: 'T5',
				engine: 'T5',
				part: 'T3', // Include a starting part
			},
		},
		layers: [
			{
				// Everything mixed together for chaos testing
				ground: {
					white: 10,
					orange: 10,
					yellow: 10,
					green: 10,
					teal: 10,
					blue: 10,
					purple: 10,
					pink: 10,
					red: 10,
					black: 10,
				},
				hazardChance: 60,
				mineralChance: 95,
				itemChance: 50,
				hazards: [
					// Include everything with mystery spawners for unpredictability
					'psykick_scout',
					'psykick_warrior',
					'elite_psykick_warrior',
					'rock_mite',
					'tunnel_chomper',
					'alpha_tunnel_chomper',
					'lava_spitter',
					'volatile_lava_spitter',
					'void_drifter',
					'depth_guardian',
					'ancient_depth_guardian',
					'hive_drone',
					'hive_soldier',
					'gas_sporecyst',
					'enhanced_gas_sporecyst',
					'mimic_ore',
					'spawn_mother',
					'grand_spawn_mother',
					'gift_bearer',
					'master_gift_bearer',
					'earth_mover',
					'resource_seeker',
					'lava',
					'gas',
					{
						type: 'mystery_spawner',
						spawnTable: [
							{ weight: 25, spawn: { type: 'alien', name: 'grand_spawn_mother', eliteChance: 60 } },
							{ weight: 25, spawn: { type: 'item', name: 'psykick_egg' } },
							{ weight: 25, spawn: { type: 'hazard', name: 'lava' } },
							{ weight: 25, spawn: { type: 'alien', name: 'master_gift_bearer', eliteChance: 50 } },
						],
					},
				],
			},
		],
	},

	{
		id: 'test001',
		name: 'Test 001',
		description: 'Development testing environment with balanced mineral distribution and standard hazard patterns.',
		transportRequirements: [],
		transportPrice: 0,
		width: [25, 35],
		depth: [60, 80],
		mineralChance: 50,
		itemChance: 50,
		holeChance: 50,
		items: 'random',
		tunnelSystems: {
			count: [1, 2],
			branchProbability: 0.2,
			maxBranches: 2,
			segmentLength: [3, 6],
			wanderStrength: 0.3,
		},
		spaceco: {
			variant: [0, 2], // Random variant each time
			shop: {
				oil: 10,
				battery: 8,
				super_oxygen_liquid_nitrogen: 6,
				spaceco_teleporter: 5,
				advanced_teleporter: 4,
				repair_nanites: 8,
				timed_charge: 5,
				remote_charge: 5,
				gravity_charge: 4,
				void_implosion: 3,
				spaceco_teleport_station: 2,
				transport_insurance: 10,
			},
			vehicles: ['T10'],
			drills: ['T10'],
			engines: ['T10'],
			parts: ['T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16'],
		},
		newPlayer: {
			credits: 9999999,
			items: { oil: 1 },
			configuration: {
				vehicle: 'T9',
				drill: 'T9',
				engine: 'T9',
			},
		},
		layers: [
			{
				ground: { white: 80, orange: 10, yellow: 5, black: 5 },
			},
		],
	},
];
