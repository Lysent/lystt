import { Gamestate } from "./gamestate.js";
import { Messages } from "./messages.js";
import { NetworkWS } from "./network.js";
import { Players } from "./playerstate.js";
import { Ticker } from "./tick.js";


class LysTServer {
	constructor(opts) {
		const { port, content, tickrate } = opts;

		const players = new Players();
		const state = new Gamestate(content, players);
		const tick = new Ticker(state, tickrate);
		const msgs = new Messages(tick);
		const net = new NetworkWS(port, msgs);

		this.players = players;
		this.state = state;
		this.tick = tick;
		this.messages = msgs;
		this.networking = net;
	}
}

export { LysTServer };