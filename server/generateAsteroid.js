/**
 * UNIFIED ASTEROID GENERATION SYSTEM
 *
 * Generates asteroids using a phased approach:
 * Phase 1: Shape & Structure (natural asteroid shape, holes, tunnels)
 * Phase 2: Geological Formations (unified ground colors + mineral veins)
 * Phase 3: Environmental Systems (lava pools, gas pockets)
 * Phase 4: Life & Artifacts (aliens, items with precise budgets)
 */

import { randInt, weightedChance } from '../utils/index.js';
import { worlds } from '../constants/index.js';

/**
 * Calculate asteroid dimensions based on size and shape
 */
function calculateDimensions(size, shape) {
	// Base dimensions for different sizes
	const sizeMap = {
		small: { base: 45, variance: [40, 50] },
		medium: { base: 60, variance: [55, 65] },
		large: { base: 80, variance: [75, 85] },
		huge: { base: 100, variance: [95, 105] },
	};

	// Shape ratios (width:depth)
	const shapeMap = {
		wide: { widthRatio: 1.4, depthRatio: 0.8 }, // Wide and shallow
		tall: { widthRatio: 0.8, depthRatio: 1.4 }, // Tall and narrow
		deep: { widthRatio: 0.7, depthRatio: 1.6 }, // Narrow and deep
		square: { widthRatio: 1.0, depthRatio: 1.0 }, // Equal dimensions
		balanced: { widthRatio: 1.1, depthRatio: 1.2 }, // Slightly rectangular
	};

	const sizeConfig = sizeMap[size] || sizeMap.medium;
	const shapeConfig = shapeMap[shape] || shapeMap.balanced;

	// Calculate base dimension with variance
	const baseDimension = randInt(sizeConfig.variance[0], sizeConfig.variance[1]);

	// Apply shape ratios
	const width = Math.round(baseDimension * shapeConfig.widthRatio);
	const depth = Math.round(baseDimension * shapeConfig.depthRatio);

	return { width, depth };
}

/**
 * Generate a complete asteroid world using layered generation
 * @param {Object} worldConfig - World configuration from constants/worlds.js
 * @param {Object} gameData - Game data (items, aliens, etc.)
 * @returns {Object} Generated world
 */
export function generateAsteroid(worldConfig, gameData = {}) {
	// Resolve dimensions using size & shape system
	const size = worldConfig.size || 'medium'; // small/medium/large/huge
	const shape = worldConfig.shape || 'balanced'; // wide/deep/square/balanced
	const { width, depth } = calculateDimensions(size, shape);

	// Extract top-level structure settings
	// Density now controlled by crater and cave configurations

	// Initialize world structure
	const world = {
		name: worldConfig.name,
		width,
		depth,
		airGap: 3, // Safe surface area
		grid: Array(width)
			.fill()
			.map(() =>
				Array(depth)
					.fill()
					.map(() => ({
						terrain: 'solid',
						ground: null,
						items: [],
						hazards: [],
					})),
			),
		spaceco: {
			position: { x: Math.floor(width / 2), y: 5 }, // airGap is 3 (y<=3 is space), spaceco is 3x3 with bottom-middle anchor, so y=5 puts top at y=3
			xp: 0,
		},
	};

	console.log(`🏗️  Generating ${world.name} (${width}x${depth}) - ${shape} shape`);

	// =================================================================
	// PHASE 1: SHAPE & STRUCTURE
	// =================================================================

	// 1.1: Generate natural asteroid shape
	const asteroidShape = generateAsteroidShape(width, depth, shape);

	// 1.2: Create holes using crater and cave configurations
	const holePattern = generateHolePattern(width, depth, worldConfig, asteroidShape);

	// 1.3: Generate tunnel systems
	const tunnelPositions = generateTunnelSystems(width, depth, worldConfig.tunnelSystems);

	// =================================================================
	// PHASE 2: GEOLOGICAL FORMATIONS (UNIFIED GROUND + VEIN GENERATION)
	// =================================================================

	// 2.1: Generate geological formations (ground colors + mineral veins together)
	generateGeologicalFormations(world, worldConfig, asteroidShape, holePattern, tunnelPositions);

	// =================================================================
	// PHASE 3: ENVIRONMENTAL SYSTEMS
	// =================================================================

	// 3.1 & 3.2: Apply hazards by picking spots in cave spaces
	applyHazardsByPickingSpots(world, worldConfig, asteroidShape, holePattern);

	// =================================================================
	// PHASE 4: LIFE & ARTIFACTS (PRECISE BUDGET SYSTEM)
	// =================================================================

	// 4.1: Place aliens using budget system
	placeAliens(world, worldConfig);

	// 4.2: Place items using budget system
	placeItems(world, worldConfig, gameData.items || {});

	// 4.3: Generate pure mineral crystals from veins (if using vein-based ground)
	const groundFormat = worldConfig.groundFormat || 'veins';
	console.log('🔍 CRYSTAL CHECK: groundFormat =', groundFormat);
	if (groundFormat === 'veins') {
		const pureMineralCrystals = generatePureMineralCrystals(world, worldConfig.ground);
		// Group crystals by location and type for efficient placement
		const crystalsByLocation = {};
		pureMineralCrystals.forEach(crystal => {
			const key = `${crystal.x},${crystal.y}`;
			if (!crystalsByLocation[key]) {
				crystalsByLocation[key] = {};
			}
			if (!crystalsByLocation[key][crystal.type]) {
				crystalsByLocation[key][crystal.type] = 0;
			}
			crystalsByLocation[key][crystal.type]++;
		});

		// Place grouped crystals as items in the world
		Object.entries(crystalsByLocation).forEach(([locationKey, crystalTypes]) => {
			const [x, y] = locationKey.split(',').map(Number);
			console.log(`💎 PLACEMENT: Adding crystals at (${x},${y}):`, crystalTypes);
			if (world.grid[x] && world.grid[x][y]) {
				if (!world.grid[x][y].items) {
					world.grid[x][y].items = [];
				}
				Object.entries(crystalTypes).forEach(([crystalType, count]) => {
					// Push individual items instead of using count property
					for (let i = 0; i < count; i++) {
						world.grid[x][y].items.push({
							name: crystalType,
						});
					}
					console.log(
						`💎 PLACEMENT: Added ${count} ${crystalType} to (${x},${y}) - total items: ${world.grid[x][y].items.length}`,
					);
				});
			} else {
				console.log(`💎 PLACEMENT ERROR: Invalid grid location (${x},${y})`);
			}
		});
		if (pureMineralCrystals.length > 0) {
			console.log(`💎 Placed ${pureMineralCrystals.length} pure mineral crystals`);
		}
	}

	// Final debug: check if hazards are still in the grid before returning
	let hazardCount = 0;
	for (let x = 0; x < world.width; x++) {
		for (let y = 0; y < world.depth; y++) {
			if (world.grid[x] && world.grid[x][y] && world.grid[x][y].hazards && world.grid[x][y].hazards.length > 0) {
				hazardCount += world.grid[x][y].hazards.length;
			}
		}
	}
	console.log(`🔧 FINAL DEBUG: Found ${hazardCount} hazards in grid before returning`);

	// Find safe surface position for spaceco (3x3 sprite with bottom-middle anchor)
	let spacecoPosition = null;
	const centerX = Math.floor(width / 2);

	// Search outward from center for a safe landing spot
	for (let radius = 0; radius < Math.floor(width / 2); radius++) {
		for (let xOffset = -radius; xOffset <= radius; xOffset++) {
			const x = centerX + xOffset;
			if (x < 2 || x >= width - 2) continue; // Need room for 3x3 sprite

			// Find the surface (transition from space to solid) at this x position
			for (let y = world.airGap; y < world.depth - 1; y++) {
				// Check if current position is space and position below is solid (this is the surface)
				const currentIsSpace = world.grid[x]?.[y]?.terrain === 'space';
				const belowIsSolid = world.grid[x]?.[y + 1]?.terrain === 'solid';

				if (currentIsSpace && belowIsSolid) {
					// Found surface at y, now check if SpaceCo can fit here
					// SpaceCo is 3 tiles tall, so check y-2, y-1, and y are all space
					// and y+1 row (ground below) is solid across 3 tiles width
					const canFit =
						world.grid[x - 1]?.[y - 2]?.terrain === 'space' &&
						world.grid[x]?.[y - 2]?.terrain === 'space' &&
						world.grid[x + 1]?.[y - 2]?.terrain === 'space' &&
						world.grid[x - 1]?.[y - 1]?.terrain === 'space' &&
						world.grid[x]?.[y - 1]?.terrain === 'space' &&
						world.grid[x + 1]?.[y - 1]?.terrain === 'space' &&
						world.grid[x - 1]?.[y]?.terrain === 'space' &&
						world.grid[x]?.[y]?.terrain === 'space' &&
						world.grid[x + 1]?.[y]?.terrain === 'space' &&
						world.grid[x - 1]?.[y + 1]?.terrain === 'solid' &&
						world.grid[x]?.[y + 1]?.terrain === 'solid' &&
						world.grid[x + 1]?.[y + 1]?.terrain === 'solid';

					if (canFit) {
						spacecoPosition = { x, y }; // Anchor at y (the last space position before solid ground)
						break;
					}
				}
			}
			if (spacecoPosition) break;
		}
		if (spacecoPosition) break;
	}

	// Fallback if no safe position found
	if (!spacecoPosition) {
		spacecoPosition = { x: centerX, y: world.airGap + 3 };
		console.log('⚠️  No safe spaceco position found, using fallback:', spacecoPosition);
	}

	world.spaceco.position = spacecoPosition;
	console.log(`🏢 Spaceco positioned at (${spacecoPosition.x}, ${spacecoPosition.y})`);

	// Remove debug/temporary fields before returning
	delete world.veinPathCoords;
	delete world.veinData;
	delete world.veinPaths;

	// Copy over game configuration properties from worldConfig
	world.newPlayer = worldConfig.newPlayer;
	world.transportChoices = worlds.map(w => w.name); // List of all world names for transport
	world.transports = Object.fromEntries(
		worlds.map(w => [w.name, { price: w.transportPrice, requirements: w.transportRequirements }]),
	);
	world.id = worldConfig.id;
	world.description = worldConfig.description;
	world.transportRequirements = worldConfig.transportRequirements;
	world.transportPrice = worldConfig.transportPrice;

	// Store original config for resupply feature
	world.config = worldConfig;

	// Merge spaceco configuration from worldConfig with full defaults
	world.spaceco = {
		xp: 0,
		health: 9,
		shop: {},
		hull: {},
		achievements: {},
		stats: {
			itemsSold: 0,
			creditsEarned: 0,
			fuelSold: 0,
			repairsSold: 0,
			upgradesSold: 0,
			transportsCompleted: 0,
			levelsVisited: {},
			upgradesSoldByType: {},
		},
		...worldConfig.spaceco,
		position: world.spaceco.position, // Restore generated position after merge
	};

	// Convert shop stock arrays [min, max] to actual random numbers
	if (world.spaceco.shop) {
		Object.entries(world.spaceco.shop).forEach(([itemName, stockValue]) => {
			if (Array.isArray(stockValue)) {
				world.spaceco.shop[itemName] = randInt(stockValue[0], stockValue[1]);
			}
		});
	}

	return world;
}

/**
 * Generate solid asteroid shape with clean edges (no feathering)
 */
function generateAsteroidShape(width, depth, shape) {
	// Shape ratios that fill most of the grid (85-90% utilization)
	const shapeMap = {
		wide: { aspectX: 1.3, aspectY: 0.85 }, // Wide ellipse
		tall: { aspectX: 0.85, aspectY: 1.3 }, // Tall ellipse
		deep: { aspectX: 0.85, aspectY: 1.3 }, // Tall ellipse
		square: { aspectX: 1.0, aspectY: 1.0 }, // Perfect circle
		balanced: { aspectX: 1.1, aspectY: 1.15 }, // Slightly rectangular
	};

	const { aspectX, aspectY } = shapeMap[shape] || shapeMap.balanced;

	return (x, y) => {
		// Normalized coordinates (0 to 1)
		const nx = x / (width - 1);
		const ny = y / (depth - 1);

		// Large solid ellipse that fills most of the grid
		const centerX = 0.5;
		const centerY = 0.5;
		// Use much larger radius that fills ~85-90% of available space, shaped by aspect ratios
		const baseRadius = 0.45; // Large base radius (90% usage)
		const radiusX = baseRadius;
		const radiusY = baseRadius;

		// Distance from center with shape adjustment
		const dx = (nx - centerX) / (radiusX * aspectX);
		const dy = (ny - centerY) / (radiusY * aspectY);
		const ellipseDistance = dx * dx + dy * dy;

		// Clean solid shape (no edge noise needed - variation comes from craters)
		return ellipseDistance <= 1.0;
	};
}

/**
 * Generate hole pattern using density
 */
