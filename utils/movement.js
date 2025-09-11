import { drills, minerals } from '../constants/index.js';
import { findBestOrientation, hasWheelSupport } from './grid.js';

export const calculateDrillOrientation = (currentPosition, targetPosition, grid, player) => {
	const delta = {
		x: targetPosition.x - currentPosition.x,
		y: targetPosition.y - currentPosition.y,
	};

	// Use the new findBestOrientation function for better wheel support
	const bestOrientation = findBestOrientation(targetPosition, grid, delta, player.orientation, []);

	// Check if the best orientation actually has support
	const support = hasWheelSupport(targetPosition, grid, [], bestOrientation);

	if (support.hasSupport) {
		return bestOrientation;
	}

	// Pure horizontal movement
	if (delta.y === 0) {
		return delta.x < 0 ? 'left' : 'right';
	}

	// Pure vertical movement with wheel flipping logic
	if (delta.x === 0) {
		const movingUp = delta.y < 0;

		// Check current wheel side
		const currentWheelSide = player.orientation.includes('left') ? 'left' : 'right';
		const preferredOrientation = movingUp ? `up_${currentWheelSide}` : `down_${currentWheelSide}`;

		// Test if preferred orientation has support
		const preferredSupport = hasWheelSupport(targetPosition, grid, [], preferredOrientation);
		if (preferredSupport.hasSupport) {
			return preferredOrientation;
		}

		// If preferred side doesn't work, try the opposite side
		const oppositeSide = currentWheelSide === 'left' ? 'right' : 'left';
		const alternateOrientation = movingUp ? `up_${oppositeSide}` : `down_${oppositeSide}`;

		const alternateSupport = hasWheelSupport(targetPosition, grid, [], alternateOrientation);
		if (alternateSupport.hasSupport) {
			return alternateOrientation;
		}

		// If neither side works, try angled movement
		const angledLeft = movingUp ? 'up_left_angle' : 'down_left_angle';
		const angledRight = movingUp ? 'up_right_angle' : 'down_right_angle';

		const angledLeftSupport = hasWheelSupport(targetPosition, grid, [], angledLeft);
		const angledRightSupport = hasWheelSupport(targetPosition, grid, [], angledRight);

		if (angledLeftSupport.hasSupport && angledLeftSupport.supportCount >= angledRightSupport.supportCount) {
			return angledLeft;
		} else if (angledRightSupport.hasSupport) {
			return angledRight;
		}

		// Final fallback
		return preferredOrientation;
	}

	// Diagonal movement
	const isDiagonal = Math.abs(delta.x) === Math.abs(delta.y) && Math.abs(delta.x) === 1;

	let baseOrientation;
	if (delta.y < 0 && delta.x < 0) {
		baseOrientation = 'up_left';
	} else if (delta.y < 0 && delta.x > 0) {
		baseOrientation = 'up_right';
	} else if (delta.y > 0 && delta.x < 0) {
		baseOrientation = 'down_left';
	} else {
		baseOrientation = 'down_right';
	}

	return isDiagonal ? baseOrientation + '_angle' : baseOrientation;
};

/**
 * Validates if a player can move from their current position to a target position
 * @param {object} params - Validation parameters
 * @param {object} params.player - Player object with position, configuration, cargo, maxCargo
 * @param {object} params.targetPosition - Target grid position {x, y}
 * @param {Array} params.currentPath - Current path (for path validation)
 * @param {Array} params.grid - World grid
 * @returns {object} - {valid: boolean, reason?: string}
 */
