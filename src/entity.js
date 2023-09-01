class Entity {
	// AP
	AP = 0
	APMax = -1 // no cap

	moveCost = 1

	// health
	health = 3 // start with max health
	healthMax = 3
	healthSelf = 0 // no healing
	healthSelfCost = [0, "AP"]

	// attack
	healthAct = -1
	healthActCost = [1, "AP"]

	// range
	range = 1
	rangeMax = -1
	rangeSelf = 1
	rangeSelfCost = [1, "AP"] // like in the prototype, but is kinda broken
	// this would replace the above for scaling costs
	// get rangeSelfCost() {
	//     return (this.range * 8 - 8)
	// }
	rangeAct = 0 // don't upgrade other's range, duh
	rangeActCost = [0, "AP"]

	// if you know what you're doing,
	constructor(owner) {
		this.team = owner;
	}
};