/**
 * Evaluate how much of a cave area would be placed in solid ground
 * Higher scores indicate better cave placement (mostly in solid areas)
 */
function evaluateSolidAreaForCave(centerX, centerY, radiusX, radiusY, width, depth, asteroidShape) {
	let solidCells = 0;
	let totalCells = 0;

	// Check the cave area itself to see how much would be solid
	for (let x = Math.max(0, centerX - radiusX); x <= Math.min(width - 1, centerX + radiusX); x++) {
		for (let y = Math.max(3, centerY - radiusY); y <= Math.min(depth - 1, centerY + radiusY); y++) {
			const dx = x - centerX;
			const dy = y - centerY;

			// Check if this point is within the cave's ellipse
			const distance = (dx / radiusX) ** 2 + (dy / radiusY) ** 2;

			if (distance <= 1.0) {
				totalCells++;

				// Check if this point would be in solid asteroid area
				if (asteroidShape(x, y)) {
					solidCells++;
				}
			}
		}
	}

	// Return percentage of cave area that would be in solid ground
	return totalCells > 0 ? solidCells / totalCells : 0;
}

function generateHolePattern(width, depth, worldConfig, asteroidShape) {
	// Generate varied hole systems for hazards and items
	const holes = [];

	// 1. Configurable crater system - default baseline
	const craterConfig = worldConfig.craters || {
		huge: 1, // 1 huge crater
		big: [0, 1], // 0-1 big craters
		medium: [2, 6], // 2-6 medium craters
		small: [9, 15], // 9-15 small craters
		tiny: [3, 9], // 3-9 tiny craters
	};

	const minDimension = Math.min(width, depth);
	const craterSizes = {
		huge: { radius: [Math.floor(minDimension * 0.15), Math.floor(minDimension * 0.25)], edgeDist: 0.2 },
		big: { radius: [Math.floor(minDimension * 0.08), Math.floor(minDimension * 0.15)], edgeDist: 0.25 },
		medium: { radius: [Math.floor(minDimension * 0.04), Math.floor(minDimension * 0.08)], edgeDist: 0.3 },
		small: { radius: [3, Math.max(6, Math.floor(minDimension * 0.06))], edgeDist: 0.15 }, // Minimum 3, better max
		tiny: { radius: [2, 4], edgeDist: 0.1 }, // Fixed minimum viable size
	};
	const caveSizes = {
		huge: { radius: [Math.floor(minDimension * 0.12), Math.floor(minDimension * 0.2)] },
		big: { radius: [Math.floor(minDimension * 0.06), Math.floor(minDimension * 0.12)] },
		medium: { radius: [Math.floor(minDimension * 0.03), Math.floor(minDimension * 0.06)] },
		small: { radius: [3, Math.max(5, Math.floor(minDimension * 0.05))] }, // Minimum 3, better max
		tiny: { radius: [2, 4] }, // Fixed minimum viable size
	};

	// Generate craters by size category
	Object.entries(craterConfig).forEach(([size, count]) => {
		const actualCount = Array.isArray(count) ? randInt(count[0], count[1]) : count;
		const sizeConfig = craterSizes[size];

		for (let i = 0; i < actualCount; i++) {
			// Choose random edge position
			const edge = Math.floor(Math.random() * 4);
			const edgeDist = sizeConfig.edgeDist;
			let centerX, centerY;
			const radiusX = randInt(sizeConfig.radius[0], sizeConfig.radius[1]);
			const radiusY = randInt(sizeConfig.radius[0], sizeConfig.radius[1]);

			if (edge === 0) {
				// Top edge - position crater to naturally burst through top
				centerX = randInt(Math.floor(width * edgeDist), Math.floor(width * (1 - edgeDist)));
				// Position crater center closer to the edge, within radius distance
				centerY = randInt(Math.floor(radiusY * 0.4), Math.floor(radiusY * 0.8));
			} else if (edge === 1) {
				// Right edge - position crater to naturally burst through right
				// Position crater center closer to the right edge
				centerX = randInt(width - Math.floor(radiusX * 0.8), width - Math.floor(radiusX * 0.4));
				centerY = randInt(Math.floor(depth * edgeDist), Math.floor(depth * (1 - edgeDist)));
			} else if (edge === 2) {
				// Bottom edge - position crater to naturally burst through bottom
				centerX = randInt(Math.floor(width * edgeDist), Math.floor(width * (1 - edgeDist)));
				// Position crater center closer to the bottom edge
				centerY = randInt(depth - Math.floor(radiusY * 0.8), depth - Math.floor(radiusY * 0.4));
			} else {
				// Left edge - position crater to naturally burst through left
				// Position crater center closer to the left edge
				centerX = randInt(Math.floor(radiusX * 0.4), Math.floor(radiusX * 0.8));
				centerY = randInt(Math.floor(depth * edgeDist), Math.floor(depth * (1 - edgeDist)));
			}

			holes.push({
				type: `${size}_crater`,
				centerX: Math.max(0, Math.min(width - 1, centerX)),
				centerY: Math.max(0, Math.min(depth - 1, centerY)),
				radiusX: Math.max(1, radiusX),
				radiusY: Math.max(1, radiusY),
				edgeBurst: true,
				burstEdge: edge, // Track which edge this crater should burst through
				irregularity: size === 'tiny' ? 0.3 : 0.4 + Math.random() * 0.4,
			});
		}
	});

	// 2. Configurable cave system - same sizes as craters
	const caveConfig = worldConfig.caves || {
		huge: 0, // Default: 0 huge caves
		big: 0, // Default: 0 big caves
		medium: [1, 3], // Default: 1-3 medium caves
		small: [2, 5], // Default: 2-5 small caves
		tiny: [3, 6], // Default: 3-6 tiny caves
	};

	// Generate caves by size category with lava/gas integration
	const lavaConfig = worldConfig.lava_pools || { count: [0, 0] };
	const gasConfig = worldConfig.gas_pockets || { count: [0, 0] };
	const lavaCount = randInt(lavaConfig.count[0], lavaConfig.count[1]);
	const gasCount = randInt(gasConfig.count[0], gasConfig.count[1]);

	const caveList = []; // Track caves for hazard placement

	Object.entries(caveConfig).forEach(([size, count]) => {
		const actualCount = Array.isArray(count) ? randInt(count[0], count[1]) : count;
		const sizeConfig = caveSizes[size];

		if (actualCount === 0) {
			return; // Skip if no caves of this size
		}

		for (let i = 0; i < actualCount; i++) {
			// Try multiple positions and pick the one that's best placed in solid ground
			let bestPosition = null;
			let bestScore = -1;
			const attempts = 20; // Try more positions for better placement

			for (let attempt = 0; attempt < attempts; attempt++) {
				// Position caves within the solid asteroid area
				const centerX = randInt(Math.floor(width * 0.2), Math.floor(width * 0.8));
				const centerY = randInt(Math.floor(depth * 0.2), Math.floor(depth * 0.8));
				const radiusX = randInt(sizeConfig.radius[0], sizeConfig.radius[1]);
				const radiusY = randInt(sizeConfig.radius[0], sizeConfig.radius[1]);

				// Check if the cave center and most of its area would be in solid ground
				const solidScore = evaluateSolidAreaForCave(centerX, centerY, radiusX, radiusY, width, depth, asteroidShape);

				if (solidScore > bestScore) {
					bestScore = solidScore;
					bestPosition = { centerX, centerY, radiusX, radiusY };
				}
			}

			// Only place cave if we found a good solid location
			if (!bestPosition || bestScore < 0.3) {
				continue;
			}

			const { centerX, centerY, radiusX, radiusY } = bestPosition;

			const cave = {
				type: `${size}_cave`,
				centerX: Math.max(0, Math.min(width - 1, centerX)),
				centerY: Math.max(0, Math.min(depth - 1, centerY)),
				radiusX: Math.max(1, radiusX),
				radiusY: Math.max(1, radiusY),
				irregularity: size === 'tiny' ? 0.3 : 0.4 + Math.random() * 0.4,
				size: size,
				hasLava: false,
				hasGas: false,
			};

			holes.push(cave);
			caveList.push(cave);
		}
	});

	// Assign lava to suitable caves (deeper, larger caves preferred)
	if (lavaCount > 0) {
		const lavaEligibleCaves = caveList
			.filter(
				cave =>
					cave.centerY > depth * 0.4 && // Lower half
					['medium', 'big', 'huge'].includes(cave.size), // Medium or larger
			)
			.sort((a, b) => b.centerY - a.centerY); // Prefer deeper

		for (let i = 0; i < Math.min(lavaCount, lavaEligibleCaves.length); i++) {
			lavaEligibleCaves[i].hasLava = true;
			console.log(
				`🌋 Marked ${lavaEligibleCaves[i].size} cave at (${lavaEligibleCaves[i].centerX}, ${lavaEligibleCaves[i].centerY}) for lava`,
			);
		}
	}

	// Assign gas to suitable caves (no overlap with lava)
	if (gasCount > 0) {
		const gasEligibleCaves = caveList
			.filter(
				cave =>
					['small', 'medium', 'big', 'huge'].includes(cave.size) &&
					// Prevent any cave from having both lava and gas
					!cave.hasLava,
			)
			.sort(() => Math.random() - 0.5); // Random selection

		for (let i = 0; i < Math.min(gasCount, gasEligibleCaves.length); i++) {
			gasEligibleCaves[i].hasGas = true;
			console.log(
				`💨 Marked ${gasEligibleCaves[i].size} cave at (${gasEligibleCaves[i].centerX}, ${gasEligibleCaves[i].centerY}) for gas`,
			);
		}
	}

	// Cave data will be attached to the returned function

	console.log(`🕳️ Generated ${holes.length} total holes: ${holes.map(h => h.type).join(', ')}`);

	// Caves are now handled by the configurable system above

	let debugCallCount = 0;
	return (x, y) => {
		debugCallCount++;
		// Debug first few calls
		if (debugCallCount <= 5) {
			console.log(`🔍 Checking hole pattern at (${x},${y}) with ${holes.length} holes`);
		}

		// Check if point is inside any hole system
		for (const hole of holes) {
			const dx = x - hole.centerX;
			const dy = y - hole.centerY;

			// Edge-bursting holes can extend anywhere (including surface area)
			// Interior holes skip surface area for traditional cave placement
			if (!hole.edgeBurst && y <= 3) continue;

			// Special handling for edge-bursting craters - create semi-spherical shapes
			let isInCrater = false;
			if (hole.edgeBurst && hole.burstEdge !== undefined) {
				// Calculate distance from crater center
				const distance = (dx / hole.radiusX) ** 2 + (dy / hole.radiusY) ** 2;

				if (distance <= 1.0) {
					// For edge craters, create a semi-spherical profile that gets shallower away from edge
					let edgeDepthFactor = 1.0;

					if (hole.burstEdge === 0) {
						// Top edge
						edgeDepthFactor = Math.max(0.3, 1.0 - (y - hole.centerY) / (hole.radiusY * 1.5));
					} else if (hole.burstEdge === 1) {
						// Right edge
						edgeDepthFactor = Math.max(0.3, 1.0 - (hole.centerX - x) / (hole.radiusX * 1.5));
					} else if (hole.burstEdge === 2) {
						// Bottom edge
						edgeDepthFactor = Math.max(0.3, 1.0 - (hole.centerY - y) / (hole.radiusY * 1.5));
					} else {
						// Left edge
						edgeDepthFactor = Math.max(0.3, 1.0 - (x - hole.centerX) / (hole.radiusX * 1.5));
					}

					// Apply organic noise only if we're within the depth-adjusted crater
					if (distance <= edgeDepthFactor) {
						const nx = x / width;
						const ny = y / depth;
						const noiseIntensity = 0.15; // Reduced noise for cleaner crater shapes

						const noise1 = Math.sin(nx * 8 + ny * 6) * hole.irregularity * noiseIntensity;
						const noise2 = Math.cos(nx * 5 + ny * 9) * hole.irregularity * (noiseIntensity * 0.6);

						const noiseFactor = 1 + noise1 + noise2;

						if (distance * noiseFactor <= edgeDepthFactor) {
							isInCrater = true;
						}
					}
				}
			} else {
				// Standard hole detection for caves and non-bursting craters
				const nx = x / width;
				const ny = y / depth;
				let noiseIntensity;

				if (hole.type === 'edge_crater') {
					noiseIntensity = 0.18; // More organic crater shapes
				} else if (hole.type === 'large_cave') {
					noiseIntensity = 0.25;
				} else if (hole.type === 'medium_cave') {
					noiseIntensity = 0.35;
				} else {
					noiseIntensity = 0.3;
				}

				const noise1 = Math.sin(nx * 10 + ny * 7) * hole.irregularity * noiseIntensity;
				const noise2 = Math.cos(nx * 6 + ny * 12) * hole.irregularity * (noiseIntensity * 0.7);
				const noise3 = Math.sin(nx * 15 + ny * 4) * hole.irregularity * (noiseIntensity * 0.5);
				const noise4 = Math.cos(nx * 18 + ny * 11) * hole.irregularity * (noiseIntensity * 0.4);
				const noise5 = Math.sin(nx * 4 + ny * 8) * hole.irregularity * (noiseIntensity * 0.6);

				const noiseFactor = 1 + noise1 + noise2 + noise3 + noise4 + noise5;

				// Check if inside this hole
				const distance = (dx / hole.radiusX) ** 2 + (dy / hole.radiusY) ** 2;

				if (distance * noiseFactor <= 1.0) {
					isInCrater = true;
				}
			}

			if (isInCrater) {
				if (debugCallCount <= 5) {
					console.log(`💥 HOLE DETECTED at (${x},${y}) in ${hole.type} at (${hole.centerX},${hole.centerY})`);
				}
				return true;
			}
		}

		// No additional tiny holes - controlled by crater/cave configuration
		return false;
	};
}

