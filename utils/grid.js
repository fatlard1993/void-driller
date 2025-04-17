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
	const x_from = position.x - radius,
		x_to = position.x + radius;
	const y_from = position.y - radius,
		y_to = position.y + radius;
	const surroundingRadius = [];

	for (let x = x_from, y; x <= x_to; ++x) {
		for (y = y_from; y <= y_to; ++y) surroundingRadius.push({ x: x, y: y, ...(grid?.[x]?.[y] || {}) });
	}

	return surroundingRadius;
};

export const hasFooting = (position, grid, directionKeys = ['left', 'right', 'bottom']) => {
	const surrounds = getImmediateSurrounds(position, directionKeys, grid);

	return Object.values(surrounds).some(_position => _position.ground?.type);
};