export const validateMovement = ({ player, targetPosition, currentPath = [], grid }) => {
	const { x, y } = targetPosition;

	// Check if target cell exists
	if (!grid[x]?.[y]) {
		return { valid: false, reason: 'out_of_bounds' };
	}

	// Can't move to current position
	if (x === player.position.x && y === player.position.y) {
		return { valid: false, reason: 'same_position' };
	}

	// Check movement distance (must be adjacent)
	const lastMove = currentPath[currentPath.length - 1] || player.position;
	const delta = {
		x: Math.abs(x - lastMove.x),
		y: Math.abs(y - lastMove.y),
	};

	if (delta.x > 1 || delta.y > 1 || (delta.x === 0 && delta.y === 0)) {
		return { valid: false, reason: 'invalid_distance' };
	}

	// Check if position already used in current path
	if (currentPath.some(step => step.x === x && step.y === y)) {
		return { valid: false, reason: 'already_used' };
	}

	// Check cargo capacity and fuel consumption for mining operations - account for cumulative values
	const targetCell = grid[x][y];
	
	// Calculate cumulative cargo from current path ONLY
	let cumulativeCargo = player.cargo;
	for (const pathStep of currentPath) {
		const stepCell = grid[pathStep.x]?.[pathStep.y];
		if (stepCell?.ground?.type) {
			const mineralConfig = minerals[stepCell.ground.type];
			cumulativeCargo += mineralConfig.weight || 0.1;
		}
	}
	
	// Calculate fuel cost for this new step (not the entire path)
	let baseFuelConsumption = 0.1 / player.fuelEfficiency;
	if (targetCell?.ground?.type) {
		const mineralConfig = minerals[targetCell.ground.type];
		const miningPenalty = 0.3 + mineralConfig.density * 0.5;
		baseFuelConsumption = Math.max(baseFuelConsumption, miningPenalty / player.fuelEfficiency);
	}
	
	const cargoWeightRatio = cumulativeCargo / player.maxCargo;
	const cargoFuelMultiplier = 1.0 + cargoWeightRatio * 0.2;
	const stepFuelCost = baseFuelConsumption * cargoFuelMultiplier;
	
	// Calculate cumulative fuel from current path ONLY
	let cumulativeFuel = 0;
	let tempCargo = player.cargo;
	for (const pathStep of currentPath) {
		const stepCell = grid[pathStep.x]?.[pathStep.y];
		
		// Calculate fuel cost for this previous step
		let stepBaseFuel = 0.1 / player.fuelEfficiency;
		if (stepCell?.ground?.type) {
			const mineralConfig = minerals[stepCell.ground.type];
			const miningPenalty = 0.3 + mineralConfig.density * 0.5;
			stepBaseFuel = Math.max(stepBaseFuel, miningPenalty / player.fuelEfficiency);
		}
		
		const stepCargoRatio = tempCargo / player.maxCargo;
		const stepCargoMultiplier = 1.0 + stepCargoRatio * 0.2;
		cumulativeFuel += stepBaseFuel * stepCargoMultiplier;
		
		// Update temp cargo for next calculation
		if (stepCell?.ground?.type) {
			const mineralConfig = minerals[stepCell.ground.type];
			tempCargo += mineralConfig.weight || 0.1;
		}
	}
	
	// Check if adding this step would exceed fuel
	if (cumulativeFuel + stepFuelCost > player.fuel) {
		return { valid: false, reason: 'insufficient_fuel' };
	}
	
	// Check cargo capacity specifically for this mining operation
	if (targetCell.ground?.type) {
		// Check if cargo is already at capacity BEFORE trying to add mineral
		if (cumulativeCargo >= player.maxCargo) {
			return { valid: false, reason: 'cargo_full' };
		}
	}

	// Check drill strength vs mineral hardness
	if (targetCell.ground?.type) {
		const drillConfig = drills[player.configuration.drill];
		const mineralConfig = minerals[targetCell.ground.type];

		if (drillConfig.strength < mineralConfig.strength) {
			return { valid: false, reason: 'insufficient_drill_strength' };
		}
	}

	// Calculate the best orientation for this movement
	const movementDelta = {
		x: targetPosition.x - lastMove.x,
		y: targetPosition.y - lastMove.y,
	};

	const bestOrientation = findBestOrientation(targetPosition, grid, movementDelta, player.orientation, currentPath);
	const wheelSupport = hasWheelSupport(targetPosition, grid, currentPath, bestOrientation);

	if (!wheelSupport.hasSupport) {
		return { valid: false, reason: 'no_wheel_support', debug: { orientation: bestOrientation, support: wheelSupport } };
	}

	return { valid: true, orientation: bestOrientation };
};

