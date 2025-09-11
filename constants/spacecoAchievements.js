export const spacecoAchievements = [
	// -------------------
	// RECRUITMENT & WORKFORCE
	// -------------------
	{
		id: 'first_recruit',
		category: 'Recruitment',
		name: 'First Recruit',
		summary: 'Reach 2 active contractors on the operation.',
		flavor: 'From solo venture to team operation. Workforce expansion initiated.',
		difficulty: 1, // Easy - requires another player joining
		trigger: {
			type: 'addPlayer',
			check: ({ world }) => {
				const count = Array.isArray(world.players) ? world.players.length : Object.keys(world.players || {}).length;
				return count >= 2;
			},
		},
		awards: [['xp', 50]],
	},
	{
		id: 'recruitment_drive',
		category: 'Recruitment',
		name: 'Recruitment Drive',
		summary: 'Reach 3 active contractors on the operation.',
		flavor: 'Team expansion underway. Increased workforce means increased extraction capacity.',
		difficulty: 2, // Easy-Medium - requires coordinating multiple players
		trigger: {
			type: 'addPlayer',
			check: ({ world }) => {
				const count = Array.isArray(world.players) ? world.players.length : Object.keys(world.players || {}).length;
				return count >= 3;
			},
		},
		awards: [['xp', 75]],
	},
	{
		id: 'operational_scale',
		category: 'Recruitment',
		name: 'Operational Scale',
		summary: 'Reach 5 active contractors on the operation.',
		flavor: 'Full operational scale achieved. Safety margins decrease as profits rise.',
		difficulty: 3, // Medium - requires significant player coordination
		trigger: {
			type: 'addPlayer',
			check: ({ world }) => {
				const count = Array.isArray(world.players) ? world.players.length : Object.keys(world.players || {}).length;
				return count >= 5;
			},
		},
		awards: [['xp', 125]],
	},
	{
		id: 'industrial_operation',
		category: 'Recruitment',
		name: 'Industrial Operation',
		summary: 'Reach 8 active contractors on the operation.',
		flavor: 'Industrial-scale workforce deployed. The Deep Belt Initiative reaches critical mass.',
		difficulty: 4, // Hard - requires large-scale multiplayer coordination
		trigger: {
			type: 'addPlayer',
			check: ({ world }) => {
				const count = Array.isArray(world.players) ? world.players.length : Object.keys(world.players || {}).length;
				return count >= 8;
			},
		},
		awards: [['xp', 200]],
	},
	{
		id: 'corporate_army',
		category: 'Recruitment',
		name: 'Corporate Army',
		summary: 'Reach 12 active contractors on the operation.',
		flavor: 'Maximum workforce deployment achieved. The Belt operates on SpaceCo schedules.',
		difficulty: 5, // Very Hard - maximum player coordination required
		trigger: {
			type: 'addPlayer',
			check: ({ world }) => {
				const count = Array.isArray(world.players) ? world.players.length : Object.keys(world.players || {}).length;
				return count >= 12;
			},
		},
		awards: [['xp', 300]],
	},

	// -------------------
	// COMMERCE MILESTONES
	// -------------------
	{
		id: 'commerce_launch',
		category: 'Commerce',
		name: 'Commerce Initialized',
		summary: 'Complete 25 item sales from depot inventory.',
		flavor: 'Retail operations online. Contractor supply chain established.',
		difficulty: 1, // Easy - happens naturally with normal play
		trigger: { type: 'spacecoBuyItem', check: ({ world }) => world.spaceco.stats.itemsSold >= 25 },
		awards: [['xp', 100]],
	},
	{
		id: 'supply_chain_active',
		category: 'Commerce',
		name: 'Supply Chain Active',
		summary: 'Complete 100 item sales from depot inventory.',
		flavor: 'Full supply chain operational. Inventory turnover exceeds projections.',
		difficulty: 2, // Easy-Medium - requires sustained player activity
		trigger: { type: 'spacecoBuyItem', check: ({ world }) => world.spaceco.stats.itemsSold >= 100 },
		awards: [['xp', 200]],
	},
	{
		id: 'retail_dominance',
		category: 'Commerce',
		name: 'Retail Dominance',
		summary: 'Complete 500 item sales from depot inventory.',
		flavor: 'Retail dominance achieved. Contractors completely dependent on SpaceCo supply lines.',
		difficulty: 4, // Hard - requires extensive long-term play
		trigger: { type: 'spacecoBuyItem', check: ({ world }) => world.spaceco.stats.itemsSold >= 500 },
		awards: [['xp', 400]],
	},
	{
		id: 'premium_transaction',
		category: 'Commerce',
		name: 'Premium Transaction',
		summary: 'Complete a single mineral transaction worth 2,000 credits or more.',
		flavor: 'High-value extraction confirmed. Executive bonuses triggered.',
		difficulty: 3, // Medium - requires finding valuable minerals and efficient extraction
		trigger: { type: 'spacecoSell', check: ({ event }) => event?.gain >= 2000 },
		awards: [['xp', 150]],
	},
	{
		id: 'mega_transaction',
		category: 'Commerce',
		name: 'Mega Transaction',
		summary: 'Complete a single mineral transaction worth 5,000 credits or more.',
		flavor: 'Record-breaking single transaction logged. Shareholder satisfaction: maximum.',
		difficulty: 4, // Hard - requires high-tier minerals and optimal extraction
		trigger: { type: 'spacecoSell', check: ({ event }) => event.gain >= 5000 },
		awards: [['xp', 300]],
	},

	// -------------------
	// COMPANY OPERATIONAL MILESTONES
	// -------------------
	{
		id: 'startup_profits',
		category: 'Operations',
		name: 'Startup Profits',
		summary: 'Reach 5,000 credits in total mineral revenue.',
		flavor: 'Initial profit targets achieved. Deep Belt Initiative proves viable.',
		difficulty: 1, // Easy - natural progression milestone
		trigger: { type: 'spacecoSell', check: ({ world }) => world.spaceco.stats.creditsEarned >= 5000 },
		awards: [['xp', 150]],
	},
	{
		id: 'established_operation',
		category: 'Operations',
		name: 'Established Operation',
		summary: 'Reach 25,000 credits in total mineral revenue.',
		flavor: 'Established operation status confirmed. Market position: dominant.',
		difficulty: 2, // Easy-Medium - requires sustained play
		trigger: { type: 'spacecoSell', check: ({ world }) => world.spaceco.stats.creditsEarned >= 25000 },
		awards: [['xp', 300]],
	},
	{
		id: 'corporate_powerhouse',
		category: 'Operations',
		name: 'Corporate Powerhouse',
		summary: 'Reach 100,000 credits in total mineral revenue.',
		flavor: 'Corporate powerhouse status achieved. Competitors eliminated or absorbed.',
		difficulty: 3, // Medium - significant progression required
		trigger: { type: 'spacecoSell', check: ({ world }) => world.spaceco.stats.creditsEarned >= 100000 },
		awards: [['xp', 600]],
	},
	{
		id: 'belt_monopoly',
		category: 'Operations',
		name: 'Belt Monopoly',
		summary: 'Reach 500,000 credits in total mineral revenue.',
		flavor: 'Belt-wide monopoly established. All mineral flow controlled by SpaceCo systems.',
		difficulty: 4, // Hard - massive revenue requirement
		trigger: { type: 'spacecoSell', check: ({ world }) => world.spaceco.stats.creditsEarned >= 500000 },
		awards: [['xp', 1200]],
	},
	{
		id: 'galactic_conglomerate',
		category: 'Operations',
		name: 'Galactic Conglomerate',
		summary: 'Reach 1,000,000 credits in total mineral revenue.',
		flavor: 'Galactic conglomerate status achieved. SpaceCo influence extends across star systems.',
		difficulty: 5, // Very Hard - ultimate revenue milestone
		trigger: { type: 'spacecoSell', check: ({ world }) => world.spaceco.stats.creditsEarned >= 1000000 },
		awards: [['xp', 2000]],
	},

	// -------------------
	// FLEET MODERNIZATION
	// -------------------
	{
		id: 'oil_fleet',
		category: 'Fleet Modernization',
		name: 'Oil Fleet Established',
		summary: 'Sell 10 oil-powered engines to contractors.',
		flavor: 'Basic propulsion fleet deployed. Combustion technology proves reliable.',
		difficulty: 2, // Easy-Medium - requires player activity and progression
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ world }) => {
				// Count T1-T4 engine sales
				const oilEnginesSold = ['T1', 'T2', 'T3', 'T4'].reduce((count, tier) => {
					return count + (world.spaceco.stats.upgradesSoldByType?.[`engine_${tier}`] || 0);
				}, 0);
				return oilEnginesSold >= 10;
			},
		},
		awards: [['xp', 120]],
	},
	{
		id: 'battery_transition',
		category: 'Fleet Modernization',
		name: 'Clean Energy Transition',
		summary: 'Sell 15 battery-powered engines to contractors.',
		flavor: 'Fleet modernization to clean energy systems proceeding ahead of schedule.',
		difficulty: 3, // Medium - requires mid-tier progression and resources
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ world }) => {
				// Count T5-T8 engine sales
				const batteryEnginesSold = ['T5', 'T6', 'T7', 'T8'].reduce((count, tier) => {
					return count + (world.spaceco.stats.upgradesSoldByType?.[`engine_${tier}`] || 0);
				}, 0);
				return batteryEnginesSold >= 15;
			},
		},
		awards: [['xp', 200]],
	},
	{
		id: 'soln_adoption',
		category: 'Fleet Modernization',
		name: 'SOLN Technology Adoption',
		summary: 'Sell 20 SOLN-powered engines to contractors.',
		flavor: 'Advanced cryogenic propulsion systems achieve market penetration. Technology proves highly effective.',
		difficulty: 4, // Hard - requires high-tier technology access
		hidden: true, // Hints at mysterious technology effectiveness
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ world }) => {
				// Count T9-T12 engine sales
				const solnEnginesSold = ['T9', 'T10', 'T11', 'T12'].reduce((count, tier) => {
					return count + (world.spaceco.stats.upgradesSoldByType?.[`engine_${tier}`] || 0);
				}, 0);
				return solnEnginesSold >= 20;
			},
		},
		awards: [['xp', 300]],
	},
	{
		id: 'advanced_fleet',
		category: 'Fleet Modernization',
		name: 'Advanced Fleet Deployment',
		summary: 'Sell 50 Tier 8+ upgrades across all categories.',
		flavor: 'Elite-grade equipment deployment confirmed. Contractor capabilities: maximized.',
		difficulty: 4, // Hard - requires extensive high-tier equipment sales
		hidden: true, // Spoils high-tier equipment existence
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ world }) => {
				const advancedUpgrades = ['T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14'].reduce((count, tier) => {
					return (
						count +
						['vehicle', 'drill', 'engine', 'part'].reduce((typeCount, type) => {
							return typeCount + (world.spaceco.stats.upgradesSoldByType?.[`${type}_${tier}`] || 0);
						}, 0)
					);
				}, 0);
				return advancedUpgrades >= 50;
			},
		},
		awards: [['xp', 400]],
	},
	{
		id: 'alien_tech_integration',
		category: 'Fleet Modernization',
		name: 'Unconventional Technology Integration',
		summary: 'Sell 25 alien-influenced upgrades (Tier 11+).',
		flavor: 'Advanced technology systems of highly unconventional origin achieve widespread deployment.',
		difficulty: 5, // Very Hard - endgame alien technology with story significance
		hidden: true, // Major story spoiler about alien technology
		trigger: {
			type: 'spacecoBuyUpgrade',
			check: ({ world }) => {
				const alienTechSold = ['T11', 'T12', 'T13', 'T14'].reduce((count, tier) => {
					return (
						count +
						['vehicle', 'drill', 'engine', 'part'].reduce((typeCount, type) => {
							return typeCount + (world.spaceco.stats.upgradesSoldByType?.[`${type}_${tier}`] || 0);
						}, 0)
					);
				}, 0);
				return alienTechSold >= 25;
			},
		},
		awards: [['xp', 500]],
	},

	// -------------------
	// OPERATIONS & SERVICES
	// -------------------
	{
		id: 'fuel_depot',
		category: 'Operations',
		name: 'Fuel Depot Operational',
		summary: 'Sell 200 total units of fuel to contractors.',
		flavor: 'Fuel distribution network operational. Contractor mobility: SpaceCo dependent.',
		difficulty: 2, // Easy-Medium - requires player refueling activity
		trigger: { type: 'spacecoRefuel', check: ({ world }) => world.spaceco.stats.fuelSold >= 200 },
		awards: [['xp', 150]],
	},
	{
		id: 'maintenance_division',
		category: 'Operations',
		name: 'Maintenance Division',
		summary: 'Perform 100 total repairs on contractor rigs.',
		flavor: 'Maintenance division operational. Contractor downtime minimized.',
		difficulty: 2, // Easy-Medium - requires players taking damage and repairing
		trigger: { type: 'spacecoRepair', check: ({ world }) => world.spaceco.stats.repairsSold >= 100 },
		awards: [['xp', 180]],
	},
	{
		id: 'service_excellence',
		category: 'Operations',
		name: 'Service Excellence',
		summary: 'Perform 500 total repairs on contractor rigs.',
		flavor: 'Service excellence standard achieved. Contractor satisfaction: optimal.',
		difficulty: 3, // Medium - requires extensive repair activity
		trigger: { type: 'spacecoRepair', check: ({ world }) => world.spaceco.stats.repairsSold >= 500 },
		awards: [['xp', 400]],
	},
	{
		id: 'logistics_command',
		category: 'Operations',
		name: 'Logistics Command',
		summary: 'Complete 25 successful inter-asteroid transports.',
		flavor: 'Logistics command operational. Belt-wide mobility under SpaceCo control.',
		difficulty: 2, // Easy-Medium - requires transport usage
		trigger: { type: 'spacecoBuyTransport', check: ({ world }) => world.spaceco.stats.transportsCompleted >= 25 },
		awards: [['xp', 250]],
	},
	{
		id: 'transport_monopoly',
		category: 'Operations',
		name: 'Transport Monopoly',
		summary: 'Complete 100 successful inter-asteroid transports.',
		flavor: 'Transport monopoly achieved. All Belt movement requires SpaceCo authorization.',
		difficulty: 3, // Medium - requires extensive transport usage
		trigger: { type: 'spacecoBuyTransport', check: ({ world }) => world.spaceco.stats.transportsCompleted >= 100 },
		awards: [['xp', 500]],
	},

	// -------------------
	// LEVEL PROGRESSION
	// -------------------
	{
		id: 'belt_expansion_tier_1',
		category: 'Progression',
		name: 'Belt Expansion: Surface Operations',
		summary: 'Unlock transport access to Levels 2-3.',
		flavor: 'Surface extraction zones operational. Shallow belt exploitation authorized.',
		difficulty: 1, // Easy - early progression milestone
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => {
				const level2 = (world.spaceco.hull.white || 0) >= 120;
				const level3 = (world.spaceco.hull.orange || 0) >= 150;
				return level2 && level3;
			},
		},
		awards: [['xp', 200]],
	},
	{
		id: 'belt_expansion_tier_2',
		category: 'Progression',
		name: 'Belt Expansion: Mid-Tier Operations',
		summary: 'Unlock transport access to Levels 4-6.',
		flavor: 'Mid-tier extraction zones authorized. Volatile substrate operations commence.',
		difficulty: 2, // Easy-Medium - mid-tier progression
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => {
				const level4 = (world.spaceco.hull.yellow || 0) >= 180;
				const level5 = (world.spaceco.hull.green || 0) >= 220;
				const level6 = (world.spaceco.hull.teal || 0) >= 260;
				return level4 && level5 && level6;
			},
		},
		awards: [['xp', 400]],
	},
	{
		id: 'belt_expansion_tier_3',
		category: 'Progression',
		name: 'Belt Expansion: Deep Operations',
		summary: 'Unlock transport access to Levels 7-9.',
		flavor: 'Deep extraction zones cleared. Anomalous readings are expected.',
		difficulty: 3, // Medium - significant progression requirement
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => {
				const level7 = (world.spaceco.hull.blue || 0) >= 300;
				const level8 = (world.spaceco.hull.purple || 0) >= 340;
				const level9 = (world.spaceco.hull.pink || 0) >= 380;
				return level7 && level8 && level9;
			},
		},
		awards: [['xp', 600]],
	},
	{
		id: 'belt_expansion_tier_4',
		category: 'Progression',
		name: 'Belt Expansion: Maximum Extraction',
		summary: 'Unlock transport access to Levels 10-11.',
		flavor: 'Maximum extraction zones accessible. All systems proceed as directed.',
		difficulty: 4, // Hard - requires extensive endgame mineral collection
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => {
				const level10 = (world.spaceco.hull.red || 0) >= 420;
				const level11 = (world.spaceco.hull.black || 0) >= 500;
				return level10 && level11;
			},
		},
		awards: [['xp', 800]],
	},

	// -------------------
	// EXTRACTION ACHIEVEMENTS
	// -------------------
	{
		id: 'mineral_portfolio',
		category: 'Extraction',
		name: 'Diversified Mineral Portfolio',
		summary: 'Collect all 10 mineral types.',
		flavor: 'Complete mineral classification achieved. Market dominance across all deposit types.',
		difficulty: 3, // Medium - requires visiting different worlds/depths
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => {
				const mineralTypes = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];
				return mineralTypes.every(type => (world.spaceco.hull[type] || 0) > 0);
			},
		},
		awards: [['xp', 400]],
	},
	{
		id: 'total_extraction',
		category: 'Extraction',
		name: 'Maximum Yield Protocol',
		summary: 'Achieve complete mineral extraction from an asteroid before departure.',
		flavor: 'Maximum yield extraction protocol successful. Zero waste tolerance achieved.',
		difficulty: 4, // Hard - requires completionist mindset and thorough exploration
		hidden: true, // Reveals completionist achievement mechanic
		trigger: {
			type: 'spacecoBuyTransport',
			check: ({ world }) =>
				!world.grid.some(row => row.some(cell => cell.items?.some(item => item.name.startsWith('mineral')))),
		},
		awards: [['xp', 300]],
	},

	// -------------------
	// QUANTUM SPECIMEN COLLECTION (EGG HUNT)
	// -------------------
	{
		id: 'first_specimen',
		category: 'Quantum Specimens',
		name: 'First Quantum Specimen',
		summary: 'Collect 1 quantum-resonant mineral specimen.',
		flavor: 'Initial quantum specimen secured. The Collective notes satisfactory progress.',
		difficulty: 5, // Very Hard - rare endgame items with story significance
		hidden: true, // Major story spoiler - reveals alien control and specimen importance
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => (world.spaceco.hull.psykick_egg || 0) >= 1,
		},
		awards: [['xp', 200]],
	},
	{
		id: 'specimen_cache',
		category: 'Quantum Specimens',
		name: 'Specimen Cache',
		summary: 'Collect 5 quantum-resonant mineral specimens.',
		flavor: 'Specimen cache established. Resonance harmonics improving.',
		difficulty: 5, // Very Hard - extremely rare endgame collectibles
		hidden: true, // Story spoiler
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => (world.spaceco.hull.psykick_egg || 0) >= 5,
		},
		awards: [['xp', 400]],
	},
	{
		id: 'specimen_collection',
		category: 'Quantum Specimens',
		name: 'Specimen Collection',
		summary: 'Collect 15 quantum-resonant mineral specimens.',
		flavor: 'Substantial specimen collection achieved. Harmonic resonance patterns stabilizing.',
		difficulty: 5, // Very Hard - massive commitment to rare item collection
		hidden: true, // Story spoiler
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => (world.spaceco.hull.psykick_egg || 0) >= 15,
		},
		awards: [['xp', 600]],
	},
	{
		id: 'specimen_archive',
		category: 'Quantum Specimens',
		name: 'Specimen Archive',
		summary: 'Collect 35 quantum-resonant mineral specimens.',
		flavor: 'Archive-level specimen collection completed. The Collective expresses deep satisfaction.',
		difficulty: 5, // Very Hard - extreme dedication to rare collection
		hidden: true, // Story spoiler
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => (world.spaceco.hull.psykick_egg || 0) >= 35,
		},
		awards: [['xp', 800]],
	},
	{
		id: 'specimen_repository',
		category: 'Quantum Specimens',
		name: 'Specimen Repository',
		summary: 'Collect 75 quantum-resonant mineral specimens.',
		flavor: 'Major specimen repository established. Quantum harmonics approaching optimal resonance.',
		difficulty: 5, // Very Hard - near-impossible dedication required
		hidden: true, // Story spoiler
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => (world.spaceco.hull.psykick_egg || 0) >= 75,
		},
		awards: [['xp', 1200]],
	},
	{
		id: 'specimen_completion',
		category: 'Quantum Specimens',
		name: 'Sacred Reunification',
		summary: 'Collect 150 quantum-resonant mineral specimens.',
		flavor: 'Sacred reunification protocol achieved.',
		difficulty: 5, // Very Hard - ultimate endgame achievement
		hidden: true, // Ultimate story spoiler - reveals sacred nature and completion
		trigger: {
			type: 'spacecoSell',
			check: ({ world }) => (world.spaceco.hull.psykick_egg || 0) >= 150,
		},
		awards: [['xp', 2000]],
	},

	// -------------------
	// INCIDENTS
	// -------------------
	{
		id: 'facility_damaged',
		category: 'Incidents',
		name: 'Facility Incident',
		summary: 'Sustain structural damage at a SpaceCo facility.',
		flavor: 'Facility incident logged. Structural integrity compromised. Repairs authorized.',
		difficulty: 2, // Easy-Medium - requires specific accident
		hidden: true, // Reveals facility vulnerability mechanic
		trigger: { type: 'spacecoFall', check: () => true },
		awards: [['xp', 50]],
	},
	{
		id: 'facility_restored',
		category: 'Incidents',
		name: 'Facility Restoration',
		summary: 'Repair a damaged SpaceCo outpost using automated protocols.',
		flavor: 'Facility restoration complete. Operational status: restored.',
		difficulty: 2, // Easy-Medium - requires damaging and then repairing facility
		hidden: true, // Reveals repair mechanics
		trigger: { type: 'spacecoRepair', check: ({ event }) => event?.type === 'outpost' },
		awards: [['xp', 75]],
	},

	// -------------------
	// CORPORATE GROWTH TIERS (No XP to avoid loops)
	// -------------------
	{
		id: 'gms_startup',
		category: 'Corporate Growth',
		name: 'Startup Phase',
		summary: 'Reach 1,000 Galactic Market Share points.',
		flavor: 'Startup phase complete. Deep Belt Initiative proves market viable.',
		difficulty: 1, // Easy - early milestone
		trigger: { type: 'spacecoXp', check: ({ world }) => world.spaceco.xp >= 1000 },
	},
	{
		id: 'gms_regional',
		category: 'Corporate Growth',
		name: 'Regional Authority',
		summary: 'Reach 5,000 Galactic Market Share points.',
		flavor: 'Regional authority established. Competitors neutralized or absorbed.',
		difficulty: 2, // Easy-Medium - moderate progression
		trigger: { type: 'spacecoXp', check: ({ world }) => world.spaceco.xp >= 5000 },
	},
	{
		id: 'gms_sector_control',
		category: 'Corporate Growth',
		name: 'Sector Control',
		summary: 'Reach 15,000 Galactic Market Share points.',
		flavor: 'Full sector control achieved. Market share exceeds 80%.',
		difficulty: 3, // Medium - significant XP requirement
		trigger: { type: 'spacecoXp', check: ({ world }) => world.spaceco.xp >= 15000 },
	},
	{
		id: 'gms_belt_dominance',
		category: 'Corporate Growth',
		name: 'Belt Dominance',
		summary: 'Reach 50,000 Galactic Market Share points.',
		flavor: 'Belt-wide dominance confirmed. All mineral pricing controlled by SpaceCo systems.',
		difficulty: 4, // Hard - high XP requirement
		trigger: { type: 'spacecoXp', check: ({ world }) => world.spaceco.xp >= 50000 },
	},
	{
		id: 'gms_galactic_power',
		category: 'Corporate Growth',
		name: 'Galactic Corporate Power',
		summary: 'Reach 150,000 Galactic Market Share points.',
		flavor: 'Galactic corporate power achieved. Influence extends across multiple star systems.',
		difficulty: 5, // Very Hard - massive XP requirement
		trigger: { type: 'spacecoXp', check: ({ world }) => world.spaceco.xp >= 150000 },
	},
	{
		id: 'gms_universal_control',
		category: 'Corporate Growth',
		name: 'Universal Control',
		summary: 'Reach 500,000 Galactic Market Share points.',
		flavor: "Universal resource control established. The Belt operates according to The Collective's will.",
		difficulty: 5, // Very Hard - ultimate XP milestone with story significance
		trigger: { type: 'spacecoXp', check: ({ world }) => world.spaceco.xp >= 500000 },
	},
];
