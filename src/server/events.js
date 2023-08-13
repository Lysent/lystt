class Events {
	constructor(gamestate){
		this.gs = gamestate;
	};

	queue = [];

	tick(){
		for (const ev of this.queue) {
			this.handler(ev);
		}
	};

	handler(ev){

	};

	//
	// movement
	//
	moveEntity(entity, dest){
		if(this.gs.tileOccupied(dest)) return 1;

		this.gs.tpEntity(entity, dest);
		return 0;
	};
	movePos(ori, dest){
		return this.moveEntity(this.gs.map[ori], dest);
	}
};

export { Events };