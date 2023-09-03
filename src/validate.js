import { clamp } from "./utils.js";

function canAct(entity, { statkey, stat, statMax, statAct, statActCost, statSelf, statSelfCost }, entity2 = null) {

	if (statAct !== 0 && entity2 !== null) { // acting on another
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

export { canAct };