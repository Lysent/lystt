class Entity {

	// modifiable stats
	buildCost = 10
	moveCost = 1
	attackCost = 1
	healCost = Infinity // default: can't heal self

	rangeUpgradeCost = 1 // like in the prototype, but is kinda broken
	// this would replace the above for scaling costs
	// get rangeUpgradeCost() {
	//     return (this.range * 8 - 8)
	// }

	maxHealth = 3
	maxAP = Infinity // default: can store as much AP as needed
	// could perhaps be used for infinite ap exploit at the overflow but it would take until the heat death of the universe.
	maxRange = Infinity

	attackDamage = 1
	range = 1 // default: range starts at 1

	// if you know what you're doing,
	health = this.maxHealth // start with max health

	constructor(owner){
		this.team = owner;
	}
};