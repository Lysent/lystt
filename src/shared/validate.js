import { clamp, inSquare } from "./utils.js";

function canAct(entity, { statkey, stat, statMax, statAct, statActCost, statActRange, statSelf, statSelfCost }, entity2 = null) {

	// (disallow modifying non-number stats, like costs or procedures)
	if (typeof stat !== 'number') return { code: 1 }; // ERROR 1: Not possible

	if (statAct !== 0 && entity2 !== null) { // acting on another
		if (!inSquare(
			this.state.entityPositions(entity)[0],
			this.state.entityPositions(entity2)[0],
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

function canMove(entity, dest) {
	if (entity === undefined) return { code: 6 }; // ERROR 6: No entity
	if (entity.static === true) return { code: 5 }; // ERROR 5: Entity not allowed to move (static)

	const ori = this.state.entityPositions(entity)[0];
	const dist = Math.max(Math.abs(ori[0] - dest[0]), Math.abs(ori[1] - dest[1])); // square distance
	const maxsteps = Math.floor(entity.AP / entity.moveCost); // amount of possible steps, based on available AP and movement cost

	if (this.state.tileOccupied(dest)) return { code: 1 }; // ERROR 1: Destination occupied
	if (maxsteps <= dist) return { code: 2 }; // ERROR 2: Not enough AP
	if (dist >= 100) return { code: 3 }; // ERROR 3: Tried to move too far

	// if it can teleport
	if (entity.teleports === true && dist <= maxsteps) return {
		code: -1, // Success 1: Can teleport
		cost: dist * entity.moveCost
	};

	// pathfinding
	const queue = [{ pos: ori, steps: 0 }];
	const visited = new Set([ori.toString()]);

	while (queue.length) {
		const { pos, steps } = queue.shift();

		if (pos[0] === dest[0] && pos[1] === dest[1]) {
			return steps <= maxsteps
				? { code: 0, cost: steps * entity.moveCost } // Success 0: Can move
				: { code: 4 }; // ERROR 4: Path impossible in given steps
		};

		if (steps >= maxsteps) continue;
		const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

		for (const [dx, dy] of directions) {
			const newpos = [pos[0] + dx, pos[1] + dy];

			if (this.state.tileOccupied(newpos)) continue;

			const newPositionStr = newpos.toString();

			if (visited.has(newPositionStr)) continue;
			visited.add(newPositionStr);
			queue.push({ pos: newpos, steps: steps + 1 });
		};
	};

	return { code: 4 }; // ERROR 4: Path impossible in given steps
};

export { canAct, canMove };