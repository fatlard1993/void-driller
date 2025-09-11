const requestMatch = (method, pattern, request) => {
	if (method !== request.method) return false;

	const url = new URL(request.url);
	const path = url.pathname;

	const result = {};

	for (const [key, value] of url.searchParams.entries()) result[key] = value;

	if (!pattern.includes(':')) return path === pattern && result;

	const regex = new RegExp(pattern.replaceAll('/', String.raw`\/`).replaceAll(/:[^/]+/g, '([^/]+)'));

	const keys = regex
		.exec(pattern)
		?.slice(1)
		?.map(key => key.slice(1));
	const values = regex.exec(path)?.slice(1);

	keys.forEach((key, index) => (result[key] = values?.[index] && decodeURI(values[index])));

	return values && result;
};

export default requestMatch;
