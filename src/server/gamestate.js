class Gamestate {
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
	}

	//
	// mutation
	//
	placeEntity(entity, position) {
		this.map[position] = entity;
		// TODO expand for multitile
	};

	removeEntity(entity) {
		for (const pos of this.entityPositions(entity)) {
			delete this.map[pos];
		};
	};
	removePos(pos){
		this.removeEntity(this.map[pos]);
	};

	// teleport without place check
	tpEntity(entity, dest) {
		this.removeEntity(entity);
		this.placeEntity(entity, dest);
	};
	tpPos(ori, dest){
		this.tpEntity(this.map[ori], dest);
	};
};

export { Gamestate };