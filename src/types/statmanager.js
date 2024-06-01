const defaultStats = [
	['health', 0, 100, 50],
	['stamina', 0, 50, 30],
	// more stats...
];

// Helper functions outside the closure to save memory
const _initialize = (stats) => {
	const statsArray = stats;
	const statsIndex = {};
	for (let i = 0; i < statsArray.length; i++) {
		const [name] = statsArray[i];
		statsIndex[name] = i;
	}
	return [statsArray, statsIndex];
};

const _clampValue = (value, min, max) => {

	return Math.min(Math.max(value, min), max);
};

const _get = (statsArray, statsIndex, name) => {
	const index = statsIndex[name];
	if (index !== undefined) {
		return {
			min: statsArray[index][1],
			max: statsArray[index][2],
			value: statsArray[index][3]
		};
	}
	return null;
};

const _getValue = (statsArray, statsIndex, name) => {
	const index = statsIndex[name];
	if (index !== undefined) {
		return statsArray[index][3];
	}
	return null;
};

const __modifyStat = (statsArray, index, newValue) => {
	if(isNaN(Number(newValue))) return statsArray[index][3];
	statsArray[index][3] = _clampValue(newValue, statsArray[index][1], statsArray[index][2]);
	return statsArray[index][3];
};

const _set = (statsArray, statsIndex, name, newValue) => {
	const index = statsIndex[name];
	if (index !== undefined) {
		return __modifyStat(statsArray, index, newValue);
	}
	return null;
};

const _mutate = (statsArray, statsIndex, name, amount) => {
	const index = statsIndex[name];
	if (index !== undefined) {
		return __modifyStat(statsArray, index, statsArray[index][3] + amount);
	}
	return null;
};

// Stats manager factory function
const statsManager = (initialStats) => {
	let statsArray;
	let statsIndex = {};

	const initialize = (stats) => {
		[statsArray, statsIndex] = _initialize(stats);
	};

	// Initialize with provided stats or default stats
	initialize(initialStats || defaultStats);

	// Public API
	const get = (name) => _get(statsArray, statsIndex, name);
	const getValue = (name) => _getValue(statsArray, statsIndex, name);
	const set = (name, newValue) => _set(statsArray, statsIndex, name, newValue);
	const mutate = (name, amount) => _mutate(statsArray, statsIndex, name, amount);
	const getStatsArray = () => statsArray;

	const serialize = () => JSON.stringify(statsArray);
	const deserialize = (jsonString) => {
		const parsedStats = JSON.parse(jsonString);
		initialize(parsedStats);
	};

	return {
		get,
		getValue,
		set,
		mutate,
		getStatsArray,
		serialize,
		deserialize
	};
};

export default statsManager;
export { statsManager };