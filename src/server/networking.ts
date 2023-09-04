import { Server, Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";

class NetworkServer {
	clients: Map<string, Socket> = new Map();
	io: any;

	constructor(port: number) {
		this.io = new Server();
		this.startServer(port);
		this.setupSocketIO();
	};

	private async startServer(port: number) {
		Deno.serve({ port }, this.io.handler());
		console.log(`WebSocket server is running on :${port}`);
	};

	private setupSocketIO() {
		this.io.on("connection", (socket: Socket) => {
			console.log(`socket ${socket.id} connected`);

			const clientId = socket.id.toString();
			this.clients.set(clientId, socket);

			socket.on("disconnect", () => {
				this.clients.delete(clientId);
			});
		});
	};

	sendToClient(clientId: string, data: string) {
		const socket = this.clients.get(clientId);
		if (socket) {
			socket.send(data);
		};
	};

	sendToAll(data: string) {
		this.io.emit("message", data);
	};
};

export { NetworkServer };