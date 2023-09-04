import { canAct, canMove } from "../validate.js";

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
		const status = canMove.call(this, entity, dest);
		if (status.code > 0) return status.code; // ERROR

		this.gs.mutstatEntity(entity, "AP", -1 * status.cost);
		this.gs.tpEntity(entity, dest);
		return status.code; // Success
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
		const statActRange = entity[statkey + "ActRange"] || entity.range || 0;
		const statSelf = entity[statkey + "Self"] || 0;
		const statSelfCost = entity[statkey + "SelfCost"] || 0;

		const status = canAct.call(this, entity, { statkey, stat, statMax, statAct, statActCost, statActRange, statSelf, statSelfCost }, entity2);

		if (status.code >= 0) return status.code;
		switch (status.code) {
			case -1: // Act success 1: modified self
				this.gs.mutstatEntity(entity, statkey, status.data.delta);
				this.gs.mutstatEntity(entity, statSelfCost[1], -status.data.cost);
				break;

			case -2: // Act success 2: modified target
				this.gs.mutstatEntity(entity2, statkey, status.data.delta);
				this.gs.mutstatEntity(entity, statActCost[1], -status.data.cost);
				break;
		};
		return status.code;
	};
	act(pos, statkey, target = null) {
		return this.actEntity(this.gs.map[pos], statkey, target === null ? null : this.gs.map[target]);
	};

};

export { Events };