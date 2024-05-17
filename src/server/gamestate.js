import * as types from "../shared/types";

const Gamestate = function (content, players) {
	const maps = {};

	const createMap = opts => {
		if (opts.name in maps) return;
		const map = {
			size: opts.size || 100,
			name: opts.name,
			entities: [],
			scheduled: []

			// binding methods
		}
		maps[map.name] = map;
		return map;
	}

	// observing

	const entities = mapname => mapname in maps ? maps[mapname].entities : [];
	const events = mapname => mapname in maps ? maps[mapname].scheduled : [];

	const at = (mapname, { x, y }) => entities(mapname).filter(e => e.x == x && e.y == y);

	const eventsAt = (mapname, { x, y }) => entities(mapname).filter(e => e.x == x && e.y == y);

	// mutating

	const createEntity = (type) => {
		return {
			type,
			x: NaN,
			y: NaN,
		}
	}

	const schedule = (mapname, [type, target, content]) => {
		if (!mapname in maps) return;
		maps[mapname].scheduled.push()
	}

	const move = (entity, mapname, { x, y }) => {
		if (entity.map != maps[mapname]) entity.map = maps[mapname];
		entity.x = x;
		entity.y = y;
	}

	// The Resolver (commits all changes to the diff)

	const handlers = {

	}
	const resolve = (mapname) => {
		if (!mapname in this.maps) return;
	}



	return {
		maps, createMap,
		at, eventsAt, entities, events,
		createEntity, schedule, move,
		handlers, resolve
	}
}

export { Gamestate };