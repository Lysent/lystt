import { Gamestate } from "./gamestate.js";
import { Events } from "./events.js";

const lystt = {
	map: {},
	initServer() {

	}
};
lystt.gs = new Gamestate(lystt.map);
lystt.ev = new Events(lystt.gs);
window.lystt = lystt;