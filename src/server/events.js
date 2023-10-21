import { canAct, canMove } from "../shared/validate.js";

class Events {
	constructor(state) {
		this.state = state;
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

		this.state.mutstatEntity(entity, "AP", -1 * status.cost);
		this.state.tpEntity(entity, dest);
		return status.code; // Success
	};
	move(ori, dest) {
		return this.moveEntity(this.state.map[ori], dest);
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
				this.state.mutstatEntity(entity, statkey, status.data.delta);
				this.state.mutstatEntity(entity, statSelfCost[1], -status.data.cost);
				break;

			case -2: // Act success 2: modified target
				this.state.mutstatEntity(entity2, statkey, status.data.delta);
				this.state.mutstatEntity(entity, statActCost[1], -status.data.cost);

				// handle possible death
				if (entity2.health <= 0) this.deathHandler(entity2);
				break;
		};

		// Probably never happen, but possible if action cost is health
		if (entity.health <= 0) this.deathHandler(entity);

		return status.code;
	};
	act(pos, statkey, target = null) {
		return this.actEntity(this.state.map[pos], statkey, target === null ? null : this.state.map[target]);
	};

	//
	// Procedures
	//
	procedure(pos, procname, target = null){

	};
	procedureEntity(entity, procname, target = null){
		// procedures flip the convention on its head: the *Entity wraps the positional.
		const oriPos = this.state.entityPositions(entity)[0];
		return this.procedure(oriPos, procname, target === null ? oriPos : target);
	};

	//
	// Legalizers
	//
	deathHandler(entity) {
		// current basic death handling: straight up delete it
		this.state.removeEntity(entity);
	};
};

export { Events };