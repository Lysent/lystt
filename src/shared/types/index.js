import { TemplatePath, getTemplatePath, setTemplatePath, Entity} from "./datatypes.js";

const types = new Object();

// primitives for interacting with the global types
const set = (obj, path) => setTemplatePath(obj, types, path);
const get = (path) => getTemplatePath(types, path);

// type checked extensions
const addEntity = (inentity, inpath) => {
	const entity = Entity(inentity);
	const path = TemplatePath(inpath);
}

export {set, get};