/**
 * Validates an entire movement path
 * @param {object} params - Validation parameters
 * @param {object} params.player - Player object
 * @param {Array} params.path - Array of positions [{x, y}, ...]
 * @param {Array} params.grid - World grid
 * @param {number} params.maxPathLength - Allowed path length
 * @returns {object} - {valid: boolean, reason?: string, validPath?: Array}
 */
export const validateMovementPath = ({ player, path, grid, maxPathLength = 30 }) => {
	if (path.length === 0) return { valid: false, reason: 'empty_path' };
	if (path.length > maxPathLength) return { valid: false, reason: 'path_too_long' };

	const validPath = new Array(path.length);
	let validPathLength = 0;

	const usedPositions = new Map();
	usedPositions.set(`${player.position.x},${player.position.y}`, true);

	const drillConfig = drills[player.configuration.drill];
	const drillStrength = drillConfig.strength;
	const gridWidth = grid.length;
	const gridHeight = grid[0]?.length || 0;
	const maxCargo = player.maxCargo;

	let currentCargo = player.cargo;
	let lastX = player.position.x;
	let lastY = player.position.y;

	for (let i = 0; i < path.length; i++) {
		const position = path[i];
		const x = position.x;
		const y = position.y;
		const positionKey = `${x},${y}`;

		if (usedPositions.has(positionKey)) {
			return { valid: false, reason: 'already_used', validPath: validPath.slice(0, validPathLength) };
		}

		if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
			return { valid: false, reason: 'out_of_bounds', validPath: validPath.slice(0, validPathLength) };
		}

		const deltaX = Math.abs(x - lastX);
		const deltaY = Math.abs(y - lastY);
		const distance = deltaX + deltaY;

		if (distance > 2 || distance === 0) {
			return { valid: false, reason: 'invalid_distance', validPath: validPath.slice(0, validPathLength) };
		}

		const gridRow = grid[x];
		const cell = gridRow[y];
		const groundType = cell.ground?.type;

		if (groundType) {
			if (currentCargo >= maxCargo) {
				return { valid: false, reason: 'cargo_full', validPath: validPath.slice(0, validPathLength) };
			}

			const mineralConfig = minerals[groundType];
			if (drillStrength < mineralConfig.strength) {
				return { valid: false, reason: 'insufficient_drill_strength', validPath: validPath.slice(0, validPathLength) };
			}

			currentCargo += mineralConfig.weight || 0.1;
		}

		const movementDeltaX = x - lastX;
		const movementDeltaY = y - lastY;

		let bestOrientation;
		if (movementDeltaY === 0) {
			// Pure horizontal
			bestOrientation = movementDeltaX < 0 ? 'left' : 'right';
		} else if (movementDeltaX === 0) {
			// Pure vertical - use simplified logic
			bestOrientation = movementDeltaY < 0 ? 'up_right' : 'down_right';
		} else {
			// Diagonal - determine based on direction
			if (movementDeltaY < 0 && movementDeltaX < 0) {
				bestOrientation = deltaX === 1 && deltaY === 1 ? 'up_left_angle' : 'up_left';
			} else if (movementDeltaY < 0 && movementDeltaX > 0) {
				bestOrientation = deltaX === 1 && deltaY === 1 ? 'up_right_angle' : 'up_right';
			} else if (movementDeltaY > 0 && movementDeltaX < 0) {
				bestOrientation = deltaX === 1 && deltaY === 1 ? 'down_left_angle' : 'down_left';
			} else {
				bestOrientation = deltaX === 1 && deltaY === 1 ? 'down_right_angle' : 'down_right';
			}
		}

		const currentValidPath = validPath.slice(0, validPathLength);
		const wheelSupport = hasWheelSupport(position, grid, currentValidPath, bestOrientation);

		if (!wheelSupport.hasSupport) {
			return { valid: false, reason: 'no_wheel_support', validPath: currentValidPath };
		}

		validPath[validPathLength] = position;
		validPathLength++;
		usedPositions.set(positionKey, true);
		lastX = x;
		lastY = y;
	}

	return { valid: true, validPath: validPath.slice(0, validPathLength) };
};
