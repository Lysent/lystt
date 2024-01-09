class EventsClient {
	players = {};

	setPlayers(players) {
		this.players = players;
	};

	receive(data) {
		console.log(data)
		const type = data[0];
		const value = data[1];

		switch (type) {
			case "players":
				this.setPlayers(value);
				break;

			default:
				break;
		}
	}
};

export { EventsClient };