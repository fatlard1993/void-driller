/* eslint-disable no-console */

const socket = new WebSocket(`ws://${window.location.host}/ws`);

export const onMessage = callback => {
	const listener = event => {
		try {
			callback(JSON.parse(event.data));
		} catch (error) {
			if (process.env.NODE_ENV === 'development') console.error('Error handling WS message:', error, event);
		}
	};

	socket.addEventListener('message', listener);

	return () => socket.removeEventListener('message', listener);
};

if (process.env.NODE_ENV === 'development') {
	socket.addEventListener('message', event => {
		if (event.data === 'hotReload') {
			console.log('ENV development hotReload');

			window.location.reload();
		}
	});
}

socket.addEventListener('error', error => {
	console.error('WS Error:', error);

	socket.close();
});

socket.addEventListener('close', event => {
	console.error('WS Closed:', event);
});

export default socket;
