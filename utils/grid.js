export const pxToGridPosition = position => {
	if (typeof position === 'object')
		position = { x: Math.round((position.x - 32) / 64), y: Math.round((position.y - 32) / 64) };
	else position = Math.round((position - 32) / 64);

	return position;
};

export const gridToPxPosition = position => {
	if (typeof position === 'object') position = { x: position.x * 64 + 32, y: position.y * 64 + 32 };
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

export const hasFooting = (position, grid, directionKeys = ['left', 'right', 'bottom']) => {
	const surrounds = getImmediateSurrounds(position, directionKeys, grid);

	return Object.values(surrounds).some(_position => _position.ground?.type);
};
