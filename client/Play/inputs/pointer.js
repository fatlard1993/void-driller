import { theme } from 'vanilla-bean-components';
import Phaser from 'phaser';

import {
	gridToPxPosition,
	hasWheelSupport,
	pxToGridPosition,
	validateMovement,
	validateMovementPath,
} from '../../../utils';
import gameContext from '../../shared/gameContext';
import socket from '../../../byod-web-game/client/socket';
import { playerMove } from '../../api';
import { minerals, drills, engines } from '../../../constants';
import TradeDialog from '../TradeDialog';
import Notify from '../../shared/Notify';

export const checkForNearbyPlayerTrade = () => {
	const currentPlayer = gameContext.players.currentPlayer;
	if (!currentPlayer) return;

	// Find players within 1 tile
	const nearbyPlayers = gameContext.getNearbyPlayers(currentPlayer.position, 1);

	if (nearbyPlayers.length > 0) {
		// Show trade UI for the closest player
		const targetPlayer = nearbyPlayers[0]; // Take first nearby player

		if (gameContext.openDialog?.elem?.open) {
			gameContext.openDialog.close();
		}

		gameContext.openDialog = new TradeDialog({
			targetPlayer: targetPlayer,
		});
	}
};

// Add this function to handle trade interactions
export const handleTradeInteraction = targetPlayer => {
	const currentPlayer = gameContext.players.currentPlayer;

	// Check if players are adjacent
	const distance =
		Math.abs(currentPlayer.position.x - targetPlayer.position.x) +
		Math.abs(currentPlayer.position.y - targetPlayer.position.y);

	if (distance > 1) {
		new Notify({
			type: 'error',
			content: 'Move closer to trade with other players.',
			timeout: 2000,
		});
		return;
	}

	// Check for existing dialog
	if (gameContext.openDialog?.elem?.open) {
		gameContext.openDialog.close();
	}

	// Open trade dialog
	gameContext.openDialog = new TradeDialog({
		targetPlayer,
	});
};

const line = [];
const path = [];
const autoPath = [];
const autoLine = [];
const maxPathLength = 30;

// Status bar elements (individual objects, not groups)
let cargoStatusElements = [];
let fuelStatusElements = [];

const fuelColors = {
	oil: Phaser.Display.Color.ValueToColor(theme.colors.yellow.toRgbString()).color,
	battery: Phaser.Display.Color.ValueToColor(theme.colors.blue.toRgbString()).color,
	super_oxygen_liquid_nitrogen: Phaser.Display.Color.ValueToColor(theme.colors.teal.toRgbString()).color,
};
const iconIndex = {
	oil: 0,
	health: 1,
	cargo: 2,
	super_oxygen_liquid_nitrogen: 3,
	battery: 4,
};

const saveAutoPathOptions = () => {
	localStorage.setItem('autoPath', JSON.stringify(gameContext.autoPath));
};

const canDigPosition = (position, player, grid) => {
	const cell = grid[position.x]?.[position.y];
	if (!cell) return false;

	const fuelCost = calculateFuelCost(position, player, grid);

	if (fuelCost > player.fuel) return false;

	if (!cell.ground?.type) return true;

	const mineralConfig = minerals[cell.ground.type];
	const drillConfig = drills[player.configuration.drill];

	if (!mineralConfig || !drillConfig) return false;

	const cannotDig = drillConfig.strength < mineralConfig.strength;
	const isIgnored = gameContext.autoPath.ignore.includes(cell.ground.type);

	if (cell.hazards && cell.hazards.length > 0) {
		const hasBlockingHazards = cell.hazards.some(
			hazard => hazard.type === 'lava' || hazard.type === 'gas' || hazard.type === 'alien',
		);
		if (hasBlockingHazards) return false;
	}

	return !cannotDig && !isIgnored;
};

const calculateFuelCost = (position, player, grid) => {
	const cell = grid[position.x]?.[position.y];
	if (!cell) return Infinity;

	let baseFuelConsumption = 0.1 / player.fuelEfficiency;

	if (cell.ground?.type) {
		const mineralConfig = minerals[cell.ground.type];
		const miningPenalty = 0.3 + mineralConfig.density * 0.5;
		baseFuelConsumption = Math.max(baseFuelConsumption, miningPenalty / player.fuelEfficiency);
	}

	const cargoWeightRatio = player.cargo / player.maxCargo;
	const cargoFuelMultiplier = 1.0 + cargoWeightRatio * 0.2;

	return baseFuelConsumption * cargoFuelMultiplier;
};

// Enhanced path calculation that considers both fuel and cargo limits
const calculatePathResourceInfo = (pathPositions, player, grid) => {
	let cumulativeFuelUsed = 0;
	let cumulativeCargo = player.cargo;
	const pathInfo = [];

	for (let i = 0; i < pathPositions.length; i++) {
		const position = pathPositions[i];
		const cell = grid[position.x]?.[position.y];

		// Calculate fuel cost for this step
		const stepFuelCost = calculateFuelCost(position, player, grid, pathPositions.slice(0, i));
		cumulativeFuelUsed += stepFuelCost;

		// Calculate cargo addition for this step
		let cargoIncrease = 0;
		if (cell && cell.ground?.type) {
			const mineralConfig = minerals[cell.ground.type];
			cargoIncrease = mineralConfig.weight || 0.1;
		}
		cumulativeCargo += cargoIncrease;

		// Check if we've hit limits
		const fuelExceeded = cumulativeFuelUsed > player.fuel;
		const cargoExceeded = cumulativeCargo > player.maxCargo;
		const anyLimitExceeded = fuelExceeded || cargoExceeded;

		pathInfo.push({
			cumulativeFuel: cumulativeFuelUsed,
			cumulativeCargo: cumulativeCargo,
			stepFuel: stepFuelCost,
			cargoIncrease: cargoIncrease,
			fuelRatio: cumulativeFuelUsed / player.fuel,
			cargoRatio: cumulativeCargo / player.maxCargo,
			limitExceeded: anyLimitExceeded,
			fuelExceeded: fuelExceeded,
			cargoExceeded: cargoExceeded,
		});

		// Stop calculating if we've exceeded limits
		if (anyLimitExceeded) {
			break;
		}
	}

	return pathInfo;
};

