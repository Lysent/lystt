import { State } from "./state.js";
import { Events } from "./events.js";

class LysT {
	map = {};
	constructor(){
		this.state = new State(this.map);
		this.ev = new Events(this.state);
	};
};

const lystt = new LysT();
window.lystt = lystt;