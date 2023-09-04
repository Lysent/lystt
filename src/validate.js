import { clamp, inSquare } from "./utils.js";

function canAct(entity, { statkey, stat, statMax, statAct, statActCost, statActRange, statSelf, statSelfCost }, entity2 = null) {

	if (statAct !== 0 && entity2 !== null) { // acting on another
		if (!inSquare(
			this.gs.entityPositions(entity)[0],
			this.gs.entityPositions(entity2)[0],
			statActRange
		)) return { code: 4 }; // ERROR 4: Not in range

		const cost = statActCost === 0 ? 0 : statActCost[0];

		if (entity2[statkey] === undefined) return { code: 2 }; // ERROR 2: Trying to act on undefined stat
		if (cost > entity[statActCost[1]]) return { code: 3 }; // ERROR 3: Not enough resources to act

		const delta = clamp(
			entity2[statkey] + statAct,
			0,
			entity2[statkey + "Max"] === -1 ? Infinity : entity2[statkey + "Max"]
		) - entity2[statkey];

		if (delta === 0) return { code: 0 }; // Act success 0: no change

		return {
			code: -2, // Act success 2: can modify target
			data: { delta, cost }
		};

	} else if (statSelf !== 0) { // otherwise, acting on self
		const cost = statSelfCost === 0 ? 0 : statSelfCost[0];
		if (cost > entity[statSelfCost[1]]) return { code: 3 }; // ERROR 3: Not enough resources to act

		const delta = clamp(stat - statSelf, 0, statMax === -1 ? Infinity : statMax);
		if (delta === 0) return { code: 0 }; // Act success 0: no change

		return {
			code: -1, // Act success 1: can modify self
			data: { delta, cost }
		};
	};
	return { code: 1 }; // ERROR 1: No action possible
};

function canMove(entity, end, maxsteps) {
	const start = this.gs.entityPositions(entity)[0];
	const queue = [{ pos: start, steps: 0 }];
	const visited = new Set([start.toString()]);

	while (queue.length) {
		const { pos, steps } = queue.shift();

		if (pos[0] === end[0] && pos[1] === end[1]) return steps <= maxsteps ? { code: 0, steps } : { code: 1 };

		if (steps >= maxsteps) continue;
		const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

		for (const [dx, dy] of directions) {
			const newpos = [pos[0] + dx, pos[1] + dy];

			if(this.gs.tileOccupied(newpos)) continue;

			const newPositionStr = newpos.toString();

			if (visited.has(newPositionStr)) continue;
			visited.add(newPositionStr);
			queue.push({ pos: newpos, steps: steps + 1 });
		};
	};

	return { code: 1 }; // ERROR 1: No.
};

export { canAct, canMove };