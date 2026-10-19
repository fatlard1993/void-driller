import { hasWheelSupport, moveHasSupport } from './grid';

// A 3x3 shaft with solid rock only in the cells named, as "x,y"
const shaft = (...solid) =>
	[0, 1, 2].map(x => [0, 1, 2].map(y => ({ ground: solid.includes(`${x},${y}`) ? { type: 'rock' } : {} })));

const up = { x: 0, y: -1 };

describe('moveHasSupport', () => {
	test('climbing beside a right-hand wall grips as well as beside a left-hand one', () => {
		const rightWall = shaft('2,0', '2,1', '2,2');
		const leftWall = shaft('0,0', '0,1', '0,2');
		const position = { x: 1, y: 1 };

		expect(moveHasSupport(position, rightWall, [], 'up_left', up).supportCount).toBe(2);
		expect(moveHasSupport(position, leftWall, [], 'up_left', up).supportCount).toBe(2);
		// Measured on the left only, the right-hand wall read as no grip
		expect(hasWheelSupport(position, rightWall, [], 'up_left').supportCount).toBe(0);
	});

	test('a sideways or diagonal move keeps the orientation it was given', () => {
		const rightWall = shaft('2,0', '2,1', '2,2');
		const position = { x: 1, y: 1 };

		expect(moveHasSupport(position, rightWall, [], 'left', { x: -1, y: 0 }).orientation).toBe('left');
		expect(moveHasSupport(position, rightWall, [], 'up_left', { x: -1, y: -1 }).orientation).toBe('up_left');
	});
});
