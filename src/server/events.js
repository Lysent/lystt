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
		if (entity.static === true) return 5; // ERROR 5: Entity not allowed to move

		const pos = this.gs.entityPositions(entity)[0];
		const dist = Math.max(Math.abs(pos[0] - dest[0]), Math.abs(pos[1] - dest[1])); // distance
		const steps = Math.floor(entity.AP / entity.moveCost); // amount of possible steps, based on available AP and movement cost

		if (this.gs.tileOccupied(dest)) return 1; // ERROR 1: Destination occupied
		if (steps <= dist) return 2; // ERROR 2: Not enough AP
		if (steps >= 100) return 3; // ERROR 3: Tried to move too far

		// if it can teleport
		if (entity.teleports === true && dist <= steps) {
			this.gs.mutstatEntity(entity, -1 * dist * entity.moveCost);
			this.gs.tpEntity(entity, dest);
			return -1; // Success 1: Teleported
		};

		// pathfinding
		const status = canMove.call(this, entity, dest, steps);
		if (status.code > 0) return 4; // ERROR 4: Path impossible

		this.gs.mutstatEntity(entity, "AP", -1 * status.steps * entity.moveCost);
		this.gs.tpEntity(entity, dest);
		return 0; // Success 0: Moved
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