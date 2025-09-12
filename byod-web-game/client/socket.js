/* eslint-disable no-console */
import { debounce, Notify } from 'vanilla-bean-components';

let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3; // Reduce attempts to prevent rate limiting
const reconnectDelay = 3000; // Start with 3 second delay
const messageListeners = new Set(); // Track all message listeners

const createSocket = () => {
	socket = new WebSocket(`ws://${window.location.host}/ws`);

	socket.addEventListener('open', () => {
		console.log('WebSocket connected');

		// Re-attach all message listeners to the new socket
		messageListeners.forEach(listener => {
			socket.addEventListener('message', listener);
		});

		// Show restoration message if this was a reconnection
		if (reconnectAttempts > 0) {
			new Notify({
				type: 'success',
				content: '[COMM] Signal restored. Mission Control is back online.',
				timeout: 2000,
				x: window.innerWidth / 2,
				y: 100,
			});
		}

		reconnectAttempts = 0; // Reset after showing message
	});

	socket.addEventListener('error', error => {
		console.error('WS Error:', error);
		new Notify({
			type: 'error',
			content: '[COMM] Transmission error. Attempting to reestablish contact...',
			timeout: 3000,
			x: window.innerWidth / 2,
			y: 100,
		});
	});

	socket.addEventListener('close', event => {
		console.error('WS Closed:', event);

		if (reconnectAttempts < maxReconnectAttempts) {
			reconnectAttempts++;
			const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1); // Exponential backoff

			new Notify({
				type: 'warning',
				content: `[COMM] Signal lost. Rerouting through backup relay in ${Math.round(delay / 1000)}s... (${reconnectAttempts}/${maxReconnectAttempts})`,
				timeout: delay - 500,
				x: window.innerWidth / 2,
				y: 100,
			});

			setTimeout(() => {
				console.log(`Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
				createSocket();
			}, delay);
		} else {
			new Notify({
				type: 'error',
				content: '[COMM] All communication relays down. Restarting drilling rig in 5 seconds...',
				timeout: 4500,
				x: window.innerWidth / 2,
				y: 100,
			});

			// Only reload after all reconnection attempts have failed
			setTimeout(() => {
				console.log('All reconnection attempts failed, reloading page...');
				window.location.reload();
			}, 5000);
		}
	});

	return socket;
};

// Initialize first connection
socket = createSocket();

export const onMessage = callback => {
	const listener = event => {
		try {
			callback(JSON.parse(event.data));
		} catch (error) {
			if (process.env.NODE_ENV === 'development') console.error('Error handling WS message:', error, event);
		}
	};

	// Add to tracked listeners
	messageListeners.add(listener);
	socket.addEventListener('message', listener);

	return () => {
		messageListeners.delete(listener);
		socket.removeEventListener('message', listener);
	};
};

if (process.env.NODE_ENV === 'development') {
	const debouncedReload = debounce(() => {
		console.log('ENV development hotReload');
		window.location.reload();
	}, 1000);

	const hotReloadListener = event => {
		if (event.data === 'hotReload') {
			debouncedReload();
		}
	};

	// Track the hot reload listener
	messageListeners.add(hotReloadListener);
	socket.addEventListener('message', hotReloadListener);
}

// Socket event handlers are now in createSocket() function

// Export object with getter to always return current socket instance
export default {
	get readyState() {
		return socket.readyState;
	},
	get CONNECTING() {
		return WebSocket.CONNECTING;
	},
	get OPEN() {
		return WebSocket.OPEN;
	},
	get CLOSING() {
		return WebSocket.CLOSING;
	},
	get CLOSED() {
		return WebSocket.CLOSED;
	},
	addEventListener: (...args) => socket.addEventListener(...args),
	removeEventListener: (...args) => socket.removeEventListener(...args),
	send: (...args) => socket.send(...args),
	close: (...args) => socket.close(...args),
};
