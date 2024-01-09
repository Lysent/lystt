const TemplatePath = inpath => {
	if (typeof inpath !== 'string') throw "TemplatePath input must be a string";

	const splitPrefix = inpath.split(":");
	if (splitPrefix.length !== 2) throw "TemplatePath must only be composed of a prefix and a path";

	const [prefix, path] = splitPrefix;
	const pathParts = path.split(".");

	return { prefix, path: pathParts };
};
const getTemplatePath = (obj, inpath) => {
	const path = TemplatePath(inpath);

	return path.path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};
const setTemplatePath = (value, obj, inpath) => {
	const path = TemplatePath(inpath);

	return path.reduce((acc, key, index) => {
		if (index === path.length - 1) {
			acc[key] = value; // Set the value at the last key in the path
		} else {
			acc[key] = acc[key] || {}; // Create an object if the key is not defined
		}
		return acc[key]; // Return the next level for the next iteration
	}, obj);
};

const Coord = inarr => {
	if (inarr.length !== 2) throw "Coord must be a 2d point";

	const [x, y] = inarr;
	if (!Number.isInteger(x) && !Number.isInteger(y)) throw "Coord must be made of integers";

	return inarr;
};

export { TemplatePath, getTemplatePath, setTemplatePath, Coord };