/**
 * Generate tunnel systems
 */
function generateTunnelSystems(width, depth, tunnelConfig) {
	if (!tunnelConfig) return [];

	const tunnelPositions = new Set();
	const tunnelCount = randInt(tunnelConfig.count[0], tunnelConfig.count[1]);

	for (let t = 0; t < tunnelCount; t++) {
		// Random starting point (avoid edges)
		let x = randInt(5, width - 5);
		let y = randInt(10, depth - 10);

		// Random initial direction
		let directionX = (Math.random() - 0.5) * 2;
		let directionY = Math.random() * 0.8 + 0.2; // Slight downward bias

		const segmentCount = randInt(3, 8);

		for (let s = 0; s < segmentCount; s++) {
			const segmentLength = randInt(tunnelConfig.segmentLength[0], tunnelConfig.segmentLength[1]);

			// Generate tunnel segment
			for (let i = 0; i < segmentLength; i++) {
				// Add wander to direction
				directionX += (Math.random() - 0.5) * tunnelConfig.wanderStrength;
				directionY += (Math.random() - 0.5) * tunnelConfig.wanderStrength * 0.5;

				// Normalize direction
				const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
				directionX /= magnitude;
				directionY /= magnitude;

				// Move along tunnel
				x += directionX;
				y += directionY;

				// Keep in bounds
				x = Math.max(2, Math.min(width - 2, x));
				y = Math.max(2, Math.min(depth - 2, y));

				// Add main tunnel position (much smaller)
				const tx = Math.round(x);
				const ty = Math.round(y);
				if (tx >= 0 && tx < width && ty >= 0 && ty < depth) {
					tunnelPositions.add(`${tx},${ty}`);

					// Only occasionally add width (more realistic thin tunnels)
					if (Math.random() < 0.3) {
						const widthDir = Math.random() < 0.5 ? 1 : -1;
						const wx = tx + widthDir;
						const wy = ty;
						if (wx >= 0 && wx < width && wy >= 0 && wy < depth) {
							tunnelPositions.add(`${wx},${wy}`);
						}
					}
				}
			}

			// Branch chance
			if (Math.random() < tunnelConfig.branchProbability && s < tunnelConfig.maxBranches) {
				// Create a branch (change direction significantly)
				directionX += (Math.random() - 0.5) * 1.5;
				directionY += (Math.random() - 0.5) * 1.5;
			}
		}
	}

	return Array.from(tunnelPositions).map(pos => {
		const [x, y] = pos.split(',').map(Number);
		return { x, y };
	});
}

/**
 * Generate ground using new vein-based format: { base: 'white', veins: [{ density, yield, size, color }] }
 */
function generateVeinBasedGround(world, worldConfig, asteroidShape, holePattern, tunnelPositions) {
	console.log('🎯 Generating vein-based ground patterns');
	console.log('🔍 DEBUG: tunnelPositions type:', typeof tunnelPositions, 'length:', tunnelPositions?.length);

	const { base, veins } = worldConfig.ground;

	// Handle tunnelPositions safely - ensure it's an array
	const safePositions = Array.isArray(tunnelPositions) ? tunnelPositions : [];
	const tunnelSet = new Set(safePositions.map(pos => `${pos.x},${pos.y}`));

	// Initialize path coordinate tracking
	world.veinPathCoords = {};
	veins.forEach(vein => {
		world.veinPathCoords[vein.color] = [];
	});

	console.log(`   Base color: ${base}`);
	console.log(`   Veins: ${veins.length} vein types`);

	// Step 1: Initialize grid and apply terrain (solid/space) and base ground color
	for (let y = 0; y < world.depth; y++) {
		for (let x = 0; x < world.width; x++) {
			// Initialize grid cell if needed
			if (!world.grid[x]) world.grid[x] = {};
			if (!world.grid[x][y]) {
				world.grid[x][y] = { terrain: 'solid', ground: null };
			}

			// Apply asteroid shape and hole patterns to determine terrain
			if (!asteroidShape(x, y) || holePattern(x, y) || y <= world.airGap) {
				world.grid[x][y].terrain = 'space';
				world.grid[x][y].ground = null;
				continue;
			}

			// Skip tunnel positions for ground color (terrain stays solid)
			if (tunnelSet.has(`${x},${y}`)) {
				continue;
			}

			// Set base ground color for solid terrain
			world.grid[x][y].ground = { type: base };
		}
	}

	// Step 2: Generate and place veins based on density/size parameters
	veins.forEach((vein, index) => {
		console.log(`   🔥 Generating ${vein.color} veins (density: ${vein.density}, size: ${vein.size})`);
		// Store vein info for later crystal generation
		if (!world.veinData) world.veinData = [];
		world.veinData[index] = { ...vein, veinIndex: index };
		console.log(`🔍 VEIN DATA: Stored vein[${index}] =`, world.veinData[index]);
		generateVeinPaths(world, vein, asteroidShape, holePattern, tunnelSet, index);
	});

	console.log('✅ Vein-based ground generation complete');

	console.log('🔍 CHECKING VEIN PATH STORAGE...');
	// Store vein paths for pure mineral generation (maintain backwards compatibility)
	world.veinPaths = [];
	veins.forEach(vein => {
		console.log(`💎 YIELD DEBUG: ${vein.color} - yield: ${vein.yield} (type: ${typeof vein.yield})`);
		if (vein.yield && vein.yield > 0) {
			const pathCoords = world.veinPathCoords?.[vein.color] || [];
			console.log(`💎 DEBUG: ${vein.color} has ${pathCoords.length} recorded paths`);
			world.veinPaths.push({
				color: vein.color,
				pattern: vein.pattern,
				size: vein.size,
				density: vein.yield, // Use yield value for crystal density
				yield: vein.yield, // Keep yield for legacy compatibility
				actualPaths: pathCoords, // Store actual path coordinates
			});
		} else {
			console.log(`💎 SKIPPED: ${vein.color} - yield check failed`);
		}
	});
}

function generateVeinPaths(world, vein, asteroidShape, holePattern, tunnelSet, veinIndex) {
	try {
		console.log(`🔄 ENTRY: generateVeinPaths called for ${vein.color}`);
		const { density, size, color, pattern = 'organic' } = vein;

		// Calculate number of vein starting points based on density
		const worldArea = world.width * world.depth;
		const numVeins = Math.max(1, Math.round((density * worldArea) / 1000)); // Scale density to world size

		console.log(`     Starting ${numVeins} ${color} vein paths (pattern: ${pattern}, size: ${size})`);
		console.log(`🔄 CHECKPOINT 1: After logging, about to route patterns`);

		// Route to different generation functions based on pattern
		console.log(`🔄 PATTERN DEBUG: About to generate ${pattern} veins for ${color}`);
		console.log(`🔄 SWITCH ENTERING: pattern="${pattern}", color="${color}"`);
		console.log(`🔄 CHECKPOINT 2: About to enter switch statement`);
		switch (pattern) {
			case 'fractal':
				generateFractalVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex);
				break;
			case 'layered':
				generateLayeredVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex);
				break;
			case 'radial':
				generateRadialVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex);
				break;
			case 'scattered':
				generateScatteredVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex);
				break;
			case 'concentric':
				generateConcentricVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex);
				break;
			case 'grid':
				generateGridVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'spiral':
				generateSpiralVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'faults':
				generateFaultVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'lightning':
				generateLightningVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'cellular':
				generateCellularVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'flow':
				generateFlowVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'percolation':
				generatePercolationVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'maze':
				generateMazeVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'noise_bands':
				generateNoiseBandVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet);
				break;
			case 'organic':
			default:
				generateOrganicVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex);
				break;
		}
	} catch (error) {
		console.log(`🚨 ERROR in generateVeinPaths for ${vein.color}: ${error.message}`);
		console.log(`🚨 Stack: ${error.stack}`);
		console.log(`🚨 Falling back to organic pattern`);
		generateOrganicVeins(
			world,
			vein.color,
			vein.size,
			Math.max(1, Math.round((vein.density * world.width * world.depth) / 1000)),
			asteroidShape,
			holePattern,
			tunnelSet,
			veinIndex,
		);
	}
}

function generateSingleVeinPath(
	world,
	startX,
	startY,
	color,
	sizeMultiplier,
	asteroidShape,
	holePattern,
	tunnelSet,
	veinIndex = 0,
) {
	// Calculate vein length based on size multiplier
	const baseLength = 8 + Math.random() * 12; // 8-20 base length
	const veinLength = Math.round(baseLength * sizeMultiplier);

	let currentX = startX;
	let currentY = startY;
	let direction = Math.random() * Math.PI * 2; // Random starting direction

	// Track path coordinates for crystal placement
	const pathCoords = [];

	// Initialize path coords array if not exists
	if (!world.veinPathCoords) world.veinPathCoords = {};
	if (!world.veinPathCoords[color]) world.veinPathCoords[color] = [];

	for (let step = 0; step < veinLength; step++) {
		// Place vein color at current position
		if (isValidGroundCell(world, currentX, currentY, asteroidShape, holePattern, tunnelSet)) {
			world.grid[currentX][currentY].ground = {
				type: color,
				veinSource: true,
				veinIndex: veinIndex || 0, // Track which specific vein created this cell
			};
			// Record this position as part of the path
			pathCoords.push({ x: currentX, y: currentY, step: step });
		}

		// Move to next position with some randomness
		direction += (Math.random() - 0.5) * 0.8; // Slight direction changes for winding
		currentX += Math.round(Math.cos(direction));
		currentY += Math.round(Math.sin(direction));

		// Keep within bounds
		currentX = Math.max(0, Math.min(world.width - 1, currentX));
		currentY = Math.max(0, Math.min(world.depth - 1, currentY));

		// Add thickness based on size multiplier
		if (sizeMultiplier > 1.0) {
			const thickness = Math.round(sizeMultiplier);
			for (let dx = -thickness; dx <= thickness; dx++) {
				for (let dy = -thickness; dy <= thickness; dy++) {
					const thickX = currentX + dx;
					const thickY = currentY + dy;
					if (
						dx * dx + dy * dy <= thickness * thickness && // Circular thickness
						isValidGroundCell(world, thickX, thickY, asteroidShape, holePattern, tunnelSet)
					) {
						world.grid[thickX][thickY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
						// Record thickness cells as part of the path too
						pathCoords.push({ x: thickX, y: thickY, step: step, isThickness: true });
					}
				}
			}
		}
	}

	// Store this path for crystal placement
	if (pathCoords.length > 0) {
		world.veinPathCoords[color].push(pathCoords);
	}
}

function isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet) {
	if (x < 0 || x >= world.width || y < 0 || y >= world.depth) return false;
	if (!asteroidShape(x, y) || holePattern(x, y) || y <= world.airGap) return false;
	if (tunnelSet.has(`${x},${y}`)) return false;
	return world.grid[x] && world.grid[x][y] && world.grid[x][y].terrain !== 'space';
}

// Vein Pattern Generation Functions

function generateOrganicVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex = 0) {
	// Original organic winding vein pattern (default behavior)
	for (let i = 0; i < numVeins; i++) {
		let startX,
			startY,
			attempts = 0;
		do {
			startX = Math.floor(Math.random() * world.width);
			startY = Math.floor(Math.random() * world.depth);
			attempts++;
		} while (attempts < 100 && !isValidGroundCell(world, startX, startY, asteroidShape, holePattern, tunnelSet));

		if (attempts >= 100) continue;
		generateSingleVeinPath(world, startX, startY, color, size, asteroidShape, holePattern, tunnelSet, veinIndex);
	}
}

function generateFractalVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet) {
	// Branching fractal pattern - fewer starting points but with branches
	const mainVeins = Math.max(1, Math.round(numVeins / 3));

	for (let i = 0; i < mainVeins; i++) {
		let startX,
			startY,
			attempts = 0;
		do {
			startX = Math.floor(Math.random() * world.width);
			startY = Math.floor(Math.random() * world.depth);
			attempts++;
		} while (attempts < 100 && !isValidGroundCell(world, startX, startY, asteroidShape, holePattern, tunnelSet));

		if (attempts >= 100) continue;

		// Generate main trunk
		generateBranchingVein(world, startX, startY, color, size, asteroidShape, holePattern, tunnelSet, 0);
	}
}

function generateBranchingVein(world, startX, startY, color, size, asteroidShape, holePattern, tunnelSet, depth) {
	if (depth > 3) return; // Limit recursion depth

	const branchLength = Math.round((8 + Math.random() * 8) * size * (1 - depth * 0.2));
	let currentX = startX;
	let currentY = startY;
	let direction = Math.random() * Math.PI * 2;

	for (let step = 0; step < branchLength; step++) {
		if (isValidGroundCell(world, currentX, currentY, asteroidShape, holePattern, tunnelSet)) {
			world.grid[currentX][currentY].ground = {
				type: color,
				veinSource: true,
				veinIndex: 0, // Track which specific vein created this cell
			};
		}

		// Add branching chance
		if (step > 3 && Math.random() < 0.15 && depth < 2) {
			const branchDirection = direction + (Math.random() - 0.5) * Math.PI;
			const branchX = currentX + Math.round(Math.cos(branchDirection) * 2);
			const branchY = currentY + Math.round(Math.sin(branchDirection) * 2);
			generateBranchingVein(
				world,
				branchX,
				branchY,
				color,
				size * 0.8,
				asteroidShape,
				holePattern,
				tunnelSet,
				depth + 1,
			);
		}

		direction += (Math.random() - 0.5) * 0.3;
		currentX += Math.round(Math.cos(direction));
		currentY += Math.round(Math.sin(direction));
		currentX = Math.max(0, Math.min(world.width - 1, currentX));
		currentY = Math.max(0, Math.min(world.depth - 1, currentY));
	}
}

function generateLayeredVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Horizontal layered pattern
	const numLayers = Math.max(1, Math.round(numVeins / 2));

	for (let i = 0; i < numLayers; i++) {
		const layerY = Math.floor(world.airGap + 10 + Math.random() * (world.depth - world.airGap - 20));
		const layerThickness = Math.max(1, Math.round(2 * size));

		for (let x = 0; x < world.width; x++) {
			for (let dy = -layerThickness; dy <= layerThickness; dy++) {
				const y = layerY + dy + Math.round((Math.random() - 0.5) * 4); // Some vertical noise
				if (isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.8) {
					// 80% density for natural look
					world.grid[x][y].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
				}
			}
		}
	}
}

function generateRadialVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Radial pattern from center outward
	const centerX = Math.floor(world.width / 2);
	const centerY = Math.floor(world.depth / 2);
	const numSpokes = Math.max(3, Math.round(numVeins / 2));

	for (let i = 0; i < numSpokes; i++) {
		const angle = (i / numSpokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
		const spokeLength = Math.round((20 + Math.random() * 20) * size);

		let currentX = centerX;
		let currentY = centerY;

		for (let step = 0; step < spokeLength; step++) {
			if (isValidGroundCell(world, currentX, currentY, asteroidShape, holePattern, tunnelSet)) {
				world.grid[currentX][currentY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
			}

			// Add some thickness and variation
			const thickness = Math.max(1, Math.round(size));
			for (let dx = -thickness; dx <= thickness; dx++) {
				for (let dy = -thickness; dy <= thickness; dy++) {
					const thickX = currentX + dx;
					const thickY = currentY + dy;
					if (
						dx * dx + dy * dy <= thickness * thickness &&
						isValidGroundCell(world, thickX, thickY, asteroidShape, holePattern, tunnelSet) &&
						Math.random() < 0.7
					) {
						world.grid[thickX][thickY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
					}
				}
			}

			currentX += Math.round(Math.cos(angle) + (Math.random() - 0.5) * 0.3);
			currentY += Math.round(Math.sin(angle) + (Math.random() - 0.5) * 0.3);
			currentX = Math.max(0, Math.min(world.width - 1, currentX));
			currentY = Math.max(0, Math.min(world.depth - 1, currentY));
		}
	}
}

function generateScatteredVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	console.log(`🔍 SCATTERED DEBUG: Generating scattered veins for ${color} (${numVeins} veins, size ${size})`);

	// Small scattered clusters
	const numClusters = Math.max(1, Math.round(numVeins * 2));
	const clusterSize = Math.max(2, Math.round(4 * size));

	// Initialize path coords array for crystal placement
	if (!world.veinPathCoords) world.veinPathCoords = {};
	if (!world.veinPathCoords[color]) world.veinPathCoords[color] = [];

	for (let i = 0; i < numClusters; i++) {
		let centerX,
			centerY,
			attempts = 0;
		do {
			centerX = Math.floor(Math.random() * world.width);
			centerY = Math.floor(Math.random() * world.depth);
			attempts++;
		} while (attempts < 100 && !isValidGroundCell(world, centerX, centerY, asteroidShape, holePattern, tunnelSet));

		if (attempts >= 100) continue;

		// Track path coordinates for this cluster
		const clusterPath = [];

		// Create circular cluster
		for (let dx = -clusterSize; dx <= clusterSize; dx++) {
			for (let dy = -clusterSize; dy <= clusterSize; dy++) {
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (distance <= clusterSize && Math.random() < (1 - distance / clusterSize) * 0.8) {
					const x = centerX + dx;
					const y = centerY + dy;
					if (isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet)) {
						world.grid[x][y].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
						// Record this position as part of the cluster path
						clusterPath.push({ x: x, y: y, step: Math.round(distance), isCluster: true });
					}
				}
			}
		}

		// Store this cluster as a path for crystal placement
		if (clusterPath.length > 0) {
			world.veinPathCoords[color].push(clusterPath);
		}
	}

	console.log(`🔍 SCATTERED RESULT: ${color} recorded ${world.veinPathCoords[color].length} cluster paths`);
}

function generateConcentricVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Concentric rings around random centers
	const numCenters = Math.max(1, Math.round(numVeins / 3));

	for (let i = 0; i < numCenters; i++) {
		let centerX,
			centerY,
			attempts = 0;
		do {
			centerX = Math.floor(Math.random() * world.width);
			centerY = Math.floor(Math.random() * world.depth);
			attempts++;
		} while (attempts < 100 && !isValidGroundCell(world, centerX, centerY, asteroidShape, holePattern, tunnelSet));

		if (attempts >= 100) continue;

		const maxRadius = Math.round((15 + Math.random() * 20) * size);
		const ringThickness = Math.max(1, Math.round(2 * size));

		// Create multiple concentric rings
		for (let radius = ringThickness; radius <= maxRadius; radius += ringThickness + 2) {
			for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
				const x = Math.round(centerX + Math.cos(angle) * radius);
				const y = Math.round(centerY + Math.sin(angle) * radius);

				// Add some thickness to the ring
				for (let dr = -Math.round(ringThickness / 2); dr <= Math.round(ringThickness / 2); dr++) {
					const ringX = x + Math.round(Math.cos(angle) * dr);
					const ringY = y + Math.round(Math.sin(angle) * dr);

					if (isValidGroundCell(world, ringX, ringY, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.7) {
						world.grid[ringX][ringY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
					}
				}
			}
		}
	}
}

function generateGridVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet) {
	// Crystalline grid pattern
	const gridSpacing = Math.max(8, Math.round(12 / size));
	const lineThickness = Math.max(1, Math.round(2 * size));

	// Vertical lines
	for (let x = gridSpacing; x < world.width; x += gridSpacing) {
		const jitter = Math.round((Math.random() - 0.5) * gridSpacing * 0.3);
		const actualX = x + jitter;

		for (let y = world.airGap + 5; y < world.depth - 5; y++) {
			for (let thickness = -Math.round(lineThickness / 2); thickness <= Math.round(lineThickness / 2); thickness++) {
				const lineX = actualX + thickness;
				if (isValidGroundCell(world, lineX, y, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.8) {
					world.grid[lineX][y].ground = { type: color, veinSource: true, veinIndex: 0 };
				}
			}
		}
	}

	// Horizontal lines
	for (let y = world.airGap + gridSpacing; y < world.depth; y += gridSpacing) {
		const jitter = Math.round((Math.random() - 0.5) * gridSpacing * 0.3);
		const actualY = y + jitter;

		for (let x = 5; x < world.width - 5; x++) {
			for (let thickness = -Math.round(lineThickness / 2); thickness <= Math.round(lineThickness / 2); thickness++) {
				const lineY = actualY + thickness;
				if (isValidGroundCell(world, x, lineY, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.8) {
					world.grid[x][lineY].ground = { type: color, veinSource: true, veinIndex: 0 };
				}
			}
		}
	}
}

function generateSpiralVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Spiral arms from center
	const centerX = Math.floor(world.width / 2);
	const centerY = Math.floor(world.depth / 2);
	const numArms = Math.max(2, Math.round(numVeins / 2));

	for (let arm = 0; arm < numArms; arm++) {
		const armAngle = (arm / numArms) * Math.PI * 2;
		const maxRadius = Math.min(world.width, world.depth) / 2;
		const armThickness = Math.max(1, Math.round(2 * size));

		for (let radius = 5; radius < maxRadius; radius += 0.5) {
			const spiralAngle = armAngle + radius * 0.1; // Spiral factor
			const x = Math.round(centerX + Math.cos(spiralAngle) * radius);
			const y = Math.round(centerY + Math.sin(spiralAngle) * radius);

			// Add thickness
			for (let dx = -armThickness; dx <= armThickness; dx++) {
				for (let dy = -armThickness; dy <= armThickness; dy++) {
					if (dx * dx + dy * dy <= armThickness * armThickness) {
						const spiralX = x + dx;
						const spiralY = y + dy;
						if (
							isValidGroundCell(world, spiralX, spiralY, asteroidShape, holePattern, tunnelSet) &&
							Math.random() < 0.8
						) {
							world.grid[spiralX][spiralY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
						}
					}
				}
			}
		}
	}
}

function generateFaultVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet) {
	// Fault pattern - ultra-subtle traces, mostly empty at low density

	console.log(`     Fault debug: numVeins=${numVeins}, checking density threshold`);

	// Only show faults at moderate to high densities, nearly empty at low density
	if (numVeins < 8) {
		console.log(`     Fault debug: numVeins=${numVeins} below threshold - generating ultra-minimal traces`);
		// For low vein counts, place very few scattered pixels
		const scatteredPixels = Math.max(0, Math.round(numVeins * 0.02)); // Even fewer
		console.log(`     Fault debug: Will attempt ${scatteredPixels} scattered pixels`);

		for (let i = 0; i < scatteredPixels; i++) {
			const x = Math.floor(Math.random() * world.width);
			const y = Math.floor(Math.random() * world.depth);

			if (isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.001) {
				// Ultra-extremely rare
				world.grid[x][y].ground = { type: color };
				console.log(`     Fault debug: Placed minimal pixel at (${x},${y})`);
			}
		}
		return;
	}

	const maxFaults = 2; // Maximum 2 fault traces
	const faultLength = Math.min(6, Math.max(2, size * 1.5)); // Short traces

	// Scale based on vein count with threshold
	const numFaults = Math.max(1, Math.min(maxFaults, Math.round(numVeins / 10)));

	console.log(`     Fault debug: numVeins=${numVeins}, numFaults=${numFaults}, faultLength=${faultLength}`);

	for (let i = 0; i < numFaults; i++) {
		// Random starting point
		const startX = Math.random() * (world.width - 12) + 6;
		const startY = Math.random() * (world.depth - 12) + 6;

		// Random direction for fault trace
		const angle = Math.random() * Math.PI * 2;
		const endX = startX + Math.cos(angle) * faultLength;
		const endY = startY + Math.sin(angle) * faultLength;

		// Draw minimal fault trace with ultra-sparse fill
		const steps = Math.max(1, faultLength);
		for (let step = 0; step <= steps; step += 4) {
			// Every 4th pixel
			const t = step / steps;
			const x = Math.round(startX + (endX - startX) * t);
			const y = Math.round(startY + (endY - startY) * t);

			// Very minimal fill probability
			const fillProbability = 0.005; // Extremely sparse

			if (isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet) && Math.random() < fillProbability) {
				world.grid[x][y].ground = { type: color, veinSource: true, veinIndex: 0 };
			}
		}
	}
}

function generateLightningVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet) {
	// Jagged lightning-like branching patterns
	for (let i = 0; i < numVeins; i++) {
		let startX,
			startY,
			attempts = 0;
		do {
			startX = Math.floor(Math.random() * world.width);
			startY = Math.floor(world.airGap + Math.random() * (world.depth - world.airGap));
			attempts++;
		} while (attempts < 100 && !isValidGroundCell(world, startX, startY, asteroidShape, holePattern, tunnelSet));

		if (attempts >= 100) continue;

		generateLightningBranch(
			world,
			startX,
			startY,
			color,
			size,
			asteroidShape,
			holePattern,
			tunnelSet,
			0,
			Math.random() * Math.PI * 2,
		);
	}
}