// Pure validation colors - separate from resource feedback
const getValidationColor = isValid => {
	return isValid ? 0x00ff00 : 0xff0000; // Green for valid, red for invalid
};

// Auto-path colors (blue variants)
const getAutoPathColor = (isLastSegment = false) => {
	return isLastSegment
		? Phaser.Display.Color.ValueToColor(theme.colors.teal.toRgbString()).color
		: Phaser.Display.Color.ValueToColor(theme.colors.blue.toRgbString()).color; // Blue-green for last segment, blue for others
};

// Create or update status bars for resource feedback - positioned at final path position
const createResourceStatusBars = (pathResourceInfo, player, finalPosition) => {
	// Clean up existing status bars first
	hideResourceStatusBars();

	if (!pathResourceInfo || pathResourceInfo.length === 0 || !finalPosition) {
		return;
	}

	// Get final step info
	const finalStep = pathResourceInfo[pathResourceInfo.length - 1];

	// Convert final position to pixel coordinates
	const { x: finalPixelX, y: finalPixelY } = gridToPxPosition(finalPosition);

	const barWidth = 100; // Match player status bar fill width
	const barHeight = 3; // Match player status bar fill height
	const frameWidth = 104; // Match player status bar frame width
	const frameHeight = 7; // Match player status bar frame height

	// Position bars above the final path position - cargo first (higher), then fuel
	const cargoBarY = finalPixelY - 60; // Cargo bar positioned higher (matches player layout)
	const fuelBarY = finalPixelY - 50; // Fuel bar positioned lower (matches player layout)

	const green = Phaser.Display.Color.ValueToColor(theme.colors.dark(theme.colors.green).toRgbString()).color;
	const orange = Phaser.Display.Color.ValueToColor(theme.colors.orange.toRgbString()).color;
	const red = Phaser.Display.Color.ValueToColor(theme.colors.red.toRgbString()).color;

	// Determine fuel color based on engine type
	const engineConfig = engines[player.configuration.engine];
	let fuelColor = fuelColors.oil;
	if (fuelColors[engineConfig.fuelType]) {
		fuelColor = fuelColors[engineConfig.fuelType];
	}

	// Create cargo status bar elements (positioned first/higher to match player bars)
	const cargoFrame = gameContext.scene.add.rectangle(finalPixelX, cargoBarY, frameWidth, frameHeight, 0x000000);
	gameContext.sceneLayers.interfaces.add(cargoFrame);
	cargoStatusElements.push(cargoFrame);

	// Cargo bar fill
	const cargoRatio = Math.min(1, finalStep.cumulativeCargo / player.maxCargo);
	const cargoFillWidth = Math.max(1, barWidth * cargoRatio);
	let cargoFillColor = green;

	if (finalStep.cargoExceeded) cargoFillColor = red;
	else if (cargoRatio > 0.9) cargoFillColor = red;
	else if (cargoRatio > 0.7) cargoFillColor = orange;

	const cargoFill = gameContext.scene.add.rectangle(
		finalPixelX - (barWidth - cargoFillWidth) / 2,
		cargoBarY,
		cargoFillWidth,
		barHeight,
		cargoFillColor,
	);
	gameContext.sceneLayers.interfaces.add(cargoFill);
	cargoStatusElements.push(cargoFill);

	// Cargo icon (positioned like player status bars)
	const cargoIcon = gameContext.scene.add.image(finalPixelX - 70, cargoBarY, 'icons', iconIndex.cargo);
	gameContext.sceneLayers.interfaces.add(cargoIcon);
	cargoStatusElements.push(cargoIcon);

	// Create fuel status bar elements (positioned second/lower to match player bars)
	const fuelFrame = gameContext.scene.add.rectangle(finalPixelX, fuelBarY, frameWidth, frameHeight, 0x000000);
	gameContext.sceneLayers.interfaces.add(fuelFrame);
	fuelStatusElements.push(fuelFrame);

	const fuelRatio = Math.min(1, (player.fuel - finalStep.cumulativeFuel) / player.maxFuel);
	const fuelFillWidth = Math.max(2, barWidth * fuelRatio);
	let fuelFillColor = fuelColor;

	if (finalStep.fuelExceeded) fuelFillColor = red;
	else if (fuelRatio < 0.1) fuelFillColor = red;
	else if (fuelRatio < 0.3) fuelFillColor = orange;

	const fuelFill = gameContext.scene.add.rectangle(
		finalPixelX - (barWidth - fuelFillWidth) / 2,
		fuelBarY,
		fuelFillWidth,
		barHeight,
		fuelFillColor,
	);
	gameContext.sceneLayers.interfaces.add(fuelFill);
	fuelStatusElements.push(fuelFill);

	// Fuel icon (positioned like player status bars)
	const fuelIconIndex = iconIndex[engineConfig.fuelType];
	const fuelIcon = gameContext.scene.add.image(finalPixelX + 60, fuelBarY, 'icons', fuelIconIndex);
	fuelIcon.setScale(engineConfig.fuelType === 'oil' ? 0.8 : 1); // Match player status bar scaling
	gameContext.sceneLayers.interfaces.add(fuelIcon);
	fuelStatusElements.push(fuelIcon);
};

const hideResourceStatusBars = () => {
	// Clean up cargo status elements
	cargoStatusElements.forEach(element => {
		if (element && element.destroy) {
			element.destroy();
		}
	});
	cargoStatusElements = [];

	// Clean up fuel status elements
	fuelStatusElements.forEach(element => {
		if (element && element.destroy) {
			element.destroy();
		}
	});
	fuelStatusElements = [];
};

