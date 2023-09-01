import { clamp } from "../utils.js";

class Events {
	constructor(gamestate) {
		this.gs = gamestate;
	};

	//
	// Event-related extra data
	//
	data = {
		players: {}
	}

	//
	// Ticking
	//
	queue = [];

	tick() {
		const events = [...this.queue];
		this.queue = [];
		for (const ev of events) {
			this.handler(ev);
		};
	};

	//
	// Event handling
	//
	handler(ev) {

	};

	//
	// movement
	//
	moveEntity(entity, dest) {
		if (this.gs.tileOccupied(dest)) return 1;

		this.gs.tpEntity(entity, dest);
		return 0;
	};
	move(ori, dest) {
		return this.moveEntity(this.gs.map[ori], dest);
	};

	//
	// Act
	//
	actEntity(entity, statkey, entity2 = null) {
		statkey = String(statkey); // sanitize a bit

		const stat = entity[statkey] || 0;
		const statMax = entity[statkey + "Max"] || 0;
		const statAct = entity[statkey + "Act"] || 0;
		const statActCost = entity[statkey + "ActCost"] || 0;
		const statSelf = entity[statkey + "Self"] || 0;
		const statSelfCost = entity[statkey + "SelfCost"] || 0;

		if (statAct !== 0 && entity2 !== null) { // acting on another
			const cost = statActCost === 0 ? 0 : statActCost[0];

			if (entity2[statkey] === undefined) return 2; // ERROR 2: Trying to act on undefined stat
			if (cost > entity[statActCost[1]]) return 3; // ERROR 3: Not enough resources to act

			const delta = clamp(
				entity2[statkey] + statAct,
				0,
				entity2[statkey + "Max"] === -1 ? Infinity : entity2[statkey + "Max"]
			) - entity2[statkey];

			if (delta === 0) return 0; // Act success 0: no change

			this.gs.mutstatEntity(entity2, statkey, delta);
			this.gs.mutstatEntity(entity, statActCost[1], -cost);
			return -2; // Act success 2: modified target

		} else if (statSelf !== 0) { // otherwise, acting on self
			const cost = statSelfCost === 0 ? 0 : statSelfCost[0];
			if (cost > entity[statSelfCost[1]]) return 3; // ERROR 3: Not enough resources to act

			const delta = clamp(stat - statSelf, 0, statMax === -1 ? Infinity : statMax);
			if (delta === 0) return 0; // Act success 0: no change

			this.gs.mutstatEntity(entity, statkey, delta);
			this.gs.mutstatEntity(entity, statSelfCost[1], -cost);
			return -1; // Act success 1: modified self
		};
		return 1; // ERROR 1: No action possible
	};
	act(pos, statkey, target = null) {
		return this.actEntity(this.gs.map[pos], statkey, target === null ? null : this.gs.map[target]);
	};

};

export { Events };