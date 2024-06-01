// Helper functions for rotation
const _rectifyRotation = (rotation) => {
	return ((rotation % 400) + 400) % 400;
};

const _snapRotation = (rotation) => {
	const rectified = _rectifyRotation(rotation);
	const nearest = Math.round(rectified / 100) * 100;
	return nearest % 400;
};

// Helper function to validate position and velocity
const _validateVector = (vector) => {
	if (Array.isArray(vector) && vector.length === 2) {
		const [x, y] = vector.map(Number);
		if (!isNaN(x) && x > 0 && !isNaN(y) && y > 0) {
			return [x, y];
		}
	}
	return [0, 0];
};


// Free entity physical properties manager factory function
const entityPhysicalPropsManager = (initialProperties = {}) => {
	let position = _validateVector(initialProperties.position);
	let velocity = _validateVector(initialProperties.velocity);
	let rotation = _rectifyRotation(initialProperties.rotation || 0);
	let size = Number(initialProperties.size) || 0;

	const getPosition = () => position;
	const setPosition = (newPosition) => { position = _validateVector(newPosition); };
	const getPositionObject = () => ({ x: position[0], y: position[1] });

	const getVelocity = () => velocity;
	const setVelocity = (newVelocity) => { velocity = _validateVector(newVelocity); };
	const getVelocityObject = () => ({ vx: velocity[0], vy: velocity[1] });

	const getRotation = () => rotation;
	const setRotation = (newRotation) => { rotation = _rectifyRotation(newRotation); };

	const getSize = () => size;
	const setSize = (newSize) => { size = Number(newSize) || 0; };

	const serialize = () => JSON.stringify({ position, velocity, rotation, size });
	const deserialize = (jsonString) => {
		const { position, velocity, rotation, size } = JSON.parse(jsonString);
		setPosition(position);
		setVelocity(velocity);
		setRotation(rotation);
		setSize(size);
	};

	return {
		getPosition,
		setPosition,
		getPositionObject,
		getVelocity,
		setVelocity,
		getVelocityObject,
		getRotation,
		setRotation,
		getSize,
		setSize,
		serialize,
		deserialize
	};
};

// Tile entity physical properties manager factory function
const tileEntityPhysicalPropsManager = (initialProperties = {}) => {
	let position = _validateVector(initialProperties.position);
	let velocity = _validateVector(initialProperties.velocity);
	let rotation = _snapRotation(initialProperties.rotation || 0);
	let size = Number(initialProperties.size) || 0;

	const getPosition = () => position;
	const setPosition = (newPosition) => { position = _validateVector(newPosition); };
	const getPositionObject = () => ({ x: position[0], y: position[1] });

	const getVelocity = () => velocity;
	const setVelocity = (newVelocity) => { velocity = _validateVector(newVelocity); };
	const getVelocityObject = () => ({ vx: velocity[0], vy: velocity[1] });

	const getRotation = () => rotation;
	const setRotation = (newRotation) => { rotation = _snapRotation(newRotation); };

	const getSize = () => size;
	const setSize = (newSize) => { size = Number(newSize) || 0; };

	const serialize = () => JSON.stringify({ position, velocity, rotation, size });
	const deserialize = (jsonString) => {
		const { position, velocity, rotation, size } = JSON.parse(jsonString);
		setPosition(position);
		setVelocity(velocity);
		setRotation(rotation);
		setSize(size);
	};

	return {
		getPosition,
		setPosition,
		getPositionObject,
		getVelocity,
		setVelocity,
		getVelocityObject,
		getRotation,
		setRotation,
		getSize,
		setSize,
		serialize,
		deserialize
	};
};

export {
	entityPhysicalPropsManager,
	tileEntityPhysicalPropsManager
};