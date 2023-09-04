import { Gamestate } from "./gamestate.js";
import { Events } from "./events.js";
import { NetworkServer } from "./networking.ts";

class LysT {
	map = {};
	constructor(){
		this.gs = new Gamestate(this.map);
		this.ev = new Events(this.gs);
		this.net = new NetworkServer(3000);
	};
};

const lystt = new LysT();
window.lystt = lystt;