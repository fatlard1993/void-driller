/**
 * A save that settles shortly after the last change but never waits longer than `atMost` while changes keep coming. A
 * trailing debounce alone is reset by every change, so a game that broadcasts every half second never reaches the disk.
 * @param {Function} persist - Writes the current state
 * @param {object} [options] - Timing
 * @param {number} [options.settle] - Quiet time before a write, in ms
 * @param {number} [options.atMost] - Longest a write is deferred while changes keep coming, in ms
 * @returns {Function & { flush: Function }} The save to call on every change; flush writes now if one is pending
 */
export const persistWithin = (persist, { settle = 1000, atMost = 5000 } = {}) => {
	let timer = null;
	let last = Date.now();

	const run = () => {
		timer = null;
		last = Date.now();
		persist();
	};

	const save = () => {
		if (timer) clearTimeout(timer);

		timer = setTimeout(run, Math.max(0, Math.min(settle, last + atMost - Date.now())));
	};

	save.flush = () => {
		if (!timer) return;

		clearTimeout(timer);
		run();
	};

	return save;
};
