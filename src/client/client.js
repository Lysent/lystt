import { EventsClient } from "./events.js";
import { StateClient } from "./state.js";

class LysTClient {
	constructor(serverurl, { name, key }) {
		this.state = new StateClient();
		this.ev = new EventsClient(this.state);
	};
};

window.lystt = new LysTClient("ws://localhost:3000", {name: "Tikup", key: "supersecurepassword"});