const generateOptimizedAStar = (start, end, player, grid) => {
	if (!gameContext.autoPath.enabled) return [];

	// Check if cursor is within effective radius
	const distance = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
	if (distance > gameContext.autoPath.maxRadius) return [];

	// CRITICAL: Check if target position is actually reachable
	if (!canDigPosition(end, player, grid)) {
		return [];
	}

	const openSet = [];
	const closedSet = new Set();
	const cameFrom = new Map();
	const gScore = new Map();
	const fScore = new Map();

	const startKey = `${start.x},${start.y}`;
	const endKey = `${end.x},${end.y}`;

	const gridWidth = grid.length;
	const gridHeight = grid[0]?.length || 0;

	const heuristic = (a, b) => {
		const dx = Math.abs(a.x - b.x);
		const dy = Math.abs(a.y - b.y);
		return Math.max(dx, dy);
	};

	const movementCostCache = new Map();

	const getMovementCost = (from, to, pathSoFar = []) => {
		const toKey = `${to.x},${to.y}`;

		// Check cache first (but don't cache fuel-dependent calculations)
		if (movementCostCache.has(toKey) && pathSoFar.length === 0) {
			return movementCostCache.get(toKey);
		}

		if (to.x < 0 || to.x >= gridWidth || to.y < 0 || to.y >= gridHeight) {
			movementCostCache.set(toKey, Infinity);
			return Infinity;
		}

		const fuelCost = calculateFuelCost(to, player, grid, pathSoFar);

		// Calculate cumulative resource usage for path validation
		const pathInfo = calculatePathResourceInfo([...pathSoFar, to], player, grid);
		const finalStep = pathInfo[pathInfo.length - 1];

		if (finalStep && finalStep.limitExceeded) {
			return Infinity;
		}

		if (!canDigPosition(to, player, grid)) {
			movementCostCache.set(toKey, Infinity);
			return Infinity;
		}

		const movementDelta = { x: to.x - from.x, y: to.y - from.y };
		let testOrientation = 'right';

		if (movementDelta.y === 0) {
			testOrientation = movementDelta.x < 0 ? 'left' : 'right';
		} else if (movementDelta.x === 0) {
			// Use consistent vertical orientation logic with server
			testOrientation = movementDelta.y < 0 ? 'up_left' : 'down_left';
		} else {
			if (movementDelta.y < 0 && movementDelta.x < 0) {
				testOrientation = 'up_left';
			} else if (movementDelta.y < 0 && movementDelta.x > 0) {
				testOrientation = 'up_right';
			} else if (movementDelta.y > 0 && movementDelta.x < 0) {
				testOrientation = 'down_left';
			} else {
				testOrientation = 'down_right';
			}
		}

		const wheelCheck = hasWheelSupport(to, grid, pathSoFar, testOrientation);
		if (!wheelCheck.hasSupport) {
			movementCostCache.set(toKey, Infinity);
			return Infinity;
		}

		const cell = grid[to.x][to.y];
		let cost = 1;

		// Fuel-aware cost calculation
		const actualFuelCost = fuelCost;

		// Scale cost based on fuel consumption (prefer low-fuel paths when fuel is low)
		const fuelRatio = player.fuel / player.maxFuel;
		if (fuelRatio < 0.3) {
			// Low fuel - heavily prefer open spaces
			if (cell.ground?.type) {
				cost += actualFuelCost * 10; // Heavy penalty for mining when low on fuel
			} else {
				cost += actualFuelCost * 2; // Light penalty for driving
			}
		} else if (fuelRatio < 0.6) {
			// Medium fuel - moderate preference for open spaces
			if (cell.ground?.type) {
				cost += actualFuelCost * 5;
			} else {
				cost += actualFuelCost * 1.5;
			}
		} else {
			// High fuel - normal pathfinding
			cost += actualFuelCost;
		}

		// Additional cost factors
		if (cell && cell.ground?.type) {
			const mineralConfig = minerals[cell.ground.type];
			cost += mineralConfig.strength * 0.2;
		}

		if (cell && cell.hazards && cell.hazards.length > 0) {
			cost += cell.hazards.length * 0.3;
		}

		const isDiagonal = Math.abs(movementDelta.x) === 1 && Math.abs(movementDelta.y) === 1;
		if (isDiagonal) {
			cost *= 1.414;
		}

		const supportQuality = wheelCheck.supportCount / wheelCheck.requiredPositions.length;
		cost *= 2.0 - supportQuality;

		if (pathSoFar.length === 0) {
			movementCostCache.set(toKey, cost);
		}

		return cost;
	};

	const getNeighbors = node => {
		const neighbors = [];

		// 8-directional movement with prioritized directions
		const directions = [
			// cardinal directions first
			{ x: -1, y: 0 }, // left
			{ x: 1, y: 0 }, // right
			{ x: 0, y: -1 }, // up
			{ x: 0, y: 1 }, // down
			// Then diagonals
			{ x: -1, y: -1 }, // up-left
			{ x: 1, y: -1 }, // up-right
			{ x: -1, y: 1 }, // down-left
			{ x: 1, y: 1 }, // down-right
		];

		for (const dir of directions) {
			const neighbor = {
				x: node.x + dir.x,
				y: node.y + dir.y,
			};

			if (neighbor.x >= 0 && neighbor.x < gridWidth && neighbor.y >= 0 && neighbor.y < gridHeight) {
				neighbors.push(neighbor);
			}
		}

		return neighbors;
	};

	const reconstructPath = current => {
		const path = [];
		let currentKey = `${current.x},${current.y}`;

		while (cameFrom.has(currentKey)) {
			const pos = cameFrom.get(currentKey);
			path.unshift({ x: current.x, y: current.y });
			current = pos;
			currentKey = `${pos.x},${pos.y}`;
		}

		return path;
	};

	// Initialize starting node
	gScore.set(startKey, 0);
	fScore.set(startKey, heuristic(start, end));
	openSet.push({ x: start.x, y: start.y, f: fScore.get(startKey) });

	let iterations = 0;
	const maxIterations = gameContext.autoPath.maxSearchIterations || 2000;

	while (openSet.length > 0 && iterations < maxIterations) {
		iterations++;

		// Find node with lowest fScore
		let currentIndex = 0;
		for (let i = 1; i < openSet.length; i++) {
			if (openSet[i].f < openSet[currentIndex].f) {
				currentIndex = i;
			}
		}

		const current = openSet.splice(currentIndex, 1)[0];
		const currentKey = `${current.x},${current.y}`;

		// Reached the goal
		if (currentKey === endKey) {
			const finalPath = reconstructPath(current);
			return finalPath;
		}

		closedSet.add(currentKey);

		// Check all neighbors
		const neighbors = getNeighbors(current);
		for (const neighbor of neighbors) {
			const neighborKey = `${neighbor.x},${neighbor.y}`;

			if (closedSet.has(neighborKey)) {
				continue;
			}

			const pathSoFar = [];
			let tempCurrent = current;
			let tempKey = currentKey;
			while (cameFrom.has(tempKey)) {
				pathSoFar.unshift(tempCurrent);
				tempCurrent = cameFrom.get(tempKey);
				tempKey = `${tempCurrent.x},${tempCurrent.y}`;
			}

			const moveCost = getMovementCost(current, neighbor, pathSoFar);
			if (moveCost === Infinity) {
				continue;
			}

			const tentativeGScore = gScore.get(currentKey) + moveCost;

			// Check if this path to neighbor is better
			if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
				cameFrom.set(neighborKey, current);
				gScore.set(neighborKey, tentativeGScore);
				const fScoreValue = tentativeGScore + heuristic(neighbor, end);
				fScore.set(neighborKey, fScoreValue);

				// Add to open set if not already there
				if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
					openSet.push({ x: neighbor.x, y: neighbor.y, f: fScoreValue });
				}
			}
		}
	}

	return []; // No path found
};

