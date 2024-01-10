import { Server } from 'ws';

class NetworkWS {
	constructor(port) {
		this.port = port;
		this.clients = new Set();
		this.server = new Server({ port });

		this.server.on('listening', () => {
			console.log(`WebSocket server is listening on port ${port}`);
		});

		this.server.on('connection', (socket) => {
			this.handleConnection(socket);

			socket.on('message', (message) => {
				this.handleMessage(socket, message);
			});

			socket.on('close', (code, reason) => {
				this.handleDisconnection(socket, code, reason);
			});
		});
	}

	broadcast(message) {
		this.clients.forEach((client) => {
			client.send(message);
		});
	}

	handleConnection(socket) {
		console.log(`Client connected: ${socket._socket.remoteAddress}`);

		this.clients.add(socket);

		// Example: send a welcome message to the new client
		socket.send('Welcome to the game server!');
	}

	handleMessage(socket, message) {
		console.log(`Received message from ${socket._socket.remoteAddress}: ${message}`);

		// Example: broadcast the received message to all clients
		this.broadcast(`[${socket._socket.remoteAddress}]: ${message}`);
	}

	handleDisconnection(socket, code, reason) {
		console.log(`Client disconnected: ${socket._socket.remoteAddress} (Code: ${code}, Reason: ${reason})`);

		this.clients.delete(socket);
	}

	close() {
		this.server.close();
		console.log('WebSocket server closed');
	}
}

export { NetworkWS };
