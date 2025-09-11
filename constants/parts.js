export const parts = {
	// FUEL SYSTEMS
	T1: {
		name: 'Auxiliary Fuel Cell',
		spriteIndex: 15,
		price: 75,
		summary: 'Adds extra fuel capacity.',
		description: 'Compact secondary fuel reservoir that bolts onto existing systems. More range, same footprint.',
		maxFuel: 15,
	},
	T2: {
		name: 'Fuel Optimizer Module',
		spriteIndex: 5,
		price: 120,
		summary: 'Improves fuel efficiency.',
		description: 'Precision flow regulators and micro-valves ensure optimal fuel consumption across all operations.',
		fuelEfficiency: 1,
	},
	T3: {
		name: 'Extended Range Tank',
		spriteIndex: 24,
		price: 180,
		summary: 'Significant fuel capacity boost.',
		description: 'High-pressure storage system doubles as structural reinforcement. More fuel, tougher rig.',
		maxFuel: 25,
		maxHealth: 5,
	},

	// CARGO SYSTEMS
	T4: {
		name: 'Cargo Compactor',
		spriteIndex: 28,
		price: 140,
		summary: 'Increases cargo capacity.',
		description: 'Hydraulic compression systems pack more minerals into the same space. Physics meets profit.',
		maxCargo: 30,
	},
	T5: {
		name: 'Magnetic Storage Array',
		spriteIndex: 27,
		price: 220,
		summary: 'Advanced cargo management.',
		description: 'Magnetic field generators organize and compress cargo loads. Maximizes space without adding weight.',
		maxCargo: 45,
	},
	T6: {
		name: 'Dimensional Storage Bay',
		spriteIndex: 30,
		price: 320,
		summary: 'Exotic cargo expansion.',
		description:
			"Uses spatial compression technology to store significantly more cargo. Engineering insists it's perfectly safe.",
		maxCargo: 60,
	},

	// INVENTORY SYSTEMS
	T7: {
		name: 'Equipment Locker',
		spriteIndex: 16,
		price: 200,
		summary: 'Expands equipment storage capacity.',
		description: 'Secure modular storage compartments for additional equipment and supplies.',
		maxItemSlots: 6,
	},
	T8: {
		name: 'Specimen Vault',
		spriteIndex: 31,
		price: 800,
		summary: 'Advanced multi-dimensional storage.',
		description:
			'Specialized storage for delicate equipment and highly unusual specimens. Temperature and pressure controlled.',
		maxItemSlots: 12,
		maxCargo: 20,
	},

	// POWER SYSTEMS
	T9: {
		name: 'Power Amplifier',
		spriteIndex: 42,
		price: 250,
		summary: 'Boosts torque output.',
		description: 'Capacitor banks store and release power bursts when drilling demands exceed base engine output.',
		torque: 75,
	},
	T10: {
		name: 'Performance Enhancer',
		spriteIndex: 40,
		price: 360,
		summary: 'Multi-system power boost.',
		description: 'Advanced power conditioning improves engine performance and fuel utilization simultaneously.',
		torque: 60,
		fuelEfficiency: 1,
	},

	// DURABILITY SYSTEMS
	T11: {
		name: 'Reinforced Hull Plating',
		spriteIndex: 18,
		price: 200,
		summary: 'Enhanced structural integrity.',
		description: 'Nanoforged armor plating distributes impact forces. Tested against meteor strikes and angry aliens.',
		maxHealth: 20,
	},
	T12: {
		name: 'Adaptive Defense Grid',
		spriteIndex: 34,
		price: 450,
		summary: 'Comprehensive protection system.',
		description:
			'Smart armor that adapts to threats in real-time. Protects against impacts, heat, and unknown hazards.',
		maxHealth: 25,
		maxFuel: 10,
	},

	// HYBRID SYSTEMS (ALIEN-INFLUENCED ERA)
	T13: {
		name: 'Efficiency Core',
		spriteIndex: 19,
		price: 520,
		summary: 'Balanced performance upgrade.',
		description: 'Integrates power conditioning, fuel optimization, and cargo management in one compact unit.',
		fuelEfficiency: 2,
		torque: 40,
		maxCargo: 20,
	},
	T14: {
		name: 'Harmonic Synchronizer',
		spriteIndex: 41,
		price: 680,
		summary: 'Multi-system resonance optimizer.',
		description:
			"Synchronizes all rig systems using harmonic frequencies. The improvement patterns don't match our models, but the results are undeniable.",
		maxHealth: 15,
		fuelEfficiency: 1,
		torque: 60,
		maxCargo: 25,
	},
	T15: {
		name: 'Quantum Efficiency Matrix',
		spriteIndex: 17,
		price: 820,
		summary: 'Advanced multi-system enhancement.',
		description:
			'Quantum field interactions somehow improve every aspect of rig performance. Our scientists have stopped trying to explain it.',
		maxHealth: 20,
		maxFuel: 20,
		fuelEfficiency: 2,
		torque: 40,
	},
	T16: {
		name: 'Void-Resonance Matrix',
		spriteIndex: 12,
		price: 1000,
		summary: 'Ultimate performance enhancement.',
		description:
			'Peak rig optimization technology. Our engineers describe it as "impossibly efficient" and refuse to explain further.',
		maxHealth: 25,
		maxFuel: 30,
		maxCargo: 40,
		fuelEfficiency: 2,
		torque: 75,
	},
};
