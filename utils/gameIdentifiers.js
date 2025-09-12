import { randFromArray, randInt } from '../byod-web-game/utils';

const greek = ['Alpha', 'Beta', 'Gamma', 'Sigma', 'Zeta', 'Theta', 'Omega', 'Delta'];
const roman = ['I', 'II', 'III', 'IV', 'V', 'A', 'B', 'X'];

export const contractName = () => {
	const adjectives = [
		'Void',
		'Deep',
		'Cold',
		'Black',
		'Silent',
		'Hollow',
		'Ghost',
		'Redline',
		'Starlit',
		'Grav',
		'Quantum',
		'Phase',
		'Thermal',
		'Ion',
		'Cryo',
		'Titan',
		'Ultra',
		'Nova',
		'Dusty',
	];

	const nouns = [
		'Drift',
		'Belt',
		'Core',
		'Vault',
		'Spike',
		'Jack',
		'Haul',
		'Rat',
		'Badger',
		'Crawler',
		'Anchor',
		'Forge',
		'Breaker',
		'Spindle',
		'Vane',
		'Bore',
		'Auger',
		'Hammer',
		'Chisel',
	];

	const patterns = [
		() => `${randFromArray(adjectives)}${randFromArray(nouns)}-${randInt(2, 99)}`,
		() => `${randFromArray(nouns)}${randFromArray(nouns)}-${randInt(1, 9)}`,
		() => `Ore${randFromArray(['Bust', 'Run', 'Rush', 'Chain'])}-${randInt(1, 99)}`,
		() => `${randFromArray(adjectives)}-${randFromArray(nouns)}-${randFromArray(roman)}`,
		() => `${randFromArray(nouns)}-${randFromArray(greek)}-${randInt(100, 999)}`,
	];

	return randFromArray(patterns)();
};

export const playerName = () => {
	const firstNames = [
		'Ash',
		'Barrett',
		'Blake',
		'Cass',
		'Devon',
		'Ellis',
		'Flynn',
		'Harper',
		'Jax',
		'Kai',
		'Logan',
		'Mason',
		'Nova',
		'Quinn',
		'Riley',
		'Sawyer',
		'Taryn',
		'Vega',
		'Wynn',
		'Zane',
	];

	const lastNames = [
		'Calder',
		'Dray',
		'Forge',
		'Halley',
		'Harker',
		'Huxley',
		'Ives',
		'Kincaid',
		'March',
		'Mercer',
		'Pike',
		'Rook',
		'Sable',
		'Slate',
		'Stroud',
		'Talbot',
		'Vance',
		'Webb',
		'Wolfe',
		'York',
	];

	const ranks = ['Lt.', 'Cmdr.', 'Chief', 'Specialist', 'Operator', 'Captain'];

	const adjectives = [
		'Rusty',
		'Grim',
		'Lone',
		'Grav',
		'Iron',
		'Chrome',
		'Hollow',
		'Dusty',
		'Redline',
		'Quantum',
		'Cryo',
		'Phase',
	];

	const nouns = [
		'Badger',
		'Viper',
		'Rat',
		'Wasp',
		'Crawler',
		'Mole',
		'Drake',
		'Hammer',
		'Wrench',
		'Spike',
		'Burrower',
		'Buzzard',
		'Jackal',
		'Breaker',
		'Bore',
		'Auger',
		'Chisel',
	];

	const callsigns = [
		'Grinder',
		'Starjack',
		'Corehound',
		'Dust Devil',
		'Ironhand',
		'Piton',
		'Deep Rat',
		'Hollowback',
		'Quasar',
		'Flux',
		'Scarab',
		'Warden',
		'Bolt',
		'Stonecut',
		'Nightdrill',
		'Vaultfox',
	];

	const patterns = [
		() => `${randFromArray(firstNames)} ${randFromArray(lastNames)}`,
		() => `${randFromArray(ranks)} ${randFromArray(lastNames)}`,
		() => `${randFromArray(firstNames)} '${randFromArray(callsigns)}' ${randFromArray(lastNames)}`,

		() => `${randFromArray(adjectives)} ${randFromArray(nouns)}`,
		() => `${randFromArray(nouns)}-${String(randInt(2, 99)).padStart(2, '0')}`,
		() => `${randFromArray(nouns)}-${randFromArray(greek)}-${randInt(100, 999)}`,
		() => `Unit-${randFromArray(nouns)}-${randInt(100, 999)}`,
		() => `Op-${randFromArray(greek)}-${randInt(100, 999)}`,
		() => `${randFromArray(lastNames)}-${randInt(10, 99)}`,
	];

	return randFromArray(patterns)();
};