const generateFlowField = (start, end, player, grid) => {
	const gridWidth = grid.length;
	const gridHeight = grid[0]?.length || 0;

	// Limit search area for performance
	const maxRadius = gameContext.autoPath.maxRadius + 5;
	const minX = Math.max(0, Math.min(start.x, end.x) - maxRadius);
	const maxX = Math.min(gridWidth, Math.max(start.x, end.x) + maxRadius);
	const minY = Math.max(0, Math.min(start.y, end.y) - maxRadius);
	const maxY = Math.min(gridHeight, Math.max(start.y, end.y) + maxRadius);

	// Create distance field using Dijkstra from end point
	const distances = new Map();
	const queue = [{ x: end.x, y: end.y, dist: 0, fuelUsed: 0, cargoUsed: player.cargo }];
	distances.set(`${end.x},${end.y}`, 0);

	const directions = [
		{ x: -1, y: 0, cost: 1 }, // left
		{ x: 1, y: 0, cost: 1 }, // right
		{ x: 0, y: -1, cost: 1 }, // up
		{ x: 0, y: 1, cost: 1 }, // down
		{ x: -1, y: -1, cost: 1.414 }, // up-left
		{ x: 1, y: -1, cost: 1.414 }, // up-right
		{ x: -1, y: 1, cost: 1.414 }, // down-left
		{ x: 1, y: 1, cost: 1.414 }, // down-right
	];

	while (queue.length > 0) {
		const current = queue.shift();
		const currentKey = `${current.x},${current.y}`;
		const currentDist = distances.get(currentKey);

		for (const dir of directions) {
			const next = {
				x: current.x + dir.x,
				y: current.y + dir.y,
			};

			// Bounds check
			if (next.x < minX || next.x >= maxX || next.y < minY || next.y >= maxY) {
				continue;
			}

			const nextKey = `${next.x},${next.y}`;

			// Skip if already processed with better distance
			if (distances.has(nextKey)) {
				continue;
			}

			if (!canDigPosition(next, player, grid)) {
				continue;
			}

			const fuelCost = calculateFuelCost(next, player, grid);
			const totalFuelUsed = current.fuelUsed + fuelCost;

			// Calculate cargo increase
			const cell = grid[next.x]?.[next.y];
			let cargoIncrease = 0;
			if (cell && cell.ground?.type) {
				const mineralConfig = minerals[cell.ground.type];
				cargoIncrease = mineralConfig.weight || 0.1;
			}
			const totalCargoUsed = current.cargoUsed + cargoIncrease;

			// Check resource limits
			if (totalFuelUsed > player.fuel || totalCargoUsed > player.maxCargo) {
				continue;
			}

			const movementDelta = { x: next.x - current.x, y: next.y - current.y };
			let testOrientation = 'right';

			if (movementDelta.y === 0) {
				testOrientation = movementDelta.x < 0 ? 'left' : 'right';
			} else if (movementDelta.x === 0) {
				testOrientation = movementDelta.y < 0 ? 'up_right' : 'down_right';
			} else {
				if (movementDelta.y < 0 && movementDelta.x < 0) {
					testOrientation = 'up_left';
				} else if (movementDelta.y < 0 && movementDelta.x > 0) {
					testOrientation = 'up_right';
				} else if (movementDelta.y > 0 && movementDelta.x < 0) {
					testOrientation = 'down_left';
				} else {
					testOrientation = 'down_right';
				}
			}

			if (!hasWheelSupport(next, grid, [], testOrientation).hasSupport) {
				continue;
			}

			let moveCost = dir.cost;

			const fuelRatio = player.fuel / player.maxFuel;
			const cargoRatio = totalCargoUsed / player.maxCargo;

			if (fuelRatio < 0.3 || cargoRatio > 0.8) {
				// Low fuel or high cargo
				if (cell && cell.ground?.type) {
					const mineralConfig = minerals[cell.ground.type];
					moveCost += mineralConfig.strength * 0.3;
				}
			} else {
				if (cell && cell.ground?.type) {
					const mineralConfig = minerals[cell.ground.type];
					moveCost += mineralConfig.strength * 0.1;
				}
			}

			const newDist = currentDist + moveCost;
			distances.set(nextKey, newDist);

			let inserted = false;
			for (let i = 0; i < queue.length; i++) {
				if (newDist < queue[i].dist) {
					queue.splice(i, 0, {
						x: next.x,
						y: next.y,
						dist: newDist,
						fuelUsed: totalFuelUsed,
						cargoUsed: totalCargoUsed,
					});
					inserted = true;
					break;
				}
			}
			if (!inserted) {
				queue.push({
					x: next.x,
					y: next.y,
					dist: newDist,
					fuelUsed: totalFuelUsed,
					cargoUsed: totalCargoUsed,
				});
			}
		}
	}

	// Follow flow field from start to end
	const path = [];
	let current = { x: start.x, y: start.y };
	const visited = new Set();
	const maxSteps = gameContext.autoPath.maxRadius * 2;

	while (path.length < maxSteps) {
		const currentKey = `${current.x},${current.y}`;

		if (visited.has(currentKey)) {
			break;
		}
		visited.add(currentKey);

		// Reached destination
		if (current.x === end.x && current.y === end.y) {
			break;
		}

		// Find best next step
		let bestNext = null;
		let bestDistance = Infinity;

		for (const dir of directions) {
			const next = {
				x: current.x + dir.x,
				y: current.y + dir.y,
			};

			const nextKey = `${next.x},${next.y}`;

			if (!distances.has(nextKey) || visited.has(nextKey)) {
				continue;
			}

			const distance = distances.get(nextKey);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestNext = next;
			}
		}

		if (!bestNext) {
			break;
		}

		path.push(bestNext);
		current = bestNext;
	}

	return path;
};

