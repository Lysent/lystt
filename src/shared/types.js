const validate = schema => {
	const valid = (object, schemaLayer = schema) => {
		// Check if objects are same shape
		if (Object.keys(schemaLayer).length !== Object.keys(object).length) return false;

		// Iterate over the keys in the object to validate and check if they are valid according to the schema layer
		for (const key of Object.keys(object)) switch (typeof schemaLayer[key]) {
			case 'undefined':
				return false;

			case 'object':
				if (!valid(object[key], schemaLayer[key])) return false;
				break;

			case 'string':
				if (typeof object[key] !== schemaLayer[key]) return false;
				break;

			default:
				if (!schemaLayer[key](object[key])) return false;
				break;
		};

		// If no errors were found, the object is valid
		return true;
	};

	return valid;
};



// stat is the standard value field.
const stat = {
	type: ["number"],
	valid(o){
		const type = ("type" in o || this.type.includes(o.type)) ? o.type : "number";
		switch (type) {
			case "number":

				break;

			default:
				break;
		}
	},
	legalise(o) {
		if (!"displayName" in o) o.displayName = "";
		if (!"type" in o || !this.type.includes(o.type)) o.type = "number";

		switch (o.type) {
			case "number":
				if (!"value" in o || typeof o.value !== "number") o.value = 0;
				if (!"max" in o) o.max = Infinity;
				if (!"min" in o) o.min = 0;

				if (o.value > max) o.value = max;
				if (o.value < min) o.value = min;
				break;

			default:
				break;
		}

		return o;
	}
}

const strpath = {
	reg: /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)*$/,
	valid(path) { return !!this.reg.test(path) },
	legalise(path) {
		if(typeof path !== 'string') return "";
		return this.valid(path) ? path : "";
	},
	resolve(object, path) {

	}
}

export { stat };