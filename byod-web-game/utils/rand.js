import { randInt, randFromArray } from 'vanilla-bean-components/utils';
export { randInt, randFromArray };

export const shuffleArray = array => {
	for (let index = array.length - 1; index > 0; index--) {
		const rIndex = Math.floor(Math.random() * (index + 1));
		[array[index], array[rIndex]] = [array[rIndex], array[index]];
	}

	return array;
};

export const weightedChance = items => {
	const percentChance = randInt(0, 100);
	let sum = 0;

	Object.values(items).forEach(chance => {
		sum += chance;
	});

	if (sum !== 100) throw new Error(`weightedChance sum is not 100%: ${sum} || ${Object.keys(items).join(', ')}`);
	else sum = 0;

	const itemNames = Object.keys(items);

	for (let x = 0; x < itemNames.length; ++x) {
		sum += items[itemNames[x]];

		if (percentChance <= sum) return itemNames[x];
	}
};

export const chance = (percentage = 50) => percentage > 0 && randInt(0, 100) <= percentage;
