/** The app's routes: the router is built from these, and so is every link and redirect */
export const paths = {
	create: '/create',
	hub: '/hub',
	join: '/join/:gameId',
	play: '/play/:gameId',
	watch: '/watch/:gameId',
	dev: '/dev',
};

/**
 * A hash link to one of the paths, its params filled in
 * @example href(paths.join, { gameId })
 * @param {string} path - One of paths
 * @param {object} [params] - A value for each :param in it
 * @returns {string} The link
 */
export const href = (path, params = {}) => `#${path.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]))}`;
