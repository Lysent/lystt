const objectcontainer = () => {
	const storage = {
		foo: 123,
		bar: 456
	};
	const api = {
		getFoo() { return storage.foo },
		setFoo(value) { return storage.foo = value },
		getBar() { return storage.bar },
		setBar(value) { return storage.bar = value }
	};
	return api;
}

const variablecontainer = () => {
	let foo = 123;
	let bar = 456;
	const api = {
		getFoo() { return foo },
		setFoo(value) { return foo = value },
		getBar() { return bar },
		setBar(value) { return bar = value }
	};
	return api;
}