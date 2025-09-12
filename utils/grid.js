export const pxToGridPosition = position => {
	if (typeof position === 'object')
		position = { x: Math.round((position.x - 32) / 64), y: Math.round((position.y - 32) / 64) };
	else position = Math.round((position - 32) / 64);

	return position;
};

export const gridToPxPosition = position => {
	if (position && typeof position === 'object') position = { x: position.x * 64 + 32, y: position.y * 64 + 32 };
	else position = position * 64 + 32;

	return position;
};

export const getImmediateSurrounds = (
	position,
	directionKeys = [
		'left',
		'right',
		'farLeft',
		'farRight',
		'top',
		'topLeft',
		'topRight',
		'bottom',
		'bottomLeft',
		'bottomRight',
	],
	grid = [],
) => {
	const directionMap = {};

	directionKeys.forEach(direction => {
		if (!direction) return;

		let xMod = 0,
			yMod = 0;

		if ({ left: 1, topLeft: 1, bottomLeft: 1, farLeft: 1 }[direction]) --xMod;
		if ({ right: 1, topRight: 1, bottomRight: 1, farRight: 1 }[direction]) ++xMod;
		if ({ farLeft: 1 }[direction]) --xMod;
		if ({ farRight: 1 }[direction]) ++xMod;
		if ({ top: 1, topLeft: 1, topRight: 1 }[direction]) --yMod;
		if ({ bottom: 1, bottomLeft: 1, bottomRight: 1 }[direction]) ++yMod;

		const x = position.x + xMod,
			y = position.y + yMod;

		directionMap[direction] = { x, y, ...(grid?.[x]?.[y] || {}) };
	});

	return directionMap;
};

export const getSurroundingRadius = (position, radius, grid = []) => {
	const surroundingRadius = [];
	const roundedRadius = Math.round(radius);

	for (let x = position.x - roundedRadius; x <= position.x + roundedRadius; x++) {
		for (let y = position.y - roundedRadius; y <= position.y + roundedRadius; y++) {
			if (Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2) <= Math.pow(radius, 2)) {
				surroundingRadius.push({ x, y, ...(grid?.[x]?.[y] || {}) });
			}
		}
	}

	return surroundingRadius;
};

export const getGridCell = (grid, x, y) => {
	if (x < 0 || y < 0 || x >= grid.length || !grid[x] || y >= grid[x].length) {
		return null;
	}
	return grid[x][y];
};

export const positionIsOccupied = (position, grid) => {
	const cell = getGridCell(grid, position.x, position.y);
	if (!cell) return true; // Out of bounds counts as occupied

	return cell.ground?.type || (cell.hazards && cell.hazards.length > 0);
};

export const findFurthestConnectedPoint = (
	position,
	grid,
	moves = [
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	],
) => {
	const width = grid.length;
	const depth = grid[0].length;
	const queue = [[position.x, position.y, 0]];
	const checked = new Set([`${position.x}_${position.y}`]);

	let furthestPoint = { x: position.x, y: position.y };
	let maxDistance = 0;

	while (queue.length > 0) {
		const [x, y, distance] = queue.shift();

		if (distance > maxDistance) {
			maxDistance = distance;
			furthestPoint = { x, y };
		}

		moves.forEach(([xDelta, yDelta]) => {
			const check = { x: x + xDelta, y: y + yDelta };

			if (
				check.x >= 0 &&
				check.x < width &&
				check.y >= 0 &&
				check.y < depth &&
				!grid[check.x][check.y].ground?.type &&
				!checked.has(`${check.x}_${check.y}`)
			) {
				checked.add(`${check.x}_${check.y}`);
				queue.push([check.x, check.y, distance + 1]);
			}
		});
	}

	return furthestPoint;
};

/**
 * Checks if a position has proper wheel support for a mining rig
 * @param {object} position - Grid position {x, y}
 * @param {Array} grid - World grid (may be simulated)
 * @param {Array} excludePositions - Positions to exclude from footing check
 * @param {string} orientation - Current rig orientation
 * @returns {object} - Detailed support information
 */
