import { Gamestate } from "./gamestate.js";
import { Messages } from "./messages.js";
import { NetworkWS } from "./network.js";
import { Players } from "./playerstate.js";
import { Ticker } from "./tick.js";

const LysTServer = function (opts) {
	const { port, content, tickrate } = opts;

	const players = new Players();
	const state = new Gamestate(content, players);
	const tick = new Ticker(state, tickrate || 20);
	const msgs = new Messages(tick);
	const net = new NetworkWS(port, msgs);

	const stop = function() {
		this.tick.stop();
		this.networking.close();
	}
	tick.start();

	return {
		players, state, tick, msgs, net,
		stop
	}
}

export { LysTServer };