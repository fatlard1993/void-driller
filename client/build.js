import { watch } from 'fs';

const build = async () => {
	console.log('Building...');

	const buildResults = await Bun.build({
		entrypoints: ['client/index.html'],
		outdir: 'client/build',
		define: {
			'process.env.AUTOPREFIXER_GRID': 'undefined',
			'process.cwd': 'String'
		},
		...(import.meta.env === 'production' && { drop: ['console'] }),
	});

	console.log(buildResults.success ? 'build.success' : buildResults.logs);

	return buildResults;
};

const enableWatcher = process.argv[2] === '--watch';
const watcherIgnore = /^client\/build|^\./;

if (enableWatcher) {
	console.log(`Initializing watcher`);

	const watcher = watch(`${import.meta.dir}/..`, { recursive: true }, (event, filename) => {
		if (watcherIgnore.test(filename)) return;

		console.log(`Detected ${event} in ${filename}`);

		build();
	});

	process.on('SIGINT', () => {
		watcher.close();
		process.exit(0);
	});
}

await build();