function generateLightningBranch(
	world,
	startX,
	startY,
	color,
	size,
	asteroidShape,
	holePattern,
	tunnelSet,
	depth,
	direction,
) {
	if (depth > 4) return;

	const branchLength = Math.round((6 + Math.random() * 12) * size);
	let currentX = startX;
	let currentY = startY;

	for (let step = 0; step < branchLength; step++) {
		if (isValidGroundCell(world, currentX, currentY, asteroidShape, holePattern, tunnelSet)) {
			world.grid[currentX][currentY].ground = {
				type: color,
				veinSource: true,
				veinIndex: 0, // Track which specific vein created this cell
			};
		}

		// Jagged movement with sudden direction changes
		if (Math.random() < 0.3) {
			direction += (Math.random() - 0.5) * Math.PI;
		}

		// Branch randomly
		if (step > 3 && Math.random() < 0.2) {
			const branchDirection = direction + (Math.random() - 0.5) * Math.PI * 0.8;
			generateLightningBranch(
				world,
				currentX,
				currentY,
				color,
				size * 0.7,
				asteroidShape,
				holePattern,
				tunnelSet,
				depth + 1,
				branchDirection,
			);
		}

		currentX += Math.round(Math.cos(direction) + (Math.random() - 0.5) * 2);
		currentY += Math.round(Math.sin(direction) + (Math.random() - 0.5) * 2);
		currentX = Math.max(0, Math.min(world.width - 1, currentX));
		currentY = Math.max(0, Math.min(world.depth - 1, currentY));
	}
}

function generateCellularVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Honeycomb/cellular pattern
	const cellSize = Math.max(6, Math.round(8 / size));
	const cellThickness = Math.max(1, Math.round(1.5 * size));

	for (let y = world.airGap; y < world.depth; y += cellSize) {
		for (let x = 0; x < world.width; x += cellSize) {
			// Offset every other row for hexagonal packing
			const offsetX = ((y - world.airGap) / cellSize) % 2 === 0 ? 0 : cellSize / 2;
			const centerX = x + offsetX + cellSize / 2;
			const centerY = y + cellSize / 2;

			// Draw cell walls (hexagon approximated as circle)
			const radius = cellSize / 2;
			for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
				for (let r = radius - cellThickness; r <= radius + cellThickness; r++) {
					const wallX = Math.round(centerX + Math.cos(angle) * r);
					const wallY = Math.round(centerY + Math.sin(angle) * r);

					if (isValidGroundCell(world, wallX, wallY, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.7) {
						world.grid[wallX][wallY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
					}
				}
			}
		}
	}
}

function generateFlowVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Curved parallel flowing lines
	const numFlows = Math.max(1, Math.round(numVeins / 2));
	const flowThickness = Math.max(1, Math.round(2 * size));

	for (let i = 0; i < numFlows; i++) {
		const startY = world.airGap + Math.random() * (world.depth - world.airGap);
		const flowAmplitude = Math.round(5 + Math.random() * 10 * size);
		const waveLength = Math.round(20 + Math.random() * 20);

		for (let x = 0; x < world.width; x++) {
			const waveY = Math.round(startY + Math.sin((x / waveLength) * Math.PI * 2) * flowAmplitude);

			for (let thickness = -flowThickness; thickness <= flowThickness; thickness++) {
				const flowY = waveY + thickness;
				const flowX = x + Math.round((Math.random() - 0.5) * 2); // Small horizontal variation

				if (isValidGroundCell(world, flowX, flowY, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.8) {
					world.grid[flowX][flowY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
				}
			}
		}
	}
}

function generatePercolationVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Random walk connected paths like water seepage
	const numPaths = Math.max(1, Math.round(numVeins));
	const pathLength = Math.round((30 + Math.random() * 40) * size);

	for (let i = 0; i < numPaths; i++) {
		let currentX,
			currentY,
			attempts = 0;
		do {
			currentX = Math.floor(Math.random() * world.width);
			currentY = Math.floor(world.airGap + Math.random() * (world.depth - world.airGap));
			attempts++;
		} while (attempts < 100 && !isValidGroundCell(world, currentX, currentY, asteroidShape, holePattern, tunnelSet));

		if (attempts >= 100) continue;

		const visited = new Set();
		for (let step = 0; step < pathLength; step++) {
			const key = `${currentX},${currentY}`;
			if (visited.has(key)) break;
			visited.add(key);

			if (isValidGroundCell(world, currentX, currentY, asteroidShape, holePattern, tunnelSet)) {
				world.grid[currentX][currentY].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
			}

			// Random walk with slight downward bias
			const directions = [
				{ dx: 0, dy: 1, weight: 2 }, // down (preferred)
				{ dx: 1, dy: 0, weight: 1 }, // right
				{ dx: -1, dy: 0, weight: 1 }, // left
				{ dx: 0, dy: -1, weight: 1 }, // up
				{ dx: 1, dy: 1, weight: 1 }, // diagonal down-right
				{ dx: -1, dy: 1, weight: 1 }, // diagonal down-left
			];

			const totalWeight = directions.reduce((sum, dir) => sum + dir.weight, 0);
			let random = Math.random() * totalWeight;

			for (const dir of directions) {
				random -= dir.weight;
				if (random <= 0) {
					currentX += dir.dx;
					currentY += dir.dy;
					break;
				}
			}

			currentX = Math.max(0, Math.min(world.width - 1, currentX));
			currentY = Math.max(0, Math.min(world.depth - 1, currentY));
		}
	}
}

function generateMazeVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Connected pathways forming maze-like networks
	const cellSize = Math.max(4, Math.round(6 / size));

	// Create a simple maze grid
	const mazeWidth = Math.floor(world.width / cellSize);
	const mazeHeight = Math.floor((world.depth - world.airGap) / cellSize);
	const maze = Array(mazeHeight)
		.fill()
		.map(() => Array(mazeWidth).fill(false));

	// Generate maze using random walk
	const stack = [];
	let currentMazeX = Math.floor(Math.random() * mazeWidth);
	let currentMazeY = Math.floor(Math.random() * mazeHeight);
	maze[currentMazeY][currentMazeX] = true;

	while (true) {
		const neighbors = [];
		const directions = [
			[0, -2],
			[2, 0],
			[0, 2],
			[-2, 0],
		];

		for (const [dx, dy] of directions) {
			const nx = currentMazeX + dx;
			const ny = currentMazeY + dy;
			if (nx >= 0 && nx < mazeWidth && ny >= 0 && ny < mazeHeight && !maze[ny][nx]) {
				neighbors.push([nx, ny, currentMazeX + dx / 2, currentMazeY + dy / 2]);
			}
		}

		if (neighbors.length > 0) {
			const [nx, ny, wallX, wallY] = neighbors[Math.floor(Math.random() * neighbors.length)];
			maze[ny][nx] = true;
			maze[wallY][wallX] = true;
			stack.push([currentMazeX, currentMazeY]);
			currentMazeX = nx;
			currentMazeY = ny;
		} else if (stack.length > 0) {
			[currentMazeX, currentMazeY] = stack.pop();
		} else {
			break;
		}
	}

	// Convert maze to world coordinates
	for (let mazeY = 0; mazeY < mazeHeight; mazeY++) {
		for (let mazeX = 0; mazeX < mazeWidth; mazeX++) {
			if (maze[mazeY][mazeX]) {
				const worldX = mazeX * cellSize;
				const worldY = world.airGap + mazeY * cellSize;

				for (let dx = 0; dx < cellSize; dx++) {
					for (let dy = 0; dy < cellSize; dy++) {
						const x = worldX + dx;
						const y = worldY + dy;

						if (isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet) && Math.random() < 0.9) {
							world.grid[x][y].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
						}
					}
				}
			}
		}
	}
}

function generateNoiseBandVeins(world, color, size, numVeins, asteroidShape, holePattern, tunnelSet, veinIndex) {
	// Wavy horizontal stripes with organic variation
	const numBands = Math.max(1, Math.round(numVeins));
	const bandHeight = Math.max(3, Math.round(6 * size));

	for (let i = 0; i < numBands; i++) {
		const bandY = world.airGap + Math.random() * (world.depth - world.airGap - bandHeight);
		const waveAmplitude = Math.round(3 + Math.random() * 5 * size);
		const waveLength = Math.round(15 + Math.random() * 25);
		const noiseScale = size * 0.5;

		for (let x = 0; x < world.width; x++) {
			// Primary wave
			const waveOffset = Math.sin((x / waveLength) * Math.PI * 2) * waveAmplitude;
			// Add noise for organic variation
			const noiseOffset = (Math.random() - 0.5) * noiseScale * 4;

			const centerY = Math.round(bandY + waveOffset + noiseOffset);

			for (let dy = -bandHeight; dy <= bandHeight; dy++) {
				const y = centerY + dy;
				const fadeDistance = Math.abs(dy) / bandHeight;
				const probability = Math.max(0, (1 - fadeDistance) * 0.9);

				if (isValidGroundCell(world, x, y, asteroidShape, holePattern, tunnelSet) && Math.random() < probability) {
					world.grid[x][y].ground = { type: color, veinSource: true, veinIndex: veinIndex || 0 };
				}
			}
		}
	}
}

function generatePureMineralCrystals(world) {
	const crystals = [];

	// Handle vein crystals (existing functionality)
	console.log(`💎 VEIN PATHS DEBUG:`, {
		hasVeinPaths: !!world.veinPaths,
		veinPathsType: typeof world.veinPaths,
		veinPathsLength: world.veinPaths ? world.veinPaths.length : 'N/A',
		veinPaths: world.veinPaths,
	});

	console.log('🔍 EXECUTION CHECKPOINT: About to check world.veinData');
	console.log('💎 CRYSTAL DEBUG: world.veinData =', world.veinData ? world.veinData.length : 'undefined');

	// Enhanced debugging for conditional check
	const hasVeinData = !!world.veinData;
	const veinDataLength = world.veinData ? world.veinData.length : 0;
	const lengthGreaterThanZero = veinDataLength > 0;
	console.log('🔍 CONDITIONAL DEBUG:', {
		hasVeinData,
		veinDataLength,
		lengthGreaterThanZero,
		condition: hasVeinData && lengthGreaterThanZero,
	});

	if (world.veinData && world.veinData.length > 0) {
		console.log(`💎 Generating pure mineral crystals from ${world.veinData.length} vein instances`);

		// Process each vein instance individually (not grouped by color)
		world.veinData.forEach((veinInfo, index) => {
			if (!veinInfo || !veinInfo.yield || veinInfo.yield <= 0) return;

			console.log(`💎 Generating crystals for ${veinInfo.color} vein[${index}] (yield: ${veinInfo.yield})`);

			// Find all ground cells that were placed by THIS SPECIFIC vein instance
			const matchingCells = [];
			for (let x = 0; x < world.width; x++) {
				for (let y = 0; y < world.depth; y++) {
					const cell = world.grid[x]?.[y];
					if (
						cell &&
						cell.ground &&
						cell.ground.type === veinInfo.color &&
						cell.ground.veinSource === true &&
						cell.ground.veinIndex === index
					) {
						// Match specific vein instance
						matchingCells.push({ x, y });
					}
				}
			}

			if (matchingCells.length === 0) {
				console.log(`   No ${veinInfo.color} ground cells found`);
				return;
			}

			console.log(`   Found ${matchingCells.length} ${veinInfo.color} ground cells`);

			// Generate crystals in matching cells based on yield
			let crystalsPlaced = 0;
			matchingCells.forEach(cell => {
				const yieldValue = veinInfo.yield; // Use this vein instance's specific yield

				// Base probability of getting at least one crystal - affected by yield
				const baseProbability = Math.min(0.1 + yieldValue * 0.2, 0.8); // 10% base + yield scaling, max 80%

				if (Math.random() < baseProbability) {
					// Place at least one crystal
					crystals.push({
						x: cell.x,
						y: cell.y,
						type: `mineral_${veinInfo.color}`,
						color: veinInfo.color,
					});
					crystalsPlaced++;

					// Higher yield = higher chance of additional crystals
					let additionalCrystals = 0;

					// Each 1.0 yield gives ~50% chance of one more crystal
					for (let i = 1; i < 4; i++) {
						// Max 3 additional (4 total)
						const additionalChance = Math.max(0, (yieldValue - i + 0.5) * 0.5);
						if (Math.random() < additionalChance) {
							crystals.push({
								x: cell.x,
								y: cell.y,
								type: `mineral_${veinInfo.color}`,
								color: veinInfo.color,
							});
							additionalCrystals++;
							crystalsPlaced++;
						}
					}

					if (additionalCrystals > 0) {
						console.log(`   🌟 Cell (${cell.x},${cell.y}) got ${additionalCrystals + 1} ${veinInfo.color} crystals`);
					}
				}
			});

			console.log(`   Placed ${crystalsPlaced} ${veinInfo.color} crystals in ${matchingCells.length} possible cells`);
		});
	}

	return crystals;
}