const generateDirectPath = (start, end, player, grid) => {
	const path = [];
	const deltaX = end.x - start.x;
	const deltaY = end.y - start.y;
	const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));

	if (steps === 0) return [];

	let currentX = start.x;
	let currentY = start.y;
	const deltaErrX = Math.abs(deltaX / steps);
	const deltaErrY = Math.abs(deltaY / steps);
	const signX = deltaX > 0 ? 1 : -1;
	const signY = deltaY > 0 ? 1 : -1;
	let cumulativeErrorX = 0;
	let cumulativeErrorY = 0;
	let totalFuelUsed = 0;
	let totalCargoUsed = player.cargo;

	for (let step = 1; step <= steps; step++) {
		cumulativeErrorX += deltaErrX;
		cumulativeErrorY += deltaErrY;

		if (cumulativeErrorX >= 0.5) {
			currentX += signX;
			cumulativeErrorX -= 1;
		}

		if (cumulativeErrorY >= 0.5) {
			currentY += signY;
			cumulativeErrorY -= 1;
		}

		const position = { x: currentX, y: currentY };

		const fuelCost = calculateFuelCost(position, player, grid, path);
		totalFuelUsed += fuelCost;

		// Calculate cargo increase
		const cell = grid[position.x]?.[position.y];
		if (cell && cell.ground?.type) {
			const mineralConfig = minerals[cell.ground.type];
			totalCargoUsed += mineralConfig.weight || 0.1;
		}

		// Check resource limits
		if (totalFuelUsed > player.fuel || totalCargoUsed > player.maxCargo) {
			break;
		}

		// Verify each step is valid
		if (!canDigPosition(position, player, grid)) {
			break;
		}

		// Check wheel support
		const movementDelta = {
			x: currentX - (path[path.length - 1]?.x || start.x),
			y: currentY - (path[path.length - 1]?.y || start.y),
		};
		let testOrientation = 'right';

		if (movementDelta.y === 0) {
			testOrientation = movementDelta.x < 0 ? 'left' : 'right';
		} else if (movementDelta.x === 0) {
			// Use consistent vertical orientation logic with server
			testOrientation = movementDelta.y < 0 ? 'up_left' : 'down_left';
		} else {
			if (movementDelta.y < 0 && movementDelta.x < 0) {
				testOrientation = 'up_left';
			} else if (movementDelta.y < 0 && movementDelta.x > 0) {
				testOrientation = 'up_right';
			} else if (movementDelta.y > 0 && movementDelta.x < 0) {
				testOrientation = 'down_left';
			} else {
				testOrientation = 'down_right';
			}
		}

		if (!hasWheelSupport(position, grid, path, testOrientation).hasSupport) {
			break;
		}

		path.push(position);

		if (currentX === end.x && currentY === end.y) {
			break;
		}
	}

	return path;
};

const generateAutoPath = (start, end, player, grid) => {
	if (!gameContext.autoPath.enabled) return [];

	// Check if cursor is within effective radius
	const distance = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
	if (distance > gameContext.autoPath.maxRadius) return [];

	// CRITICAL: Check if target position is actually reachable
	if (!canDigPosition(end, player, grid)) {
		return [];
	}

	let path = [];

	if (distance <= 2) {
		path = generateDirectPath(start, end, player, grid);
		if (path.length > 0) {
			return path;
		}
	}

	path = generateOptimizedAStar(start, end, player, grid);
	if (path.length > 0) {
		return path;
	}

	path = generateFlowField(start, end, player, grid);
	if (path.length > 0) {
		return path;
	}

	path = generateDirectPath(start, end, player, grid);
	if (path.length > 0) {
		return path;
	}

	return [];
};