export const hasWheelSupport = (position, grid, excludePositions = [], orientation = 'right') => {
	// Early bounds checking - fastest possible exit
	const cell = getGridCell(grid, position.x, position.y);
	if (!cell) {
		return {
			hasSupport: false,
			supportCount: 0,
			supportPositions: [],
			requiredPositions: [],
			totalSolidGround: 0,
			orientation,
		};
	}

	// Static wheel configurations lookup (no object creation)
	const getRequiredPositions = orient => {
		switch (orient) {
			case 'left':
			case 'right':
				return ['bottom', 'bottomLeft', 'bottomRight'];
			case 'up_left':
			case 'down_left':
				// For vertical movement, only require support from accessible positions
				return ['left', 'bottomLeft', 'bottom'];
			case 'up_right':
			case 'down_right':
				// For vertical movement, only require support from accessible positions
				return ['right', 'bottomRight', 'bottom'];
			case 'up_left_angle':
			case 'down_left_angle':
				return ['bottom', 'bottomLeft', 'left', 'bottomRight'];
			case 'up_right_angle':
			case 'down_right_angle':
				return ['bottom', 'bottomRight', 'right', 'bottomLeft'];
			default:
				return ['bottom', 'bottomLeft', 'bottomRight'];
		}
	};

	const requiredWheelPositions = getRequiredPositions(orientation);

	// Pre-build exclusion set only if needed
	let exclusionSet = null;
	if (excludePositions && excludePositions.length > 0) {
		exclusionSet = new Set();
		for (let i = 0; i < excludePositions.length; i++) {
			const pos = excludePositions[i];
			if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
				exclusionSet.add(`${pos.x},${pos.y}`);
			}
		}
	}

	// Inline surrounding position calculation and checking
	const baseX = position.x;
	const baseY = position.y;

	const supportedWheelPositions = [];
	let totalSolidGround = 0;

	// Check each required position directly (avoiding object creation)
	for (let i = 0; i < requiredWheelPositions.length; i++) {
		const direction = requiredWheelPositions[i];
		let checkX, checkY;

		// Inline offset calculation (faster than lookup)
		switch (direction) {
			case 'left':
				checkX = baseX - 1;
				checkY = baseY;
				break;
			case 'right':
				checkX = baseX + 1;
				checkY = baseY;
				break;
			case 'bottom':
				checkX = baseX;
				checkY = baseY + 1;
				break;
			case 'bottomLeft':
				checkX = baseX - 1;
				checkY = baseY + 1;
				break;
			case 'bottomRight':
				checkX = baseX + 1;
				checkY = baseY + 1;
				break;
			case 'top':
				checkX = baseX;
				checkY = baseY - 1;
				break;
			case 'topLeft':
				checkX = baseX - 1;
				checkY = baseY - 1;
				break;
			case 'topRight':
				checkX = baseX + 1;
				checkY = baseY - 1;
				break;
			default:
				continue;
		}

		// Use getGridCell for consistent bounds checking
		const checkCell = getGridCell(grid, checkX, checkY);
		if (checkCell && checkCell.ground?.type) {
			// Only check exclusion if we have exclusions (avoid Set.has when possible)
			if (!exclusionSet || !exclusionSet.has(`${checkX},${checkY}`)) {
				supportedWheelPositions.push(direction);
				totalSolidGround++;
			}
		}
	}

	// For mining scenarios, be more lenient - allow movement if there's ANY solid ground nearby
	// or if we're in a reasonable movement scenario
	let hasSupport = supportedWheelPositions.length >= 1;

	// If no direct support, check for any solid ground in immediate vicinity
	if (!hasSupport && totalSolidGround === 0) {
		// Check all 8 surrounding positions for any solid ground
		const surroundingPositions = ['left', 'right', 'top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
		let nearbySupport = false;

		for (const direction of surroundingPositions) {
			let checkX, checkY;
			switch (direction) {
				case 'left':
					checkX = baseX - 1;
					checkY = baseY;
					break;
				case 'right':
					checkX = baseX + 1;
					checkY = baseY;
					break;
				case 'top':
					checkX = baseX;
					checkY = baseY - 1;
					break;
				case 'bottom':
					checkX = baseX;
					checkY = baseY + 1;
					break;
				case 'topLeft':
					checkX = baseX - 1;
					checkY = baseY - 1;
					break;
				case 'topRight':
					checkX = baseX + 1;
					checkY = baseY - 1;
					break;
				case 'bottomLeft':
					checkX = baseX - 1;
					checkY = baseY + 1;
					break;
				case 'bottomRight':
					checkX = baseX + 1;
					checkY = baseY + 1;
					break;
				default:
					continue;
			}

			const checkCell = getGridCell(grid, checkX, checkY);
			if (checkCell && checkCell.ground?.type) {
				// Check if this position is excluded
				if (!exclusionSet || !exclusionSet.has(`${checkX},${checkY}`)) {
					nearbySupport = true;
					break;
				}
			}
		}

		// Allow movement if there's any solid ground nearby (fallback support)
		if (nearbySupport) {
			hasSupport = true;
		}
	}

	return {
		hasSupport,
		supportCount: supportedWheelPositions.length,
		supportPositions: supportedWheelPositions,
		requiredPositions: requiredWheelPositions,
		totalSolidGround,
		orientation,
	};
};

