import { LysTServer } from "./server/index.js";
import { types } from "./shared/types.js";

const options = {
	port: 3000,
	content: {
		lystt: types
	}
}

const game = new LysTServer(options);
process.game = game;

// no fatality
process.on('uncaughtException', e => console.error(e));