class State {
	constructor(map) {
		this.map = map;
	};

	//
	// math n stuff
	//
	rel = ([x, y], [rx, ry]) => [x + rx, y + ry];

	//
	// observation
	//
	entities() {
		return [...new Set(Object.values(this.map))];
	};
	tileOccupied(coords) {
		return Boolean(this.map[coords]);
	};
	entityPositions(entity) {
		return Object.keys(this.map)
			.filter(key => this.map[key] === entity)
			.map(k => JSON.parse(`[${k}]`));
		// since our keys are arrays, they get stringified, so we need to make them arrays again
	};
	bounds() { // find minimum bounds of map
		const occupied = Object.keys(this.map).map(k => JSON.parse(`[${k}]`));
		const occx = occupied.map(c => c[0]);
		const occy = occupied.map(c => c[1]);
		const least = [Math.min(...occx), Math.min(...occy)];
		const most = [Math.max(...occx), Math.max(...occy)];
		return [least, most];
	};

	// procedures
	autoProcsEntity(entity) {
		const procs = entity.procedures || {};
		return Object.keys(procs).filter(key => !!procs[key].automatic);
	};
	autoProcs(pos) {
		return this.autoProcsEntity(this.map[pos]);
	};
	manualProcsEntity(entity) {
		const procs = entity.procedures || {};
		return Object.keys(procs).filter(key => !procs[key].automatic);
	};
	manualProcs(pos) {
		return this.manualProcsEntity(this.map[pos]);
	};

	//
	// mutation
	//
	placeEntity(entity, position) {
		this.map[position] = entity;
		// TODO expand for multitile (one day)
	};

	removeEntity(entity) {
		for (const pos of this.entityPositions(entity)) { // This is parity for eventual multitile entities.
			delete this.map[pos];
		};
	};
	remove(pos) {
		return this.removeEntity(this.map[pos]);
	};

	// teleport without place check
	tpEntity(entity, dest) {
		this.removeEntity(entity);
		this.placeEntity(entity, dest);
	};
	tp(ori, dest) {
		return this.tpEntity(this.map[ori], dest);
	};

	// stats
	setstatEntity(entity, key, value) {
		return entity[key] = value;
	};
	setstat(pos, key, value) {
		return this.setstatEntity(this.map[pos], key, value);
	};
	mutstatEntity(entity, key, amount) {
		return this.setstatEntity(entity, key, entity[key] + amount);
	};
	mutstat(pos, key, amount) {
		return this.mutstatEntity(this.map[pos], key, amount);
	};
};

export { State };