/**
 * Generate geological formations (unified ground colors + mineral veins)
 * This combines the ground color generation with vein pattern generation
 * for a more cohesive geological system
 */
function generateGeologicalFormations(world, worldConfig, asteroidShape, holePattern, tunnelPositions) {
	console.log('🏔️  Generating unified geological formations...');

	// Default to vein-based ground format if not specified
	const groundFormat = worldConfig.groundFormat || 'veins';
	console.log('🔍 DEBUG: Using ground format:', groundFormat);
	if (groundFormat === 'veins') {
		console.log('🎯 Using vein-based ground generation!');
		return generateVeinBasedGround(world, worldConfig, asteroidShape, holePattern, tunnelPositions);
	}

	// Legacy percentage-based formats are no longer supported
	console.error(
		'❌ ERROR: Only vein-based ground format is supported. Please update your world configuration to use the new format.',
	);
	console.error('🔧 Expected format: { base: "color", veins: [{ density: X, yield: Y, size: Z, color: "color" }] }');

	// Fallback: create a simple white base if no valid format is found
	console.log('⚠️  Applying fallback: white ground base');
	for (let x = 0; x < world.width; x++) {
		for (let y = 0; y < world.depth; y++) {
			if (!world.grid[x]) world.grid[x] = {};
			if (!world.grid[x][y]) {
				world.grid[x][y] = { terrain: 'solid', ground: null };
			}

			// Apply asteroid shape and hole patterns
			const shapeResult = asteroidShape(x, y);
			const holeResult = holePattern(x, y);
			const airGapResult = y <= world.airGap;

			if (!shapeResult || holeResult || airGapResult) {
				if (x === 30 && y === 30) {
					// Debug single point
					console.log(`🎯 Grid (30,30): shape=${shapeResult}, hole=${holeResult}, airGap=${airGapResult} → SPACE`);
				}
				world.grid[x][y].terrain = 'space';
				world.grid[x][y].ground = null;
			} else {
				// Set white ground for all valid cells
				const tunnelSet = new Set((tunnelPositions || []).map(pos => `${pos.x},${pos.y}`));
				if (!tunnelSet.has(`${x},${y}`)) {
					world.grid[x][y].ground = { type: 'white' };
				}
			}
		}
	}
}

/**
 * Place aliens using budget system
 */
function placeAliens(world, worldConfig) {
	const alienConfig = worldConfig.aliens;
	if (!alienConfig || !alienConfig.budget || alienConfig.budget[0] === 0) {
		console.log('👾 Placing 0 aliens...');
		world.aliens = {}; // Initialize empty aliens object
		return;
	}

	const budget = randInt(alienConfig.budget[0], alienConfig.budget[1]);
	console.log(`👾 Placing ${budget} aliens...`);

	// Initialize aliens object for level editor and other systems
	world.aliens = {};

	// Import alien types from constants
	const { aliens } = require('../constants/aliens.js');

	// Find valid placement locations (enclosed caves with ground support)
	const validLocations = [];
	for (let x = 0; x < world.width; x++) {
		for (let y = world.airGap + 2; y < world.depth - 1; y++) {
			// Start below air gap, leave room to check above/below
			const cell = world.grid[x] && world.grid[x][y];
			const cellBelow = world.grid[x] && world.grid[x][y + 1];

			// Aliens need: open space + no hazards + solid ground below + roof above (enclosed cave)
			if (
				cell &&
				cell.terrain === 'space' &&
				(!cell.hazards || cell.hazards.length === 0) &&
				cellBelow &&
				cellBelow.terrain !== 'space'
			) {
				// Check for roof above (solid ground somewhere above within reasonable distance)
				let hasRoof = false;
				for (let checkY = y - 1; checkY >= Math.max(0, y - 10); checkY--) {
					if (world.grid[x] && world.grid[x][checkY] && world.grid[x][checkY].terrain !== 'space') {
						hasRoof = true;
						break;
					}
				}

				if (hasRoof) {
					validLocations.push({ x, y });
				}
			}
		}
	}

	if (validLocations.length === 0) {
		console.log('  ⚠️  No valid placement locations for aliens');
		return;
	}

	// Sort locations by depth (prefer deeper locations)
	validLocations.sort((a, b) => b.y - a.y);

	// Determine alien types to place
	const alienTypesToPlace = [];
	if (alienConfig.types && typeof alienConfig.types === 'object') {
		// World has specific alien type distribution
		const totalWeight = Object.values(alienConfig.types).reduce((sum, weight) => sum + weight, 0);
		for (let i = 0; i < budget; i++) {
			const rand = Math.random() * totalWeight;
			let currentWeight = 0;
			for (const [alienType, weight] of Object.entries(alienConfig.types)) {
				currentWeight += weight;
				if (rand <= currentWeight) {
					alienTypesToPlace.push(alienType);
					break;
				}
			}
		}
	} else {
		// No specific types - use default selection
		const defaultAlienTypes = ['rock_mite', 'hive_drone', 'psykick_scout'];
		for (let i = 0; i < budget; i++) {
			alienTypesToPlace.push(defaultAlienTypes[Math.floor(Math.random() * defaultAlienTypes.length)]);
		}
	}

	// Place the aliens
	let placedCount = 0;
	const placedAlienLocations = [];
	const minDistance = 8; // Minimum distance between aliens

	for (const alienType of alienTypesToPlace) {
		if (validLocations.length === 0) break;

		// Check if alien type exists
		if (!aliens[alienType]) {
			console.log(`  ⚠️  Unknown alien type: ${alienType}, skipping`);
			continue;
		}

		// Find a location that's far enough from already-placed aliens
		let location = null;
		let attempts = 0;
		const maxAttempts = 20;

		while (attempts < maxAttempts && validLocations.length > 0) {
			// Pick from deeper locations (top 30% of sorted list, which are deepest)
			const deeperPoolSize = Math.max(1, Math.floor(validLocations.length * 0.3));
			const locationIndex = Math.floor(Math.random() * deeperPoolSize);
			const candidate = validLocations[locationIndex];

			// Check distance from all already-placed aliens
			let tooClose = false;
			for (const placedLoc of placedAlienLocations) {
				const distance = Math.sqrt(Math.pow(candidate.x - placedLoc.x, 2) + Math.pow(candidate.y - placedLoc.y, 2));
				if (distance < minDistance) {
					tooClose = true;
					break;
				}
			}

			if (!tooClose || attempts >= maxAttempts - 1) {
				// Either far enough away, or we've tried enough times
				location = candidate;
				validLocations.splice(locationIndex, 1);
				break;
			}

			attempts++;
		}

		if (!location) {
			console.log(`  ⚠️  Could not find spread-out location for ${alienType}`);
			continue;
		}

		// Initialize aliens array if needed
		// Create alien instance as a hazard
		const alienInstance = {
			id: `alien_${placedCount}`,
			name: alienType,
			type: 'alien',
			alienType: alienType,
			health: aliens[alienType].health,
			behavior: { ...aliens[alienType].behavior },
			spawnTime: 0,
			x: location.x,
			y: location.y,
		};

		// Add to grid hazards (for game logic)
		world.grid[location.x][location.y].hazards.push(alienInstance);

		// Add to world.aliens object (for level editor and tracking)
		world.aliens[alienInstance.id] = alienInstance;

		placedAlienLocations.push(location); // Track for distance checking
		placedCount++;

		console.log(`  👾 Placed ${alienType} at (${location.x}, ${location.y})`);
	}

	console.log(`  ✅ Placed ${placedCount}/${budget} aliens successfully`);
}

/**
 * Place items using budget system
 */
function placeItems(world, worldConfig) {
	const itemConfig = worldConfig.items;
	if (!itemConfig || !itemConfig.budget || itemConfig.budget[0] === 0) {
		console.log('📦 Placing 0 items...');
		return;
	}

	const budget = randInt(itemConfig.budget[0], itemConfig.budget[1]);
	console.log(`📦 Placing ${budget} items...`);

	// Find valid placement locations (empty space cells with supporting ground below)
	const validLocations = [];
	for (let x = 0; x < world.width; x++) {
		for (let y = 0; y < world.depth; y++) {
			const cell = world.grid[x] && world.grid[x][y];
			const cellBelow = world.grid[x] && world.grid[x][y + 1];

			// Items should go in empty space cells that have ground support below them
			if (
				cell &&
				cell.terrain !== 'space' &&
				!cell.ground &&
				y > world.airGap &&
				cellBelow &&
				cellBelow.terrain !== 'space' &&
				cellBelow.ground
			) {
				validLocations.push({ x, y });
			}
		}
	}

	if (validLocations.length === 0) {
		console.log('  ⚠️ No valid locations found for item placement');
		return;
	}

	// Place items based on type distribution
	let remainingBudget = budget;
	const placedItems = [];
	const minDistance = 6; // Minimum distance between items

	while (remainingBudget > 0 && validLocations.length > 0) {
		// Choose random item type based on weights
		let itemTypes = itemConfig.types || { oil: 100 };

		// Validate that itemTypes is a proper object with valid weights
		if (!itemTypes || typeof itemTypes !== 'object' || Object.keys(itemTypes).length === 0) {
			console.log('⚠️  Invalid item types, using default oil:', itemTypes);
			itemTypes = { oil: 100 };
		} else {
			// Check if weights sum to 100 and all keys are valid
			const values = Object.values(itemTypes);
			const sum = values.reduce((a, b) => a + b, 0);
			const hasInvalidKeys = Object.keys(itemTypes).some(
				key => key.includes('undefined') || key.match(/^\d+/) || key === '0oil',
			);

			if (sum !== 100 || hasInvalidKeys) {
				console.log('⚠️  Invalid item weights or keys, using default oil:', itemTypes, 'sum:', sum);
				itemTypes = { oil: 100 };
			}
		}

		const itemType = weightedChance(itemTypes);

		// Find a location that's far enough from already-placed items
		let location = null;
		let attempts = 0;
		const maxAttempts = 15;

		while (attempts < maxAttempts && validLocations.length > 0) {
			const locationIndex = Math.floor(Math.random() * validLocations.length);
			const candidate = validLocations[locationIndex];

			// Check distance from all already-placed items
			let tooClose = false;
			for (const placedLoc of placedItems) {
				const distance = Math.sqrt(Math.pow(candidate.x - placedLoc.x, 2) + Math.pow(candidate.y - placedLoc.y, 2));
				if (distance < minDistance) {
					tooClose = true;
					break;
				}
			}

			if (!tooClose || attempts >= maxAttempts - 1) {
				// Either far enough away, or we've tried enough times
				location = candidate;
				validLocations.splice(locationIndex, 1);
				break;
			}

			attempts++;
		}

		if (!location) {
			console.log(`  ⚠️ Could not find spread-out location for ${itemType}`);
			break;
		}

		// Place item
		if (!world.grid[location.x][location.y].items) {
			world.grid[location.x][location.y].items = [];
		}
		world.grid[location.x][location.y].items.push({ name: itemType });

		remainingBudget--;
		placedItems.push(location);
		console.log(
			`  Placed ${itemType} at (${location.x}, ${location.y}) - Ground: [${world.grid[location.x][location.y].ground?.type}]`,
		);
	}
}

/**
 * Check if a cave space is enclosed (deep inside the asteroid) rather than exposed to surface
 * This helps avoid placing hazards in surface craters or open areas
 */
