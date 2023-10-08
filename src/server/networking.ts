import { Server, Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { buf2hex } from "../utils.js";

class NetworkServer {
	clients: Map<string, Socket> = new Map();
	players: Map<string, object> = new Map();
	io: any;

	constructor(port: number) {
		this.io = new Server({
			cors: {
				origin: "*:*",
				methods: ["GET", "POST"],
				credentials: true,
			}
		});
		this.startServer(port);
		this.setupSocketIO();
	};

	//
	// Setup
	//
	private async startServer(port: number) {
		Deno.serve({ port }, this.io.handler());
		console.log(`WebSocket server is running on :${port}`);
	};

	private setupSocketIO() {
		this.io.on("connection", (socket: Socket) => {
			console.log(`socket ${socket.id} connected`);

			const clientId = socket.id.toString();
			this.clients.set(clientId, socket);

			socket.on("auth", async (data, res) => {
				if (typeof data.name !== 'string' || typeof data.key !== 'string') return res(1);

				res(0);
				this.players.set(clientId, {
					name: data.name,
					key: buf2hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.key)))
				});
				this.sendToAll(["players", await this.makeClientPlayersList(this.players)]);
			});

			socket.on("disconnect", async () => {
				this.clients.delete(clientId);
				this.players.delete(clientId);
				console.log(`socket ${socket.id} disconnected`);
				this.sendToAll(["players", await this.makeClientPlayersList(this.players)]);
			});
		});
	};

	//
	// Sending
	//
	sendToClient(clientId: string, data: string) {
		const socket = this.clients.get(clientId);
		if (socket) {
			socket.send(data);
		};
	};

	sendToAll(data: any) {
		this.io.emit("data", data);
	};

	//
	// Helpers
	//
	async makeClientPlayersList(players: Map<string, any>) {
		const clean: object = new Object();

		for await (const [connid, creds] of Array.from(players)) {
			const id = buf2hex(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(creds.key)));
			clean[id as keyof Object] = creds.name;
		};
		return clean;
	}
};

export { NetworkServer };