/**
 * Finds the best orientation for a position given available ground support
 * @param {object} position - Grid position {x, y}
 * @param {Array} grid - World grid (may be simulated)
 * @param {object} movementDelta - {x, y} movement direction
 * @param {string} currentOrientation - Current rig orientation
 * @param {Array} excludePositions - Positions to exclude from footing check
 * @returns {string} - Best orientation for this position
 */
export const findBestOrientation = (position, grid, movementDelta, currentOrientation, excludePositions = []) => {
	// Validate inputs
	if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
		return currentOrientation || 'right';
	}

	if (!movementDelta) {
		movementDelta = { x: 0, y: 0 };
	}

	// Generate possible orientations based on movement
	const possibleOrientations = [];

	// Pure horizontal movement
	if (movementDelta.y === 0) {
		possibleOrientations.push(movementDelta.x < 0 ? 'left' : 'right');
	}
	// Pure vertical movement
	else if (movementDelta.x === 0) {
		const movingUp = movementDelta.y < 0;
		possibleOrientations.push(movingUp ? 'up_left' : 'down_left', movingUp ? 'up_right' : 'down_right');
	}
	// Diagonal movement
	else {
		const isDiagonal = Math.abs(movementDelta.x) === Math.abs(movementDelta.y) && Math.abs(movementDelta.x) === 1;

		let baseOrientation;
		if (movementDelta.y < 0 && movementDelta.x < 0) {
			baseOrientation = 'up_left';
		} else if (movementDelta.y < 0 && movementDelta.x > 0) {
			baseOrientation = 'up_right';
		} else if (movementDelta.y > 0 && movementDelta.x < 0) {
			baseOrientation = 'down_left';
		} else {
			baseOrientation = 'down_right';
		}

		possibleOrientations.push(isDiagonal ? baseOrientation + '_angle' : baseOrientation);
	}

	// If no orientations generated, fall back to current orientation
	if (possibleOrientations.length === 0) {
		possibleOrientations.push(currentOrientation || 'right');
	}

	// Test each possible orientation and return the best one
	let bestOrientation = possibleOrientations[0];
	let bestSupport = hasWheelSupport(position, grid, excludePositions, bestOrientation);

	for (let i = 1; i < possibleOrientations.length; i++) {
		const orientation = possibleOrientations[i];
		const support = hasWheelSupport(position, grid, excludePositions, orientation);
		if (support.hasSupport && support.supportCount > bestSupport.supportCount) {
			bestOrientation = orientation;
			bestSupport = support;
		}
	}

	// If no ideal support found for vertical movement, try the opposite side
	if (!bestSupport.hasSupport && movementDelta.x === 0 && movementDelta.y !== 0) {
		const movingUp = movementDelta.y < 0;
		const currentSide = currentOrientation && currentOrientation.includes('left') ? 'left' : 'right';
		const oppositeSide = currentSide === 'left' ? 'right' : 'left';
		const alternateOrientation = movingUp ? `up_${oppositeSide}` : `down_${oppositeSide}`;

		const alternateSupport = hasWheelSupport(position, grid, excludePositions, alternateOrientation);
		if (alternateSupport.hasSupport) {
			bestOrientation = alternateOrientation;
			bestSupport = alternateSupport;
		}
	}

	return bestOrientation;
};