const clearAllPaths = () => {
	line.forEach(rectangle => {
		if (rectangle.destroy) rectangle.destroy();
	});
	autoLine.forEach(rectangle => {
		if (rectangle.destroy) rectangle.destroy();
	});
	line.length = 0;
	autoLine.length = 0;
	path.length = 0;
	autoPath.length = 0;

	// Hide status bars when clearing paths
	hideResourceStatusBars();
};

const createPathDecayAnimation = (pathMarkers, onComplete) => {
	if (pathMarkers.length === 0) {
		if (onComplete) onComplete();
		return;
	}

	// Animate path markers to fade out in sequence
	pathMarkers.forEach((marker, index) => {
		const delay = index * 450;

		gameContext.scene.tweens.add({
			targets: marker,
			duration: 450,
			delay: delay,
			alpha: 0,
			scaleX: 0.5,
			scaleY: 0.5,
			onComplete: () => {
				if (marker.destroy) marker.destroy();

				// Call onComplete callback when the last marker finishes
				if (index === pathMarkers.length - 1 && onComplete) {
					onComplete();
				}
			},
		});
	});
};

export const submitPath = () => {
	const finalPath = [...path];

	if (finalPath.length === 0) return;

	const validation = validateMovementPath({
		player: gameContext.players.currentPlayer,
		path: finalPath,
		grid: gameContext.serverState.world.grid,
		maxPathLength,
	});

	if (!validation.valid) {
		clearAllPaths();
		return;
	}

	const pathMarkers = [...line, ...autoLine];

	line.length = 0;
	autoLine.length = 0;
	path.length = 0;
	autoPath.length = 0;

	if (gameContext.cursor) {
		gameContext.cursor.visible = false;
	}

	// Hide status bars on submit
	hideResourceStatusBars();

	gameContext.scene.sound.play('path_accept', { volume: gameContext.volume.interfaces });

	// Set movement start timestamp for failsafe detection
	gameContext.players.update(gameContext.playerId, _ => ({
		..._,
		_movingStartTime: Date.now(),
	}));

	playerMove({ path: validation.validPath });
	createPathDecayAnimation(pathMarkers);
};

// Helper function to check a single path step before adding it
const validatePathStep = (player, currentPath, targetPosition, grid) => {
	// Check if this would exceed path length
	if (currentPath.length >= maxPathLength) {
		return { valid: false, reason: 'path_too_long' };
	}

	// Use the existing validateMovement function
	const validation = validateMovement({
		player,
		targetPosition,
		currentPath,
		grid,
	});

	return validation;
};

// Helper function to add a position to the manual path with validation
const addToManualPath = (player, position, grid) => {
	const validation = validatePathStep(player, path, position, grid);

	if (!validation.valid) return false;

	// Create manual path marker with validation color (green for valid)
	const gridSnappedPxPosition = gridToPxPosition(position);
	const pathMarker = gameContext.scene.add.rectangle(
		gridSnappedPxPosition.x,
		gridSnappedPxPosition.y,
		64,
		64,
		getValidationColor(true), // Green for valid path
	);
	pathMarker.alpha = 0.3;
	pathMarker.setStrokeStyle(2, 0xffffff);

	line.push(pathMarker);
	path.push(position);

	// Update resource status bars for current path - positioned at final path position
	const pathResourceInfo = calculatePathResourceInfo(path, player, grid);
	createResourceStatusBars(pathResourceInfo, player, position);

	gameContext.scene.sound.play('path_select', { volume: gameContext.volume.interfaces });

	return true;
};

export const onPointerDown = pointer => {
	// Don't process pointer events if a dialog is open
	if (gameContext.openDialog?.elem?.open) return;

	const player = gameContext.players.currentPlayer;

	if (player?.moving) {
		// Track click attempts while moving for manual recovery
		if (!player._stuckClickCount) {
			gameContext.players.update(gameContext.playerId, _ => ({ ..._, _stuckClickCount: 1 }));
			return;
		} else if (player._stuckClickCount < 3) {
			gameContext.players.update(gameContext.playerId, _ => ({ ..._, _stuckClickCount: player._stuckClickCount + 1 }));
			return;
		}

		// Failsafe: If player has been moving for more than 30 seconds OR clicked 3+ times, assume stuck state
		const timeStuck = player._movingStartTime ? Date.now() - player._movingStartTime : 0;
		if (timeStuck > 30000 || player._stuckClickCount >= 3) {
			gameContext.players.update(gameContext.playerId, _ => ({
				..._,
				moving: false,
				_movingStartTime: null,
				_stuckClickCount: 0,
			}));

			// Re-enable cursor
			if (gameContext.cursor) {
				gameContext.cursor.visible = true;
			}
		} else {
			return;
		}
	}

	const gridPosition = pxToGridPosition({ x: pointer.worldX, y: pointer.worldY });
	const gridSnappedPxPosition = gridToPxPosition(gridPosition);

	if (gameContext.cursor) {
		gameContext.cursor.x = gridSnappedPxPosition.x;
		gameContext.cursor.y = gridSnappedPxPosition.y;
	}

	// Don't move if clicking on current position
	if (gridPosition.x === player.position.x && gridPosition.y === player.position.y) {
		return;
	}

	// If we already have a path (auto or manual), extend it or submit it
	if (autoPath.length > 0 || path.length > 0) {
		// If we have an auto-path, convert it to manual path first
		if (autoPath.length > 0 && path.length === 0) {
			// Convert auto path to manual path with validation
			for (const autoPos of autoPath) {
				if (!addToManualPath(player, autoPos, gameContext.serverState.world.grid)) {
					// If any step fails validation, stop converting
					break;
				}
			}

			// Clear auto-path arrays
			autoLine.forEach(element => element.destroy());
			autoLine.length = 0;
			autoPath.length = 0;

			return;
		}

		// Try to add this position to the existing manual path
		addToManualPath(player, gridPosition, gameContext.serverState.world.grid);
		return;
	}

	// Auto-path from current position to clicked position (no radius limit for clicks)
	// Use direct pathfinding first
	let newPath = generateDirectPath(player.position, gridPosition, player, gameContext.serverState.world.grid);

	if (newPath.length === 0 || newPath.length > maxPathLength) {
		// If direct path fails, try A* pathfinding
		newPath = generateOptimizedAStar(player.position, gridPosition, player, gameContext.serverState.world.grid);
	}

	if (newPath.length > 0 && newPath.length <= maxPathLength) {
		const validation = validateMovementPath({
			player,
			path: newPath,
			grid: gameContext.serverState.world.grid,
			maxPathLength,
		});

		if (validation.valid) {
			// Add the auto-pathed route to manual path, but exclusively up to where validation allows
			for (let i = 0; i < validation.validPath.length; i++) {
				const pathPos = validation.validPath[i];
				if (!addToManualPath(player, pathPos, gameContext.serverState.world.grid)) {
					// If any step fails validation, stop converting and use what we have
					break;
				}
			}
		} else {
			// Fallback: try single adjacent step if validation failed
			addToManualPath(player, gridPosition, gameContext.serverState.world.grid);
		}
	} else {
		// Final fallback: try to add this single position as a manual path step (for adjacent tiles)
		addToManualPath(player, gridPosition, gameContext.serverState.world.grid);
	}
};

