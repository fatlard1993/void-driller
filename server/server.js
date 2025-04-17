import router from './router';

const clients = {};
export let url = '';

export const socketBroadcast = data => {
	Object.values(clients).forEach(socket => {
		socket.send(JSON.stringify(data));
	});
};

export const reloadClients = () => {
	Object.entries(clients).forEach(([clientId, socket]) => {
		console.log(`[dev] Reloading ${clientId}`);

		socket.send('hotReload');
	});
};

export const spawnBuild = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

	for await (const chunk of buildProcess.stdout) {
		const line = new TextDecoder().decode(chunk);

		console.log('[dev]', line);

		if (line === 'build.success\n') reloadClients();
	}
};

export default {
	clients,
	async init({ port }) {
		const server = Bun.serve({
			port,
			fetch: router,
			websocket: {
				open(socket) {
					clients[socket.data.clientId] = socket;
				},
				close(socket) {
					delete clients[socket.data.clientId];
				},
				message(socket, message) {
					console.log('socket message', socket, message);
					// if(message.startsWith('register_'))
				},
			},
		});

		url = server.url;

		console.log(`Listening on ${server.hostname}:${server.port}`);

		if (process.env.NODE_ENV === 'development') {
			await spawnBuild();
		}
	},
};
