const lystt = {
	types: {
		stat: { // stat is the standard value field.
			type: ["number"],
			valid(o) {
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
	},
	entity: {
		default: {
			base: {
				name: "base",
				displayName: "Base entity",
				stats: {
					hp: {
						displayName: "Health",
						type: "number",
						value: 0,
						max: Infinity
					},
					ap: {
						displayName: "Action Points",
						type: "number",
						value: 0,
						max: Infinity
					}
				},
			},
			move: () => { }
		},
		offense: {},
		defense: {},
		logistics: {}
	},
	events: [
		"move",
		"stat",
		""
	],
	packets: {

	}
}

export { lystt as content };