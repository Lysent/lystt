import { EventsClient } from "./events.js";
import { GamestateClient } from "./gamestate.js";
import { NetworkClient } from "./networking.js";

class LysTClient {
	constructor(serverurl, { name, key }) {
		this.gs = new GamestateClient({});
		this.ev = new EventsClient(this.gs);
		this.net = new NetworkClient(serverurl, {name, key});
	};
};

window.lystt = new LysTClient("ws://localhost:3000", {name: "Tikup", key: "supersecurepassword"});