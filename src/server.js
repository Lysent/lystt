import { LysTServer } from "./server/index.js";
import { content } from "./shared/content.js";

const options = {
	port: 3000,
	content: {
		lystt: content
	}
}

const game = new LysTServer(options);
process.game = game;

// no fatality
process.on('uncaughtException', e => console.error(e));