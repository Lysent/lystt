const
	buf2hex = buffer =>
		[...new Uint8Array(buffer)]
			.map(x => x.toString(16).padStart(2, '0'))
			.join(''),
	hex2buf = hexstr =>
		new Uint8Array(
			hexstr.match(/[0-9a-f]{2}/gi)
				.map(h => parseInt(h, 16))
		);

const hashstr = async str => await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));

class Players {
	constructor(fromobj) {
		this.players = fromobj || {};
	}

	async join(uname, pass) {
		const uobj = this.players[uname];
		const passhash = buf2hex(await hashstr(pass));

		// login
		if (uobj?.pass === passhash) {
			uobj.online = true;
			return `Logged in as ${uname}`;
		}

		// register
		if (uobj) throw "Username taken on this instance";

		this.players[uname] = {
			online: true,
			pass: passhash,
			id: buf2hex(await hashstr(`${uname}:${uobj.pass}.${Math.floor(Math.random() * 10 ** 5)}`))
		};
		return;
	}

	leave(uname) {
		const uobj = this.players[uname];
		if (!uobj) throw "User with that name does not exist";
		uobj.online = false;
	}

	delete(uname) {
		if (!this.players[uname]) throw "User with that name does not exist";
		delete this.players[uname];
	}

	// get user's id by name
	id(uname) {
		const uobj = this.players[uname];
		if (!uobj) throw "User with that name does not exist";

		return uobj.id;
	}

	// uname from id
	fromid(id){
		const idmatches = Object.entries(this.players).filter(([uname, uobj]) => id === uobj.id)[0];
		if(idmatches.length === 0) throw "Did no get any matches for id";
		if(idmatches.length > 1) throw "ID is not unique, which is a critical issue!";
		return idmatches[0];
	}

	playerobj(uname) {
		const uobj = this.players[uname];
		if (!uobj) throw "User with that name does not exist";

		return uobj;
	}
}

export { Players };