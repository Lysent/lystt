const Ticker = function (state, rate) {
	const stack = [];

	const queue = (event) => stack.push(event);

	let _perf = {};
	const perf = () => _perf;

	let iid;

	const start = () => {
		if (iid) stop();

		const interval = 1000 / rate;

		_perf = { tps: null, mspt: null, cpt: null, deviation: null, effort: null, interval };
		let clocks = 0, ticks = 0;

		let lastTick = performance.now(), lastReport = performance.now();
		const loop = async () => {
			const currentTime = performance.now();
			const elapsed = currentTime - lastTick;

			if (elapsed >= interval) {
				const pretick = performance.now();
				await tick();
				const posttick = performance.now();

				_perf.cpt = clocks;
				clocks = 0;

				// performance report (every second)
				const totalTime = currentTime - lastReport;
				if (totalTime >= 1000) {
					const tps = ticks / (totalTime + 1) * 1000;
					const mspt = posttick - pretick;
					const devi = 100 - (tps / rate) * 100;
					const eff = mspt / interval * 100;

					_perf.tps = tps.toFixed(2);
					_perf.mspt = mspt.toFixed(2);
					_perf.deviation = devi.toFixed(2);
					_perf.effort = eff.toFixed(2);

					// Reset counters
					ticks = 0;
					lastReport = currentTime;
				}

				ticks++
				lastTick = currentTime;
			}
			clocks++

			iid = setTimeout(loop, 1);
		}
		loop();
	}

	const stop = () => {
		clearTimeout(iid);
		iid = undefined;
	}

	const tick = async () => {
		return await new Promise(res => setTimeout(res, 10));
	}


	return {
		queue,
		start, stop,
		perf
	}
}

export { Ticker };