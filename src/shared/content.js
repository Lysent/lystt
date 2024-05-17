const lystt = {
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