export const onPointerMove = (pointer, gameObjects) => {
	// Socket reconnection is now handled by socket.js itself
	if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
		return; // Don't process pointer events if socket is down, but let reconnection handle it
	}

	// Don't process pointer events if a dialog is open
	if (gameContext.openDialog?.elem?.open) {
		return;
	}

	// Don't interfere with UI buttons
	const player = gameContext.players.currentPlayer;
	if (
		gameObjects.some(
			one =>
				one === gameContext.spaceco.tradeButton ||
				one === player?.sprite?.tradeButton ||
				one === player?.sprite?.bombButton ||
				one === player?.sprite?.teleportButton,
		)
	)
		return;

	if (!player) return;

	if (player.moving) {
		if (gameContext.cursor) {
			gameContext.cursor.visible = false;
		}

		if (autoPath.length > 0 || autoLine.length > 0) {
			autoLine.forEach(rectangle => rectangle.destroy());
			autoLine.length = 0;
			autoPath.length = 0;
		}

		// Hide status bars when player is moving
		hideResourceStatusBars();

		return;
	}

	const gridPosition = pxToGridPosition({ x: pointer.worldX, y: pointer.worldY });
	const gridSnappedPxPosition = gridToPxPosition(gridPosition);

	if (!gameContext.cursor) {
		gameContext.cursor = gameContext.scene.add.rectangle(0, 0, 64, 64, 0xff0000);
		gameContext.cursor.alpha = 0.3;
		gameContext.cursor.visible = false;
		gameContext.cursor.setStrokeStyle(2, 0xffffff);
		gameContext.sceneLayers.interfaces.add(gameContext.cursor);
	}

	gameContext.cursor.x = gridSnappedPxPosition.x;
	gameContext.cursor.y = gridSnappedPxPosition.y;
	gameContext.cursor.visible = true;
	gameContext.cursor.fillColor = 0xff0000;

	const distance = Math.abs(player.position.x - gridPosition.x) + Math.abs(player.position.y - gridPosition.y);

	if (pointer.isDown && path.length < maxPathLength) {
		if (gridPosition.x === player.position.x && gridPosition.y === player.position.y) {
			return;
		}

		if (autoPath.length > 0) {
			autoLine.forEach(rectangle => rectangle.destroy());
			autoLine.length = 0;
			autoPath.length = 0;
		}

		const lastPosition = path.length > 0 ? path[path.length - 1] : player.position;

		if (gridPosition.x === lastPosition.x && gridPosition.y === lastPosition.y) {
			return;
		}

		const delta = {
			x: gridPosition.x - lastPosition.x,
			y: gridPosition.y - lastPosition.y,
		};

		if (Math.abs(delta.x) > 1 || Math.abs(delta.y) > 1) {
			const steps = Math.max(Math.abs(delta.x), Math.abs(delta.y));

			for (let step = 1; step <= steps; step++) {
				const intermediateX = lastPosition.x + Math.round((delta.x * step) / steps);
				const intermediateY = lastPosition.y + Math.round((delta.y * step) / steps);
				const intermediatePosition = { x: intermediateX, y: intermediateY };

				const currentLast = path.length > 0 ? path[path.length - 1] : player.position;
				if (intermediatePosition.x === currentLast.x && intermediatePosition.y === currentLast.y) {
					continue;
				}

				// Try to add this step - if it fails validation, stop the drag operation
				if (!addToManualPath(player, intermediatePosition, gameContext.serverState.world.grid)) {
					break;
				}
			}
		} else {
			// Try to add this position - if it fails validation, ignore it
			addToManualPath(player, gridPosition, gameContext.serverState.world.grid);
		}
		return;
	}

	// Only generate auto path when appropriate
	if (
		!pointer.isDown &&
		gameContext.autoPath.enabled &&
		path.length === 0 &&
		distance <= gameContext.autoPath.maxRadius &&
		!(gridPosition.x === player.position.x && gridPosition.y === player.position.y)
	) {
		// Clear existing auto path visualization
		autoLine.forEach(rectangle => rectangle.destroy());
		autoLine.length = 0;

		const startPosition = player.position;
		const newAutoPath = generateAutoPath(startPosition, gridPosition, player, gameContext.serverState.world.grid);

		if (newAutoPath.length > 0 && newAutoPath.length <= maxPathLength) {
			const validation = validateMovementPath({
				player,
				path: newAutoPath,
				grid: gameContext.serverState.world.grid,
				maxPathLength,
			});

			if (validation.valid) {
				autoPath.length = 0;
				autoPath.push(...validation.validPath);

				// Calculate resource info for auto path status bars - positioned at final auto path position
				const pathResourceInfo = calculatePathResourceInfo(
					validation.validPath,
					player,
					gameContext.serverState.world.grid,
				);
				const finalAutoPathPosition = validation.validPath[validation.validPath.length - 1];
				createResourceStatusBars(pathResourceInfo, player, finalAutoPathPosition);

				validation.validPath.forEach((pos, index) => {
					const pathPxPosition = gridToPxPosition(pos);
					const isLastSegment = index === validation.validPath.length - 1;

					// Use blue auto-path color scheme with blue-green for final segment
					const autoMarker = gameContext.scene.add.rectangle(
						pathPxPosition.x,
						pathPxPosition.y,
						64,
						64,
						getAutoPathColor(isLastSegment), // Blue for auto-path, blue-green for final segment
					);
					autoMarker.alpha = 0.3;
					autoMarker.setStrokeStyle(1, isLastSegment ? 0x00ccaa : 0x0088cc); // Matching stroke colors

					// Add number indicator for path order
					const orderText = gameContext.scene.add.text(pathPxPosition.x, pathPxPosition.y, (index + 1).toString(), {
						fontSize: '18px',
						fontWeight: 'bold',
						fill: '#ffffff',
						stroke: '#000000',
						strokeThickness: 3,
					});
					orderText.setOrigin(0.5, 0.5);

					autoLine.push(autoMarker, orderText);
				});

				// Update cursor color to match validation status
				if (validation.valid && gameContext.cursor.fillColor === 0xff0000) {
					gameContext.cursor.fillColor = getValidationColor(true); // Green for valid
				}
			}
		}
	} else if (
		!pointer.isDown &&
		(distance > gameContext.autoPath.maxRadius ||
			!gameContext.autoPath.enabled ||
			path.length > 0 ||
			(gridPosition.x === player.position.x && gridPosition.y === player.position.y))
	) {
		// Clear auto path when outside radius, auto-path disabled, manual path exists, or hovering over player
		if (autoPath.length > 0) {
			autoLine.forEach(rectangle => rectangle.destroy());
			autoLine.length = 0;
			autoPath.length = 0;
		}

		// Hide status bars when no path
		if (path.length === 0) {
			hideResourceStatusBars();
		}

		// Hide cursor if outside radius and no manual path, or if hovering over player
		if (
			(distance > gameContext.autoPath.maxRadius && path.length === 0) ||
			(gridPosition.x === player.position.x && gridPosition.y === player.position.y)
		) {
			gameContext.cursor.visible = false;
			return;
		}
	}

	// Standard movement validation for cursor color (exclusively when cursor is visible and not on player)
	if (gameContext.cursor.visible && !(gridPosition.x === player.position.x && gridPosition.y === player.position.y)) {
		const currentPathForValidation = path.length > 0 ? path : autoPath;
		const validation = validateMovement({
			player,
			targetPosition: gridPosition,
			currentPath: currentPathForValidation,
			grid: gameContext.serverState.world.grid,
		});

		// Set cursor color based on validation status
		gameContext.cursor.fillColor = getValidationColor(validation.valid);
	}

	// Hide cursor when hovering over player position
	if (gridPosition.x === player.position.x && gridPosition.y === player.position.y) {
		gameContext.cursor.visible = false;
		// Hide status bars when hovering over player
		if (path.length === 0) {
			hideResourceStatusBars();
		}
	}
};