function isEnclosedCave(world, x, y, asteroidShape) {
	// Check minimum depth below surface - avoid only the shallowest areas
	if (y <= world.airGap + 1) return false;

	// Check if the space has solid ground above it within reasonable distance
	// This helps distinguish between deep caves vs surface craters
	let hasRoofAbove = false;
	for (let checkY = y - 1; checkY >= world.airGap + 1; checkY--) {
		if (world.grid[x] && world.grid[x][checkY] && world.grid[x][checkY].terrain !== 'space') {
			hasRoofAbove = true;
			break;
		}
		// If we go too far up without finding a roof, it's probably exposed
		if (y - checkY > 12) break; // Increased from 8 to allow deeper caves
	}

	if (!hasRoofAbove) return false;

	// Check for distance from asteroid edge - hazards should be well inside the boundary
	// This prevents lava/gas from appearing to spill out into space at the perimeter
	const edgeBuffer = 2; // Minimum distance from asteroid edge
	for (let dx = -edgeBuffer; dx <= edgeBuffer; dx++) {
		for (let dy = -edgeBuffer; dy <= edgeBuffer; dy++) {
			const checkX = x + dx;
			const checkY = y + dy;

			if (checkX >= 0 && checkX < world.width && checkY >= 0 && checkY < world.depth) {
				// If any nearby position is outside asteroid shape, this is too close to edge
				if (!asteroidShape(checkX, checkY)) {
					return false;
				}
			}
		}
	}

	// Check for surrounding solid walls - enclosed caves should have some solid neighbors
	let solidNeighbors = 0;
	const checkDistance = 1; // Check only immediate neighbors for less restrictive filtering

	for (let dx = -checkDistance; dx <= checkDistance; dx++) {
		for (let dy = -checkDistance; dy <= checkDistance; dy++) {
			if (dx === 0 && dy === 0) continue;
			const checkX = x + dx;
			const checkY = y + dy;

			if (checkX >= 0 && checkX < world.width && checkY >= 0 && checkY < world.depth) {
				if (world.grid[checkX] && world.grid[checkX][checkY] && world.grid[checkX][checkY].terrain !== 'space') {
					solidNeighbors++;
				}
			}
		}
	}

	// Enclosed caves should have some solid material nearby but not require too much
	// This helps filter out completely open craters while allowing cave interiors
	const totalChecked = (checkDistance * 2 + 1) * (checkDistance * 2 + 1) - 1; // -1 for center
	const solidRatio = solidNeighbors / totalChecked;

	// Require at least 25% solid neighbors - much more lenient than 60%
	return solidRatio >= 0.25;
}

/**
 * Apply hazards by picking spots in cave spaces and filling directionally
 * This completely bypasses the cave data transfer issue by directly finding cave spaces
 */
function applyHazardsByPickingSpots(world, worldConfig, asteroidShape, holePattern) {
	console.log('🌋 Starting spot-based hazard placement');

	// Step 1: Find all cave spaces (inside asteroid shape AND in holes/caves AND below air gap)
	const caveSpaces = [];
	for (let x = 0; x < world.width; x++) {
		for (let y = world.airGap + 1; y < world.depth - 5; y++) {
			// Start below air gap, stop well before bottom edge
			if (
				world.grid[x] &&
				world.grid[x][y] &&
				world.grid[x][y].terrain === 'space' &&
				asteroidShape(x, y) && // Must be within asteroid boundary
				holePattern(x, y) && // Must be part of a hole/cave, not open space
				isEnclosedCave(world, x, y, asteroidShape, holePattern)
			) {
				// Must be enclosed, not exposed surface
				caveSpaces.push({ x, y });
			}
		}
	}

	if (caveSpaces.length === 0) {
		console.log('⚠️  No cave spaces found for hazard placement');
		return;
	}

	// Shared filled spaces to ensure mutual exclusivity between lava and gas
	const allFilledSpaces = new Set();

	// Step 2: Apply lava pools
	if (worldConfig.lava_pools) {
		const lavaCount = Array.isArray(worldConfig.lava_pools.count)
			? worldConfig.lava_pools.count[0] +
				Math.floor(Math.random() * (worldConfig.lava_pools.count[1] - worldConfig.lava_pools.count[0] + 1))
			: worldConfig.lava_pools.count || 1;

		console.log(`🌋 Placing ${lavaCount} lava pools using spot-picking`);

		for (let i = 0; i < lavaCount; i++) {
			let newlyFilled = [];
			let attempts = 0;
			const maxAttempts = 3;

			// Try up to 3 times to find a valid spot
			while (attempts < maxAttempts && newlyFilled.length === 0) {
				// Pick a random cave space that hasn't been filled yet
				const availableSpaces = caveSpaces.filter(space => !allFilledSpaces.has(`${space.x},${space.y}`));
				if (availableSpaces.length === 0) break;

				const startSpot = availableSpaces[Math.floor(Math.random() * availableSpaces.length)];
				console.log(`🔥 Lava pool ${i + 1}, attempt ${attempts + 1}: Starting at (${startSpot.x}, ${startSpot.y})`);

				// Fill outward and down from this spot
				newlyFilled = fillDirectional(
					world,
					startSpot.x,
					startSpot.y,
					'lava',
					'down',
					allFilledSpaces,
					asteroidShape,
					holePattern,
				);

				attempts++;
			}

			if (newlyFilled.length > 0) {
				newlyFilled.forEach(coord => allFilledSpaces.add(coord));
				console.log(`   Filled ${newlyFilled.length} lava spaces`);
			} else {
				console.log(`⚠️  Could not find valid spot for lava pool ${i + 1} after ${maxAttempts} attempts`);
			}
		}
	}

	// Step 3: Apply gas pockets (using same filledSpaces to prevent overlap with lava)
	if (worldConfig.gas_pockets) {
		const gasCount = Array.isArray(worldConfig.gas_pockets.count)
			? worldConfig.gas_pockets.count[0] +
				Math.floor(Math.random() * (worldConfig.gas_pockets.count[1] - worldConfig.gas_pockets.count[0] + 1))
			: worldConfig.gas_pockets.count || 1;

		console.log(`💨 Placing ${gasCount} gas pockets using spot-picking`);

		for (let i = 0; i < gasCount; i++) {
			let newlyFilled = [];
			let attempts = 0;
			const maxAttempts = 3;

			// Try up to 3 times to find a valid spot
			while (attempts < maxAttempts && newlyFilled.length === 0) {
				// Pick a random cave space that hasn't been filled yet (avoiding lava areas)
				const availableSpaces = caveSpaces.filter(space => !allFilledSpaces.has(`${space.x},${space.y}`));
				if (availableSpaces.length === 0) break;

				const startSpot = availableSpaces[Math.floor(Math.random() * availableSpaces.length)];
				console.log(`💨 Gas pocket ${i + 1}, attempt ${attempts + 1}: Starting at (${startSpot.x}, ${startSpot.y})`);

				// Fill outward and up from this spot
				newlyFilled = fillDirectional(
					world,
					startSpot.x,
					startSpot.y,
					'gas',
					'up',
					allFilledSpaces,
					asteroidShape,
					holePattern,
				);

				attempts++;
			}

			if (newlyFilled.length > 0) {
				newlyFilled.forEach(coord => allFilledSpaces.add(coord));
				console.log(`   Filled ${newlyFilled.length} gas spaces`);
			} else {
				console.log(`⚠️  Could not find valid spot for gas pocket ${i + 1} after ${maxAttempts} attempts`);
			}
		}
	}

	// Apply physics-based layering: gas should never be below lava
	applyPhysicsLayering(world);

	// Debug: Check for hazards near bottom
	for (let x = 0; x < world.width; x++) {
		for (let y = world.depth - 6; y < world.depth; y++) {
			const cell = world.grid[x] && world.grid[x][y];
			if (cell && cell.hazards && cell.hazards.length > 0) {
				console.log(
					`⚠️  BOTTOM HAZARD: Found ${cell.hazards[0].type} at (${x}, ${y}) near bottom (depth: ${world.depth})`,
				);
			}
		}
	}

	// Step 4: Place lava/gas bubbles in solid ground
	if (worldConfig.lava_bubbles) {
		const bubbleCount = Array.isArray(worldConfig.lava_bubbles.count)
			? worldConfig.lava_bubbles.count[0] +
				Math.floor(Math.random() * (worldConfig.lava_bubbles.count[1] - worldConfig.lava_bubbles.count[0] + 1))
			: worldConfig.lava_bubbles.count || 0;

		placeBubbles(world, 'lava', bubbleCount, asteroidShape);
	}

	if (worldConfig.gas_bubbles) {
		const bubbleCount = Array.isArray(worldConfig.gas_bubbles.count)
			? worldConfig.gas_bubbles.count[0] +
				Math.floor(Math.random() * (worldConfig.gas_bubbles.count[1] - worldConfig.gas_bubbles.count[0] + 1))
			: worldConfig.gas_bubbles.count || 0;

		placeBubbles(world, 'gas', bubbleCount, asteroidShape);
	}
}

/**
 * Place bubble hazards (single cells) in solid ground
 */
function placeBubbles(world, hazardType, count, asteroidShape) {
	// Find all solid ground cells that are fully enclosed (ground on all 4 cardinal directions)
	const validCells = [];
	for (let x = 1; x < world.width - 1; x++) {
		for (let y = world.airGap + 2; y < world.depth - 1; y++) {
			const cell = world.grid[x] && world.grid[x][y];
			if (!cell || cell.terrain === 'space' || !asteroidShape(x, y)) continue;

			// Check all 4 cardinal directions have solid ground
			const up = world.grid[x] && world.grid[x][y - 1];
			const down = world.grid[x] && world.grid[x][y + 1];
			const left = world.grid[x - 1] && world.grid[x - 1][y];
			const right = world.grid[x + 1] && world.grid[x + 1][y];

			if (
				up &&
				up.terrain !== 'space' &&
				down &&
				down.terrain !== 'space' &&
				left &&
				left.terrain !== 'space' &&
				right &&
				right.terrain !== 'space'
			) {
				validCells.push({ x, y });
			}
		}
	}

	if (validCells.length === 0) {
		console.log(`⚠️  No valid cells for ${hazardType} bubbles`);
		return;
	}

	// Place random bubbles
	for (let i = 0; i < count && validCells.length > 0; i++) {
		const index = Math.floor(Math.random() * validCells.length);
		const { x, y } = validCells.splice(index, 1)[0];

		// Convert solid ground cell to space with hazard
		world.grid[x][y].terrain = 'space';
		world.grid[x][y].ground = null;
		world.grid[x][y].items = []; // Remove any mineral items that were on this ground

		if (!world.grid[x][y].hazards) {
			world.grid[x][y].hazards = [];
		}
		world.grid[x][y].hazards.push({ type: hazardType });
	}
}

/**
 * Apply physics-based layering to ensure gas floats above lava
 * This post-processes the hazard placement to fix physics violations globally
 */
function applyPhysicsLayering(world) {
	console.log('🌡️ Applying physics-based layering (gas floats above lava)');

	let removedGas = 0;
	let removedLava = 0;

	// Multiple passes to handle complex interactions
	for (let pass = 0; pass < 3; pass++) {
		// Pass 1: Remove any gas that has lava below it (gas should float up)
		for (let x = 0; x < world.width; x++) {
			for (let y = 0; y < world.depth - 1; y++) {
				if (!world.grid[x] || !world.grid[x][y] || !world.grid[x][y].hazards) continue;

				const hasGas = world.grid[x][y].hazards.some(h => h.type === 'gas');
				if (!hasGas) continue;

				// Check if there's lava anywhere below this gas
				let lavaBelow = false;
				for (let checkY = y + 1; checkY < world.depth; checkY++) {
					if (world.grid[x] && world.grid[x][checkY] && world.grid[x][checkY].hazards) {
						if (world.grid[x][checkY].hazards.some(h => h.type === 'lava')) {
							lavaBelow = true;
							break;
						}
					}
				}

				// If lava is below gas, remove the gas (it should have floated up)
				if (lavaBelow) {
					world.grid[x][y].hazards = world.grid[x][y].hazards.filter(h => h.type !== 'gas');
					removedGas++;
				}
			}
		}

		// Pass 2: Remove any lava that has gas above it (lava should sink down)
		for (let x = 0; x < world.width; x++) {
			for (let y = 1; y < world.depth; y++) {
				if (!world.grid[x] || !world.grid[x][y] || !world.grid[x][y].hazards) continue;

				const hasLava = world.grid[x][y].hazards.some(h => h.type === 'lava');
				if (!hasLava) continue;

				// Check if there's gas anywhere above this lava
				let gasAbove = false;
				for (let checkY = y - 1; checkY >= 0; checkY--) {
					if (world.grid[x] && world.grid[x][checkY] && world.grid[x][checkY].hazards) {
						if (world.grid[x][checkY].hazards.some(h => h.type === 'gas')) {
							gasAbove = true;
							break;
						}
					}
				}

				// If gas is above lava, remove the lava (it should have sunk down)
				if (gasAbove) {
					world.grid[x][y].hazards = world.grid[x][y].hazards.filter(h => h.type !== 'lava');
					removedLava++;
				}
			}
		}
	}

	console.log(
		`✅ Physics layering applied - removed ${removedGas} misplaced gas cells, ${removedLava} misplaced lava cells`,
	);
}

/**
 * Fill using proper settling physics - find bottom/top then fill layer by layer
 * direction: 'down' for lava (settles from bottom up), 'up' for gas (settles from top down)
 * filledSpaces: Set of already filled coordinates to avoid overlap
 */
