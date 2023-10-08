import { EventsClient } from "./events.js";
import { StateClient } from "./state.js";

class LysTClient {
	constructor() {
		this.state = new StateClient();
		this.ev = new EventsClient(this.state);
	};
};

window.lystt = new LysTClient();