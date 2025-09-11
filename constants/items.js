export const items = {
	// FUEL TYPES
	oil: {
		spriteIndex: 6,
		price: 20,
		units: 15,
		summary: 'Provides 15 units of oil fuel.',
		description: 'Standard fuel canister. Fills basic rigs completely, provides substantial backup for larger systems.',
	},

	battery: {
		spriteIndex: 10,
		price: 80,
		units: 35,
		summary: 'Provides 35 units of battery power.',
		description:
			'High-capacity energy cell. Completely powers mid-tier systems, provides significant backup for advanced rigs.',
	},

	super_oxygen_liquid_nitrogen: {
		spriteIndex: 9,
		price: 175,
		units: 55,
		summary: 'Provides 55 units of SOLN fuel.',
		description:
			'Cryogenic fuel canister. Fills standard SOLN systems completely, provides substantial reserves for elite platforms.',
	},

	// EARLY GAME ITEMS (Levels 1-5) - Corporate optimism
	spaceco_teleporter: {
		spriteIndex: 1,
		price: 45,
		summary: 'Teleports you to the surface.',
		description: 'Emergency surface transport. SpaceCo guarantees molecular integrity. Mostly.',
	},

	repair_nanites: {
		spriteIndex: 0,
		price: 36,
		summary: 'Mid-run hull repairs.',
		description: 'Self-assembling repair bots that patch hull breaches in real-time. Mild tingling sensation included.',
	},

	timed_charge: {
		spriteIndex: 7,
		price: 25,
		summary: '3s delay. Radius 3 blast.',
		description: 'Simple delayed explosive. Three-second fuse gives you just enough time to regret poor placement.',
	},

	// MID GAME ITEMS (Levels 6-8) - Corporate facade maintained but enhanced protocols
	advanced_teleporter: {
		spriteIndex: 5,
		price: 85,
		summary: 'Place and return to a beacon.',
		description: 'Precision teleportation system. Enhanced targeting protocols reduce potentially unexpected destinations.',
	},

	remote_charge: {
		spriteIndex: 8,
		price: 45,
		summary: 'Manual detonation. Radius 5 blast.',
		description: 'Remote detonation system. Enhanced signal clarity following recent communication upgrades.',
	},

	spaceco_teleport_station: {
		spriteIndex: 4,
		price: 180,
		summary: 'Relocates SpaceCo outpost to your position.',
		description:
			'Advanced facility relocation system. Instantly moves the nearest SpaceCo outpost to your current location for convenient access to services.',
	},

	teleport_station: {
		spriteIndex: 5,
		price: 0, // Not directly sellable
		summary: 'Deployed teleportation station.',
		description:
			'Deployed teleportation beacon. Provides instantaneous transport when activated remotely.',
	},

	// LATE GAME ITEMS (Levels 9+) - Alien influence showing through
	gravity_charge: {
		spriteIndex: 13,
		price: 85,
		summary: 'Implosion bomb. Radius 4 collection.',
		description:
			'Exotic matter implosion device. Recent refinements in containment technology improve overall material acquisition rates.',
	},

	void_implosion: {
		spriteIndex: 12,
		price: 140,
		summary: 'Advanced implosion. Radius 6 collection.',
		description:
			'Enhanced dimensional compression device. Technical specifications indicate optimal material acquisition through harmonized void-space manipulation protocols.',
	},

	// UNIVERSAL ITEMS - Available throughout
	transport_insurance: {
		spriteIndex: 11,
		price: 15,
		summary: 'Protects items during inter-asteroid transport.',
		description:
			'One-use insurance policy. SpaceCo guarantees your equipment survives the journey to new extraction sites.',
	},

	// ALIEN ERA ITEMS (Level 11+) - Post-takeover
	psykick_egg: {
		spriteIndex: 14,
		price: 0,
		summary: 'High-density resonant mineral.',
		description:
			'Smooth ovoid formations classified as rare quantum-responsive minerals. Emit a faint warmth and barely perceptible hum.',
	},
};
