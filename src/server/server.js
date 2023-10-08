import { State } from "./state.js";
import { Events } from "./events.js";
import { NetworkServer } from "./networking.ts";

class LysT {
	map = {};
	constructor(){
		this.state = new State(this.map);
		this.ev = new Events(this.state);
		this.net = new NetworkServer(3000);
	};
};

const lystt = new LysT();
window.lystt = lystt;