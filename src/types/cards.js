// card factory function
const card = (stats = [], procs = [], handlers = []) => {
	let statChanges = stats; // [name, [operation, min], [operation, max], [operation, value]]
	let procedures = procs; // [name, function, parameters]
	let eventHandlers = handlers; // [eventName, function]

	const clone = (keepParams = false) => {
		const clonedStatChanges = JSON.parse(JSON.stringify(statChanges));
		const clonedProcs = JSON.parse(JSON.stringify(procedures));
		const clonedHandlers = JSON.parse(JSON.stringify(eventHandlers));

		if (!keepParams) {
			for (const proc of clonedProcs) {
				for (const param of proc[2]) {
					param[2] = null; // Clear the value
				}
			}
		}

		return createCardManager(clonedStatChanges, clonedProcs, clonedHandlers);
	};

	const getStats = () => statChanges;
	const getProcs = () => procedures;
	const getHandlers = () => eventHandlers;

	return {
		clone,
		getStats,
		getProcs,
		getHandlers,
	};
};

// helper functions for cardsManager
const _add = (hiddenDeck, normalDeck, size, card, hidden) => {
	if (hidden) {
		hiddenDeck.push(card);
		return true;
	} else {
		const index = normalDeck.indexOf(null);
		if (index !== -1) {
			normalDeck[index] = card;
			return true;
		} else if (normalDeck.length < size) {
			normalDeck.push(card);
			return true;
		}
		return false;
	}
}

const _remove = (deck, cardOrIndex) => {
	let card;
	if (typeof cardOrIndex === 'number') {
		card = deck[cardOrIndex];
		deck[cardOrIndex] = null;
	} else {
		const index = deck.indexOf(cardOrIndex);
		if (index !== -1) {
			card = deck[index];
			deck[index] = null;
		}
	}
	return card || false;
}

const _applyOperation = (opMin, opMax, opValue) => {
	switch (opMin[0]) {
		case 'set':
			return opValue[1];
		case 'add':
			return opMin[1] + opMax[1] + opValue[1];
		case 'multiply':
			return opMin[1] * opMax[1] * opValue[1];
		default:
			return opValue[1];
	}
};

// cards manager factory function
const cardsManager = (initialSize = 10) => {
	let size = initialSize || 1;
	let normalDeck = new Array(initialSize).fill(null);
	let hiddenDeck = [];
	let ejectedDeck = [];
	let statCache = [];
	let procCache = [];
	let handlerCache = [];

	const add = (card, hidden = false) => {
		const result = _add(hiddenDeck, normalDeck, size, card, hidden);
		if (result === true) rebuild();
		return result;
	};

	const remove = (cardOrIndex, hidden = false) => {
		const result = _remove(hidden ? hiddenDeck : normalDeck, cardOrIndex);
		if (result !== false) rebuild();
		return result;
	};

	const getSize = () => normalDeck.length;
	const setSize = (newSize) => {
		if(newSize === size) return size;
		if (newSize < normalDeck.length) {
			const overflow = normalDeck.slice(newSize).filter(card => card !== null);
			ejectedDeck.push(...overflow);
			normalDeck = normalDeck.slice(0, newSize);
			rebuild();
		}
		size = newSize;
		return size;
	};

	const addEjected = (card) => ejectedDeck.push(card);
	const getEjected = () => ejectedDeck;
	const clearEjected = () => {
		const ejected = [...ejectedDeck];
		ejectedDeck = [];
		return ejected;
	};

	const getHidden = () => hiddenDeck;
	const getDeck = () => normalDeck;

	const rebuildStats = () => {
		statCache = [];
		const addToCache = (deck) => {
			for (const card of deck) {
				if (card) {
					const stats = card.getStats();
					for (const stat of stats) {
						statCache.push(stat);
					}
				}
			}
		};
		addToCache(hiddenDeck);
		addToCache(normalDeck);
	};

	const rebuildProcs = () => {
		procCache = [];
		const procNames = new Set();
		const addToCache = (deck) => {
			for (const card of deck) {
				if (card) {
					const procs = card.getProcs();
					for (const proc of procs) {
						if (!procNames.has(proc[0])) {
							procCache.push(proc);
							procNames.add(proc[0]);
						}
					}
				}
			}
		};
		addToCache(hiddenDeck);
		addToCache(normalDeck);
	};

	const rebuildHandlers = () => {
		handlerCache = [];
		const addToCache = (deck) => {
			for (const card of deck) {
				if (card) {
					const handlers = card.getHandlers();
					for (const handler of handlers) {
						handlerCache.push(handler);
					}
				}
			}
		};
		addToCache(hiddenDeck);
		addToCache(normalDeck);
	};

	const rebuild = () => {
		rebuildStats();
		rebuildProcs();
		rebuildHandlers();
	};

	const applyStats = (statsManager) => {

		// TODOOOOO

		for (const [name, [opMin], [opMax], [opValue]] of statCache) {
			if (opMin && opMax && opValue) {
				statsManager.set(name, _applyOperation(opMin, opMax, opValue));
			} else {
				statsManager.remove(name);
			}
		}
	};

	const handle = (name, event) => {
		for (const [eventName, handler] of handlerCache) {
			if (eventName === name) {
				handler(event);
			}
		}
	};

	const proc = (name) => {
		const procedure = procCache.find(proc => proc[0] === name);
		if (procedure) {
			const [procName, procFunction, parameters] = procedure;
			return {
				run: (...extraArgs) => procFunction(parameters, ...extraArgs),
				set: (paramName, value) => {
					const param = parameters.find(param => param[0] === paramName);
					if (param) param[2] = value;
				},
				get: (paramName) => {
					const param = parameters.find(param => param[0] === paramName);
					return param ? param[2] : undefined;
				}
			};
		}
		return null;
	};

	const raw = () => ({
		normalDeck,
		hiddenDeck,
		ejectedDeck,
		statCache,
		procCache,
		handlerCache,
	});

	return {
		add,
		remove,
		getSize,
		setSize,
		addEjected,
		getEjected,
		clearEjected,
		getHidden,
		getDeck,
		rebuildStats,
		rebuildProcs,
		rebuildHandlers,
		rebuild,
		applyStats,
		handle,
		proc,
		raw,
	};
};

export { card, cardsManager };