const staticRouter = async request => {
	const path = new URL(request.url).pathname;

	// console.log('static server', path);

	let file = Bun.file(`client/build${path}`);

	if (!(await file.exists())) file = Bun.file(`node_modules${path}`);
	if (!(await file.exists())) file = Bun.file(`client${path}`);
	if (!(await file.exists())) file = Bun.file(path);

	// DEV support for zelda
	if (!(await file.exists())) file = Bun.file(`../node_modules${path}`);
	if (!(await file.exists())) file = Bun.file(`../node_modules/vanilla-bean-components/node_modules/${path}`);

	if (!(await file.exists())) return new Response(`File Not Found: ${path}`, { status: 404 });

	return new Response(file);
};
export default staticRouter;
