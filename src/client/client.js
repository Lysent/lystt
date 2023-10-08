import { EventsClient } from "./events.js";
import { StateClient } from "./state.js";
import { NetworkClient } from "./networking.js";

class LysTClient {
	constructor(serverurl, { name, key }) {
		this.state = new StateClient();
		this.ev = new EventsClient(this.state);
		this.net = new NetworkClient(serverurl, {name, key});

		this.net.io.on("data", data => this.ev.receive(data));
	};
};

window.lystt = new LysTClient("ws://localhost:3000", {name: "Tikup", key: "supersecurepassword"});