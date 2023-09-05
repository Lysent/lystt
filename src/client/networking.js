// import "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.0/socket.io.min.js";

class NetworkClient {
	constructor(serverurl, creds) {
		this.io = io(serverurl, { transports: ['websocket'] });
		this.creds = creds;
		this.setupSocketIO();
	};

	setupSocketIO() {
		this.io.on("connect", async () => {
			console.log("Connected to server " + this.io.id);
			await this.authenticate(this.io);
			console.log("Authenticated");
		});
	};

	authenticate(socket) {
		return new Promise((res, rej) => socket.emit("auth", this.creds, code => {
			if (code > 0) return rej("Authentication failed: error #" + code);
			res(code);
		}));
	};
};

export { NetworkClient };