export const onPointerUp = () => {
	// Don't process pointer events if a dialog is open
	if (gameContext.openDialog?.elem?.open) {
		return;
	}

	const player = gameContext.players.currentPlayer;

	if (player?.moving) return;

	// Submit path if we have one (either custom or auto)
	if (path.length > 0) {
		submitPath();
	} else if (autoPath.length > 0) {
		// Convert auto path to manual path and submit with validation
		for (const autoPos of autoPath) {
			if (!addToManualPath(player, autoPos, gameContext.serverState.world.grid)) {
				// If any step fails validation, stop converting and don't submit
				return;
			}
		}

		// Clear auto-path visualization
		autoLine.forEach(element => element.destroy());
		autoLine.length = 0;
		autoPath.length = 0;

		submitPath();
	}
};

export const onPointerOut = () => {
	if (gameContext.cursor) {
		gameContext.cursor.visible = false;
	}

	// Clear all paths when cursor leaves window
	if (path.length > 0 || autoPath.length > 0) {
		clearAllPaths();
	}
};

// Export auto-path configuration functions
export const setAutoPathStrategy = strategy => {
	gameContext.autoPath.strategy = strategy;
	saveAutoPathOptions();
};

export const toggleAutoPath = () => {
	gameContext.autoPath.enabled = !gameContext.autoPath.enabled;
	saveAutoPathOptions();

	if (!gameContext.autoPath.enabled) {
		// Clear auto path visualization
		autoLine.forEach(rectangle => rectangle.destroy());
		autoLine.length = 0;
		autoPath.length = 0;
		hideResourceStatusBars();
	}
};

export const setAutoPathRadius = radius => {
	gameContext.autoPath.maxRadius = Math.max(4, Math.min(12, radius)); // Clamp between 4-12
	saveAutoPathOptions();
};

export const addToIgnoreList = mineralType => {
	if (!gameContext.autoPath.ignore.includes(mineralType)) {
		gameContext.autoPath.ignore.push(mineralType);
		saveAutoPathOptions();
	}
};

export const removeFromIgnoreList = mineralType => {
	const index = gameContext.autoPath.ignore.indexOf(mineralType);
	if (index > -1) {
		gameContext.autoPath.ignore.splice(index, 1);
		saveAutoPathOptions();
	}
};

export const clearIgnoreList = () => {
	gameContext.autoPath.ignore = [];
	saveAutoPathOptions();
};
