// stat is the standard value field.
const stat = {
	type: ["number"],
	legalise(o) {
		if (!"displayName" in o) o.displayName = "";
		if (!"type" in o || !this.type.includes(o.type)) o.type = "number";

		switch (o.type) {
			case "number":
				if (!"value" in o || typeof o.value !== "number") o.value = 0;
				if (!"max" in o) o.max = Infinity;
				if (!"min" in o) o.min = 0;

				if (o.value > max)
					break;

			default:
				break;
		}
	}
}

export { stat };