function fillDirectional(world, startX, startY, hazardType, direction, filledSpaces, asteroidShape, holePattern) {
	const filled = [];

	// Helper to check if a space is valid for hazard placement
	const isValidSpace = (x, y) => {
		if (x < 0 || x >= world.width || y < 0 || y >= world.depth) return false;
		if (!world.grid[x] || !world.grid[x][y]) return false;
		if (world.grid[x][y].terrain !== 'space') return false;
		if (!asteroidShape(x, y) || !holePattern(x, y)) return false;
		if (y <= world.airGap) return false;
		if (filledSpaces.has(`${x},${y}`)) return false;
		return true;
	};

	// Helper to check if a position is near the asteroid edge (within 2 cells)
	const isNearEdge = (x, y) => {
		const edgeBuffer = 2;
		for (let dx = -edgeBuffer; dx <= edgeBuffer; dx++) {
			for (let dy = -edgeBuffer; dy <= edgeBuffer; dy++) {
				const checkX = x + dx;
				const checkY = y + dy;
				if (checkX >= 0 && checkX < world.width && checkY >= 0 && checkY < world.depth) {
					if (!asteroidShape(checkX, checkY)) {
						return true; // Found edge nearby
					}
				}
			}
		}
		return false;
	};

	// Helper to add hazard to a cell
	const addHazard = (x, y) => {
		if (!world.grid[x][y].hazards) {
			world.grid[x][y].hazards = [];
		}
		world.grid[x][y].hazards.push({ type: hazardType });
		filled.push(`${x},${y}`);
		filledSpaces.add(`${x},${y}`);
	};

	if (direction === 'down') {
		// LAVA PHYSICS: Find the actual lowest point in the cave area
		console.log('🔥 LAVA: Finding actual lowest point in cave area');

		// Step 1: Flood fill to find all connected cave spaces
		const caveSpaces = [];
		const visited = new Set();
		const queue = [{ x: startX, y: startY }];

		while (queue.length > 0) {
			const { x, y } = queue.shift();
			const key = `${x},${y}`;

			if (visited.has(key) || !isValidSpace(x, y)) continue;
			visited.add(key);
			caveSpaces.push({ x, y });

			// Add adjacent spaces
			const neighbors = [
				{ x: x - 1, y },
				{ x: x + 1, y },
				{ x, y: y - 1 },
				{ x, y: y + 1 },
			];
			for (const neighbor of neighbors) {
				const nKey = `${neighbor.x},${neighbor.y}`;
				if (!visited.has(nKey)) {
					queue.push(neighbor);
				}
			}
		}

		// Step 2: Find the actual lowest Y coordinate in the cave, excluding edge-adjacent spaces
		// Also ensure there's solid terrain below to support lava
		const spacesWithGroundBelow = caveSpaces.filter(space => {
			if (isNearEdge(space.x, space.y)) return false;
			// Check if there's solid terrain anywhere below this space
			for (let checkY = space.y + 1; checkY < world.depth; checkY++) {
				if (world.grid[space.x] && world.grid[space.x][checkY] && world.grid[space.x][checkY].terrain !== 'space') {
					return true;
				}
			}
			return false;
		});

		// If no valid spaces with ground below, this cave is invalid for lava
		if (spacesWithGroundBelow.length === 0) {
			return [];
		}

		const lowestY = Math.max(...spacesWithGroundBelow.map(space => space.y));
		const lowestPoints = spacesWithGroundBelow.filter(space => space.y === lowestY);

		// Step 3: Pick center-most of the lowest points as starting point
		lowestPoints.sort((a, b) => Math.abs(a.x - startX) - Math.abs(b.x - startX));
		const { x: bottomX, y: bottomY } = lowestPoints[0];

		// Step 4: Fill from actual bottom upward, layer by layer with flat tops
		const targetSize = 30;
		let currentY = bottomY;

		while (currentY >= world.airGap + 1 && filled.length < targetSize) {
			// Fill entire horizontal layer at this Y level
			const layerQueue = [bottomX];
			const layerVisited = new Set();
			const layerCells = [];

			while (layerQueue.length > 0) {
				const x = layerQueue.shift();
				if (layerVisited.has(x)) continue;
				if (!isValidSpace(x, currentY) || isNearEdge(x, currentY)) continue;

				// Check if this space has solid terrain below to support lava
				let hasGroundBelow = false;
				for (let checkY = currentY + 1; checkY < world.depth; checkY++) {
					if (world.grid[x] && world.grid[x][checkY] && world.grid[x][checkY].terrain !== 'space') {
						hasGroundBelow = true;
						break;
					}
				}
				if (!hasGroundBelow) continue;

				layerVisited.add(x);
				layerCells.push(x);

				// Expand left and right to fill entire horizontal layer
				if (x > 0 && !layerVisited.has(x - 1)) layerQueue.push(x - 1);
				if (x < world.width - 1 && !layerVisited.has(x + 1)) layerQueue.push(x + 1);
			}

			// Add all cells from this layer
			for (const x of layerCells) {
				if (filled.length >= targetSize) break;

				// LAVA DRIP: Calculate drip distance first, only drip if reasonable
				let dripDistance = 0;
				let tempY = currentY + 1;
				while (tempY < world.depth) {
					if (world.grid[x] && world.grid[x][tempY] && world.grid[x][tempY].terrain !== 'space') {
						break; // Hit solid terrain
					}
					if (!isValidSpace(x, tempY) || isNearEdge(x, tempY)) {
						break; // Hit invalid/edge space
					}
					dripDistance++;
					tempY++;
				}

				// Only place this cell if the drip won't exceed target
				if (filled.length + 1 + dripDistance <= targetSize) {
					addHazard(x, currentY);

					// Now do the actual drip
					let dripY = currentY + 1;
					while (dripY < world.depth) {
						if (world.grid[x] && world.grid[x][dripY] && world.grid[x][dripY].terrain !== 'space') {
							break;
						}
						if (!isValidSpace(x, dripY) || isNearEdge(x, dripY)) {
							break;
						}
						addHazard(x, dripY);
						dripY++;
					}
				}
			}

			if (filled.length >= targetSize) break;

			// Move up one layer
			currentY--;
		}
	} else if (direction === 'up') {
		// GAS PHYSICS: Find the actual highest point in the cave area
		console.log('💨 GAS: Finding actual highest point in cave area');

		// Step 1: Flood fill to find all connected cave spaces
		const caveSpaces = [];
		const visited = new Set();
		const queue = [{ x: startX, y: startY }];

		while (queue.length > 0) {
			const { x, y } = queue.shift();
			const key = `${x},${y}`;

			if (visited.has(key) || !isValidSpace(x, y)) continue;
			visited.add(key);
			caveSpaces.push({ x, y });

			// Add adjacent spaces
			const neighbors = [
				{ x: x - 1, y },
				{ x: x + 1, y },
				{ x, y: y - 1 },
				{ x, y: y + 1 },
			];
			for (const neighbor of neighbors) {
				const nKey = `${neighbor.x},${neighbor.y}`;
				if (!visited.has(nKey)) {
					queue.push(neighbor);
				}
			}
		}

		// Step 2: Find the actual highest Y coordinate in the cave, excluding edge-adjacent spaces
		// Also ensure there's solid terrain above to contain gas (ceiling check)
		const spacesWithCeilingAbove = caveSpaces.filter(space => {
			if (isNearEdge(space.x, space.y)) return false;
			// Check if there's solid terrain anywhere above this space
			for (let checkY = space.y - 1; checkY >= 0; checkY--) {
				if (world.grid[space.x] && world.grid[space.x][checkY] && world.grid[space.x][checkY].terrain !== 'space') {
					return true;
				}
			}
			return false;
		});

		// If no valid spaces with ceiling above, this cave is invalid for gas
		if (spacesWithCeilingAbove.length === 0) {
			return [];
		}

		const highestY = Math.min(...spacesWithCeilingAbove.map(space => space.y));
		const highestPoints = spacesWithCeilingAbove.filter(space => space.y === highestY);

		// Step 3: Pick center-most of the highest points as starting point
		highestPoints.sort((a, b) => Math.abs(a.x - startX) - Math.abs(b.x - startX));
		const { x: topX, y: topY } = highestPoints[0];

		// Step 4: Fill from actual top downward, layer by layer with flat bottoms
		const targetSize = 30;
		let currentY = topY;

		while (currentY < world.depth && filled.length < targetSize) {
			// Fill entire horizontal layer at this Y level
			const layerQueue = [topX];
			const layerVisited = new Set();
			const layerCells = [];

			while (layerQueue.length > 0) {
				const x = layerQueue.shift();
				if (layerVisited.has(x)) continue;
				if (!isValidSpace(x, currentY) || isNearEdge(x, currentY)) continue;

				// Check if this space has solid terrain above to contain gas
				let hasCeilingAbove = false;
				for (let checkY = currentY - 1; checkY >= 0; checkY--) {
					if (world.grid[x] && world.grid[x][checkY] && world.grid[x][checkY].terrain !== 'space') {
						hasCeilingAbove = true;
						break;
					}
				}
				if (!hasCeilingAbove) continue;

				layerVisited.add(x);
				layerCells.push(x);

				// Expand left and right to fill entire horizontal layer
				if (x > 0 && !layerVisited.has(x - 1)) layerQueue.push(x - 1);
				if (x < world.width - 1 && !layerVisited.has(x + 1)) layerQueue.push(x + 1);
			}

			// Add all cells from this layer
			for (const x of layerCells) {
				if (filled.length >= targetSize) break;

				// GAS FLOAT: Calculate float distance first
				let floatDistance = 0;
				let tempY = currentY - 1;
				while (tempY >= world.airGap + 1) {
					if (world.grid[x] && world.grid[x][tempY] && world.grid[x][tempY].terrain !== 'space') {
						break; // Hit solid terrain (ceiling)
					}
					if (!isValidSpace(x, tempY) || isNearEdge(x, tempY)) {
						break; // Hit invalid/edge space
					}
					floatDistance++;
					tempY--;
				}

				// Skip this cell if float would push us over target
				const cellCost = 1 + floatDistance;
				if (filled.length + cellCost > targetSize) {
					continue;
				}

				// Place the layer cell
				addHazard(x, currentY);

				// Do the actual float
				let floatY = currentY - 1;
				while (floatY >= world.airGap + 1) {
					if (world.grid[x] && world.grid[x][floatY] && world.grid[x][floatY].terrain !== 'space') {
						break;
					}
					if (!isValidSpace(x, floatY) || isNearEdge(x, floatY)) {
						break;
					}
					addHazard(x, floatY);
					floatY--;
				}
			}

			// Now fill horizontally at each Y level we've created gas at
			const gasYLevels = new Set();
			for (const coordStr of filled) {
				const [, yStr] = coordStr.split(',');
				gasYLevels.add(parseInt(yStr));
			}

			for (const gasY of gasYLevels) {
				if (filled.length >= targetSize) break;
				if (gasY < currentY) continue; // Only fill at levels above current layer

				// Find all gas X positions at this Y level
				const gasXPositions = new Set();
				for (const coordStr of filled) {
					const [xStr, yStr] = coordStr.split(',');
					if (parseInt(yStr) === gasY) {
						gasXPositions.add(parseInt(xStr));
					}
				}

				// For each gas cell, try to expand left and right
				for (const gasX of gasXPositions) {
					if (filled.length >= targetSize) break;

					// Check ceiling above before expanding
					let hasCeiling = false;
					for (let checkY = gasY - 1; checkY >= 0; checkY--) {
						if (world.grid[gasX] && world.grid[gasX][checkY] && world.grid[gasX][checkY].terrain !== 'space') {
							hasCeiling = true;
							break;
						}
					}
					if (!hasCeiling) continue;

					// Expand left with budget check
					let expandX = gasX - 1;
					while (
						expandX >= 0 &&
						filled.length < targetSize &&
						isValidSpace(expandX, gasY) &&
						!isNearEdge(expandX, gasY) &&
						!filledSpaces.has(`${expandX},${gasY}`)
					) {
						// Check ceiling for expanded cell
						let hasCeilingHere = false;
						for (let checkY = gasY - 1; checkY >= 0; checkY--) {
							if (
								world.grid[expandX] &&
								world.grid[expandX][checkY] &&
								world.grid[expandX][checkY].terrain !== 'space'
							) {
								hasCeilingHere = true;
								break;
							}
						}
						if (!hasCeilingHere) break;

						addHazard(expandX, gasY);
						expandX--;
					}

					// Expand right with budget check
					expandX = gasX + 1;
					while (
						expandX < world.width &&
						filled.length < targetSize &&
						isValidSpace(expandX, gasY) &&
						!isNearEdge(expandX, gasY) &&
						!filledSpaces.has(`${expandX},${gasY}`)
					) {
						// Check ceiling for expanded cell
						let hasCeilingHere = false;
						for (let checkY = gasY - 1; checkY >= 0; checkY--) {
							if (
								world.grid[expandX] &&
								world.grid[expandX][checkY] &&
								world.grid[expandX][checkY].terrain !== 'space'
							) {
								hasCeilingHere = true;
								break;
							}
						}
						if (!hasCeilingHere) break;

						addHazard(expandX, gasY);
						expandX++;
					}
				}
			}

			if (filled.length >= targetSize) break;

			// Move down one layer
			currentY++;
		}
	}

	return filled;
}
