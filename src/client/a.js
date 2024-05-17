/*
import { pack, unpack } from 'msgpackr'
import * as WebSocket from 'ws'
import { fetchUrl as fetch } from 'fetch'
import * as fs from 'fs'
import * as http from 'http'
import * as url from 'url'
const { WebSocketServer } = WebSocket
*/


const { pack, unpack } = require("msgpackr");
const WebSocket = require("ws"), { WebSocketServer } = WebSocket;
const fetch = require('fetch').fetchUrl
const fs = require("fs");
const http = require('http');
const url = require('url');


(function () {
	const options = {
		type: '4teams'
	}

	options.requireKey = ({
		'ffa': false,
		'2teams': false,
		'4teams': false
	})[options.type]

	const link = {
		hub: 'wss://hub.scenexe2.repl.co/ws',
		socket: false,
		open: false,
		connect: function () {
			if (link.socket) {
				link.socket.close()
			}
			link.socket = new WebSocket(link.hub)
			link.socket.addEventListener('open', function () {
				console.log('link ready')
				link.open = true
				link.send([0, options.type || 'ffa'])
			})
			link.socket.addEventListener('message', function (data) {
				try {
					data = unpack(data)
				} catch (e) {
					console.log(e)
					return
				}
				console.log('link', data)
			})
			link.socket.addEventListener('close', function () {
				link.open = false
				console.log('link closed')
				setTimeout(link.connect, 5000)
			})
		},
		send: function (data) {
			if (link.socket && link.open) {
				link.socket.send(pack(data))
			}
		}
	}

	link.connect()

	process.on('uncaughtException', function (e) {
		console.log(e)
	})

	const httpServer = http.createServer((req, res) => {
		const pathname = url.parse(req.url).pathname;
		switch (pathname) {
			case '/':
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('OK');
				break;
			case '/playerCount':
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('0');
				break;
			case '/ws':
				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				res.end('<div style="font-family:monospace">Congradulations! You have found the scenexe2 token video.</div><br><iframe width="674" height="379" src="https://www.youtube.com/embed/4-kg9y5mq1M?list=PLQcpjwveNrhLk4gB6c87VACB9mBS0ibas&autoplay=1" title="Can this video get 100 dislikes ?" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
				break;
			default:
				res.writeHead(404, { 'Content-Type': 'text/plain' });
				res.end('Not Found');
				break;
		}
	});

	httpServer.listen(3000);

	const server = new WebSocketServer({ noServer: true });

	httpServer.on('upgrade', (request, socket, head) => {
		const parsed = url.parse(request.url)
		const params = Object.fromEntries(new url.URLSearchParams(parsed.query))
		const pathname = parsed.pathname;
		if (pathname === '/ws') {
			let allow = false
			if (params.key) {
				allow = true
			} else {
				if (options.requireKey) {
					allow = false
				} else {
					allow = true
				}
			}
			server.handleUpgrade(request, socket, head, (ws) => {
				server.emit('connection', ws);
			});
		} else {
			socket.destroy();
		}
	});

	const tankData = process.tankData;

	const Detector = (function () {
		const Detector = {
			sliceWidth: 100,
			canCollide: function (objectA, objectB) {
				return ({
					tank: {
						tank: true,
						detectEnemies: true,
						detectFriends: true,
						bullet: true,
						polygon: true,
						wall: true,
						gate: true,
						wormhole: true,
					},
					detectEnemies: {
						tank: true,
						polygon: true,
					},
					bullet: {
						tank: true,
						bullet: true,
						polygon: true,
						wall: true,
						gate: true,
						wormhole: true,
					},
					polygon: {
						tank: true,
						bullet: true,
						detectEnemies: true,
						polygon: true,
						wall: true,
						gate: true,
						wormhole: true,
					},
					detectFriends: {
						tank: true,
					},
					wall: {
						tank: true,
						bullet: true,
						polygon: true,
					},
					gate: {
						tank: true,
						bullet: true,
						polygon: true,
					},
					wormhole: {
						tank: true,
						bullet: true,
						polygon: true,
					}
				})[objectA.type][objectB.type]
			},
			checkCircle: function (objectA, objectB) {
				const data = {
					dx: objectA.x - objectB.x,
					dy: objectA.y - objectB.y,
					distance: 0,
					size: objectA.size + objectB.size,
					colliding: false
				}
				data.distance = data.dx * data.dx + data.dy * data.dy
				if (data.distance < data.size * data.size) {
					data.colliding = true
				}
				if (data.dx === 0 && data.dy === 0) {
					data.dy = 1
				}
				return data
			},
			checkRect: function (rect, circle) {
				if (circle.rectangular) {
					[rect, circle] = [circle, rect]
				}
				let data = {
					dx: circle.x - rect.x,
					dy: circle.y - rect.y,
					colliding: true,
					rect: rect,
					circle: circle,
				}
				if (rect.noClip) {
					data.size = circle.size
				} else {
					data.size = circle.size < 100 ? circle.size / 2 : circle.size - 50
				}
				data.inX = (circle.x + data.size > rect.left && circle.x - data.size < rect.right)
				data.inY = (circle.y + data.size > rect.bottom && circle.y - data.size < rect.top)
				let r = circle.size - data.size
				data.cinX = (circle.x > rect.left + r && circle.x < rect.right - r)
				data.cinY = (circle.y > rect.bottom + r && circle.y < rect.top - r)
				if ((data.inX && data.cinY) + (data.inY && data.cinX)) {
					data.hitSide = true
					return data
				} else {
					data.cx = circle.x < rect.x ? rect.left + r : rect.right - r
					data.cy = circle.y < rect.y ? rect.bottom + r : rect.top - r
					data.dcx = circle.x - data.cx
					data.dcy = circle.y - data.cy
					data.distance = data.dcx * data.dcx + data.dcy * data.dcy
					if (data.distance >= circle.size * circle.size) {
						data.colliding = false
					}
					return data
				}
			},
			detectCollisions: function (objects, callback) {
				const collisions = {}
				const slices = {}
				const inverse = 1 / Detector.sliceWidth
				let objectsLength = objects.length
				for (let i = 0; i < objectsLength; i++) {
					const object = objects[i]
					let w = object.w || object.size
					let h = object.h || object.size
					object.left = object.x - w
					object.right = object.x + w
					object.bottom = object.y - h
					object.top = object.y + h
					object.w = w
					object.h = h
					object.internalId = i
					const min = 1 + Math.floor(object.left * inverse)
					const max = 1 + Math.floor(object.right * inverse)
					for (let i = min; i <= max; i++) {
						if (i in slices) {
							slices[i].push(object)
						} else {
							slices[i] = [object]
						}
					}
				}
				const sort = ((a, b) => a.bottom - b.bottom)
				const checkId = function (idA, idB) {
					let obj = collisions[idA]
					if (!obj) {
						obj = collisions[idA] = {}
					}
					if (idB in obj) {
						return false
					} else {
						obj[idB] = true
						return true
					}
				}
				let count = 0
				for (let sliceId in slices) {
					let slice = slices[sliceId]
					slice.sort(sort)
					for (let i = 0, l = slice.length - 1; i < l; i++) {
						let object = slice[i]
						for (let u = i + 1; u <= l; u++) {
							let test = slice[u]
							if (test.bottom > object.top) {
								break
							} else if (object.right >= test.left && object.left <= test.right) {
								let objectA = object.object
								let objectB = test.object
								if (Detector.canCollide(object, test) && checkId(object.internalId, test.internalId)) {
									if (object.rectangular || test.rectangular) {
										if (object.rectangular ^ test.rectangular) {
											const data = Detector.checkRect(object, test)
											if (data.colliding) {
												callback(data.circle, data.rect, data)
											}
										}
									} else {
										const data = Detector.checkCircle(object, test)
										if (data.colliding) {
											callback(object, test, data)
										}
									}
								}
							}
							count++
						}
					}
				}
				process.slices = slices
				process.count = count
				return count
			}
		}
		return Detector
	})()

	const game = {
		codes: {
			recieve: {
				0: 'ready',
				'ready': 0,
				1: 'gameUpdate',
				'gameUpdate': 1,
				2: 'gameStart',
				'gameStart': 2,
				3: 'announcement',
				'announcement': 3,
				4: 'death',
				'death': 4,
				5: 'setStats',
				'setStats': 5,
			},
			send: {
				'joinGame': 0,
				0: 'joinGame',
				'chat': 1,
				1: 'chat',
				'typing': 2,
				2: 'typing',
				'passive': 3,
				3: 'passive',
				'firing': 4,
				4: 'firing',
				'controlPosition': 5,
				5: 'controlPosition',
				'upgradeStat': 6,
				6: 'upgradeStat',
				'upgradeWeapon': 7,
				7: 'upgradeWeapon',
				'upgradeBody': 8,
				8: 'upgradeBody',
				'direction': 10,
				10: 'direction',
				'd': 11,
				11: 'd',
			}
		}
	}

	const dimension = {
		sendTankTo: function (options) {
			let tank = {
				dim: options.dim,
				x: options.x || 0,
				y: options.y || 0,
				d: options.tank.d,
				upgrades: options.tank.upgrades,
				upgradeCount: options.tank.upgradeCount,
				radiant: options.tank.radiant,
				name: options.tank.name,
				team: options.tank.team,
				score: options.tank.score,
				weapon: options.tank.weapon,
				body: options.tank.body,
				passive: options.tank.passive,
				typing: options.tank.typing
			}
			options.dim.newTanks.push([tank, options.tank.ws])
			options.tank.remove()
		},
		getBulletSpeed: function (data, tank) {
			let speed = 4.5 * data.speed * (1 + tank.upgrades[1] / 30)
			if (data.type === 1 || data.type === 3) {
				speed *= 1.5
			} else if (data.type === 2 || data.type === 4) {
				speed *= 0.5
			}
			return speed
		},
		aimAtTarget: function (turret, target, speed) {
			let dx = target.x - turret.x
			let dy = target.y - turret.y
			let a = target.xv * target.xv + target.yv * target.yv - speed * speed
			let b = 2 * (dx * target.xv + dy * target.yv)
			let c = dx * dx + dy * dy
			let d = b * b - 4 * a * c
			if (d > 0) {
				let e = Math.sqrt(d)
				let f = [(-b + e) / (2 * a), (-b - e) / (2 * a)]
				if (f[0] > 0 && f[1] > 0) {
					if (f[0] < f[1]) {
						f = f[0]
					} else {
						f = f[1]
					}
				} else if (f[0] > 0) {
					f = f[0]
				} else if (f[1] > 0) {
					f = f[1]
				} else {
					return [dx, dy]
				}
				let tx = dx + f * target.xv
				let ty = dy + f * target.yv
				return [tx, ty]
			} else {
				return [dx, dy]
			}
		},
		wallRestitution: 0.1,
		averageAngles: function (a, b, c) {
			let d = 2 * Math.PI;
			a = ((a % d) + d) % d;
			let e = (d + b - a) % d;
			if (e > Math.PI) {
				return (((a + (e - d) / (c + 1)) % d) + d) % d;
			} else {
				return (((a + e / (c + 1)) % d) + d) % d;
			}
		},
		confine: function (object, range) {
			if (object.x < -range) {
				object.x = -range
				object.xv = -object.xv * dimension.wallRestitution
			} else if (object.x > range) {
				object.x = range
				object.xv = -object.xv * dimension.wallRestitution
			} if (object.y < -range) {
				object.y = -range
				object.yv = -object.yv * dimension.wallRestitution
			} else if (object.y > range) {
				object.y = range
				object.yv = -object.yv * dimension.wallRestitution
			}
		},
		getRadiantMultiplier: function (radiant) {
			if (radiant <= 0) {
				return 1
			} else if (radiant <= 1) {
				return 25
			} else {
				return 25 * Math.pow(4, radiant - 1)
			}
		},
		dims: {},
		isSameTeam: function (a, b) {
			return (a && b) && ((a === b) || (a.team && a.team === b.team) || ((a.parent && (a.parent === b.parent || a.parent === b)) || (b.parent && b.parent === a)))
		},
		create: function (options) {
			if (!(options.name in dimension.dims)) {
				const dim = {
					mapSize: options.mapSize || 100,
					gridSize: options.gridSize || 30,
					background: options.background,
					grid: options.grid,
					name: options.name,
					tanks: [],
					type: options.type || 'ffa',
					ids: {
						tank: [],
						bullet: [],
						polygon: [],
						wormhole: [],
					},
					spawnPlayer: options.spawnPlayer || function () { return [0, 0] },
					newTanks: [],
					darkness: options.darkness > 0 ? Math.round(100 * options.darkness) : 0,
					resizedWormholes: {},
					rupturedWormholes: {},
					fadeTimeChanges: {},
					removedWormholes: {},
					addedWormholes: {},
					updatedTanks: {},
					updatedGates: {},
					bullets: [],
					polygons: [],
					bases: [],
					walls: options.walls || [],
					gates: options.gates || [],
					wormholes: {},
					chatMessages: {},
					leaderboard: [],
					leaderboardChanges: {},
					remove: function () {
						if (dimension.dims[dim.name] === dim) {
							delete dimension.dims[dim.name]
						}
					},
					add: function (key, object) {
						let array = dim[key]
						if (array.indexOf(object) < 0) {
							array.push(object)
						}
					},
					delete: function (key, object) {
						let array = dim[key]
						let index = array.indexOf(object)
						if (index >= 0) { array.splice(index, 1) }
					},
					broadcast: function (message) {
						for (let i = dim.tanks.length - 1; i >= 0; i--) {
							let tank = dim.tanks[i]
							if (tank.ws && tank.ws.sendPacket) {
								tank.ws.sendPacket('announcement', message)
							}
						}
					}
				}
				dimension.dims[dim.name] = dim
				return dim
			}
		},
		reset: function (dim) {
			for (let i = dim.tanks.length - 1; i >= 0; i--) {
				let tank = dim.tanks[i]
				tank._d = []
				tank.firedBarrels = {}
				if (tank.lastLevelSent !== tank.level) {
					tank.lastLevelSent = tank.level
				}
			}
			dim.updatedTanks = {}
			dim.chatMessages = {}
			dim.updatedGates = {}
			dim.resizedWormholes = {}
			dim.rupturedWormholes = {}
			dim.fadeTimeChanges = {}
			dim.removedWormholes = {}
			dim.addedWormholes = {}
		},
		bounceCircles: function (a, b, data, maxForce, minForce) {
			let distance = (Math.sqrt(data.distance) || 0)
			if (distance <= 1) { distance = 1 }
			let force = (data.size - distance + 1) * 0.01 * maxForce
			if (force > 0.5) { force = 0.5 }
			else if (force < minForce) { force = minForce }
			let x = (a.x - b.x) / distance * force
			let y = (a.y - b.y) / distance * force
			let fA = 1
			let fB = 1
			if (b.size > a.size) {
				fB = (fB = a.size / b.size) * fB
			} else {
				fA = (fA = b.size / a.size) * fA
			}
			if (!a.static) {
				a.xv += x * fA
				a.yv += y * fA
			} if (!b.static) {
				b.xv += -x * fB
				b.yv += -y * fB
			}
		},
		collideWall: function (data) {
			let rect = data.rect, obj = data.circle.object
			if (data.cinX || data.cinY) {
				if (data.cinX && data.cinY) {
					let d = Math.sqrt(data.dx * data.dx + data.dy * data.dy)
					if (d < 0.1) {
						d = 0.1
					}
					d = 10 / d
					obj.x += data.dx * d
					obj.y += data.dy * d
					d = d / 5
					obj.xv += data.dx * d
					obj.yv += data.dy * d
				} else {
					if (data.cinY && data.inX) {
						if (obj.x > rect.x) {
							obj.x = data.rect.right + data.size
						} else {
							obj.x = data.rect.left - data.size
						}
						obj.xv = -obj.xv * dimension.wallRestitution
					} if (data.cinX && data.inY) {
						if (obj.y > rect.y) {
							obj.y = data.rect.top + data.size
						} else {
							obj.y = data.rect.bottom - data.size
						}
						obj.yv = -obj.yv * dimension.wallRestitution
					}
				}
			} else {
				let distance = Math.sqrt(data.distance)
				let r = obj.size / distance
				obj.x = data.cx + (obj.x - data.cx) * r
				obj.y = data.cy + (obj.y - data.cy) * r
			}
		},
		bounceGate: function (b, c, e) {
			if ((b.d === 0) + (b.d === 2)) {
				if (c.xv > 0) {
					c.xv = -e
					c.x = b.left - c.size - 1
				} else {
					c.xv = e
					c.x = b.right + c.size + 1
				}
			} else {
				if (c.yv > 0) {
					c.yv = -e
					c.y = b.bottom - c.size - 1
				} else {
					c.yv = e
					c.y = b.top + c.size + 1
				}
			}
		},
		collideGate: function (data, c) {
			let b = data.rect, open = b.object[5]
			if (b.gateType === 2) {
				let nv = (b.d < 2 ? 15 : -15)
				if (b.d === 0 || b.d === 2) {
					c.xv = nv
				} else {
					c.yv = nv
				}
			} else if (b.gateType === 1) {
				if (!open && !(c.parent && c.parent.radiant > 0)) {
					if (c.radiant > 0) {
						b.object[5] = true
						b.object[6] = 15
					} else if (b.d === 0 || b.d === 2) {
						if (c.xv > 0) {
							c.xv = -15
							c.x = b.left - c.size - 1
						} else {
							c.xv = 15
							c.x = b.right + c.size + 1
						}
					} else {
						if (c.yv > 0) {
							c.yv = -15
							c.y = b.bottom - c.size - 1
						} else {
							c.yv = 15
							c.y = b.top + c.size + 1
						}
					}
				}
			} else if (b.gateType === 0) {
				if (c.level >= 60) {
					//
				} else {
					dimension.bounceGate(b, c, 15)
				}
			} else if (b.gateType === 3) {
				if (!open) {
					if ([
						c.xv > 0,
						c.yv > 0,
						c.xv < 0,
						c.yv < 0
					][b.d]) {
						b.object[5] = true
						b.object[6] = 15
						if (b.d === 0 || b.d === 2) {
							c.xv = (b.d === 2 ? -25 : 25)
						} else {
							c.yv = (b.d === 3 ? -25 : 25)
						}
					} else {
						if (b.d === 0 || b.d === 2) {
							if (b.d === 2) {
								c.xv = -15
								c.x = b.left - c.size - 1
							} else {
								c.xv = 15
								c.x = b.right + c.size + 1
							}
						} else {
							if (b.d === 3) {
								c.yv = -15
								c.y = b.bottom - c.size - 1
							} else {
								c.yv = 15
								c.y = b.top + c.size + 1
							}
						}
					}
				}
			}
		},
		polygonDamage: 3,
		collide: function (a, b, data) {
			let order = {
				tank: 0,
				detectEnemies: 1,
				bullet: 2,
				polygon: 3,
				detectFriends: 4,
				wall: 5,
				gate: 6,
				wormhole: 7,
			}
			let c = a.object, d = b.object
			if (order[a.type] > order[b.type]) {
				[a, b] = [b, a];
				[c, d] = [d, c];
			}
			if (a.type === 'tank') {
				if (b.type === 'tank') {
					dimension.bounceCircles(c, d, data, 1, 0.2)
					if (!dimension.isSameTeam(c, d) && !(c.invincible || d.invincible)) {
						if (!(c.inBase || c.prevInBase || c.static)) {
							c.damage(10 * d.bodyDamage * d.levelMultiplier * d.bodyDamageMultiplier, d, 'tanks')
						} if (!(d.inBase || d.prevInBase || d.static)) {
							d.damage(10 * c.bodyDamage * c.levelMultiplier * c.bodyDamageMultiplier, c, 'tanks')
						}
					}
				} else if (b.type === 'detectEnemies') {
					if (!dimension.isSameTeam(b.parent, c) && !c.invinvible) {
						b.objects.push(c)
						let distance = Math.sqrt(data.distance) - data.size
						if (distance < b.closest || b.closest === false) {
							b.closest = distance
							b.closestObject = c
						}
					}
				} else if (b.type === 'bullet') {
					if (!dimension.isSameTeam(c, d.parent) && !(c.invincible || c.inBase || c.prevInBase || c.static)) {
						c.damage(3 * d.damageMultiplier * d.barrel.data.damage * d.parent.levelMultiplier, d.parent, 'tanks')
						d.health -= 10 * c.bodyDamage * c.levelMultiplier * c.bodyDamageMultiplier
						let typeD = [0, 1, 2, 1, 2, 0][d.type]
						if (typeD === 0) {
							dimension.bounceCircles(c, d, data, 0.02, 0)
						} else if (typeD === 1) {
							dimension.bounceCircles(c, d, data, 0.5, 0)
						} else {
							dimension.bounceCircles(c, d, data, 0.02, 0)
						}
					}
				} else if (b.type === 'polygon') {
					dimension.bounceCircles(c, d, data, 1, 0.2)
					if (!c.invincible) {
						if (!(c.inBase || c.prevInBase || c.static)) {
							c.damage(dimension.polygonDamage, d, 'polygons')
						}
						d.damage(10 * c.bodyDamage * c.levelMultiplier * c.bodyDamageMultiplier, c, 'tanks')
					}
				} else if (b.type === 'detectFriends') {
					if (dimension.isSameTeam(b.parent, c)) {
						b.objects.push(c)
						let distance = Math.sqrt(data.distance) - data.size
						if (distance < b.closest || b.closest === false) {
							b.closest = distance
							b.closestObject = c
						}
					}
				} else if (b.type === 'wall') {
					if (dimension.isSameTeam(c, d)) {
						c.inBase = true
					} else {
						dimension.collideWall(data, c)
					}
				} else if (b.type === 'gate') {
					dimension.collideGate(data, c)
				} else if (b.type === 'wormhole') {
					if (d.type === 0) {
						if ((c.level >= 60 || d.ruptured) && !(c.invincible || c.inBase || c.prevInBase || c.static)) {
							d._objects[c.id] = c
							let xv = d.x - c.x
							let yv = d.y - c.y
							let _d = xv * xv + yv * yv
							let r = 0.01 * (_d > 1 ? 1 / Math.sqrt(_d) : 1)
							c.xv += xv * r
							c.yv += yv * r
						} else {
							dimension.bounceCircles(c, d, data, 1, 0.5)
						}
					} else if (d.type === 1) {
						if ((c.radiant > 0 || d.ruptured) && !(c.invincible || c.inBase || c.prevInBase || c.static)) {
							d._objects[c.id] = c
							let xv = d.x - c.x
							let yv = d.y - c.y
							let _d = xv * xv + yv * yv
							let r = 0.01 * (_d > 1 ? 1 / Math.sqrt(_d) : 1)
							c.xv += xv * r
							c.yv += yv * r
						} else {
							dimension.bounceCircles(c, d, data, 1, 0.5)
						}
					} else {
						d._objects[c.id] = c
					}
				}
			} else if (a.type === 'detectEnemies') {
				if (b.type === 'polygon') {
					a.objects.push(d)
					let distance = Math.sqrt(data.distance) - data.size
					if (distance < a.closest || a.closest === false) {
						a.closest = distance
						a.closestObject = d
					}
				}
			} else if (a.type === 'bullet') {
				if (b.type === 'bullet') {
					if (dimension.isSameTeam(c.parent, d.parent)) {
						let typeC = [0, 1, 2, 1, 2, 0][c.type]
						let typeD = [0, 1, 2, 1, 2, 0][d.type]
						if (typeC === typeD) {
							if (typeC === 0) {
								dimension.bounceCircles(c, d, data, 0.04, 0.04)
							} else if (typeC === 1) {
								dimension.bounceCircles(c, d, data, 0.5, 0.1)
							} else {
								dimension.bounceCircles(c, d, data, 1, 0)
							}
						}
					} else {
						dimension.bounceCircles(c, d, data, 0.5, 0.1)
						c.health -= 3 * d.barrel.data.damage * d.parent.levelMultiplier
						d.health -= 3 * c.barrel.data.damage * c.parent.levelMultiplier
					}
				} else if (b.type === 'polygon') {
					let typeC = [0, 1, 2, 1, 2, 0][c.type]
					if (typeC === 0) {
						dimension.bounceCircles(c, d, data, 0.02, 0)
					} else if (typeC === 1) {
						dimension.bounceCircles(c, d, data, 0.1, 0)
					} else {
						dimension.bounceCircles(c, d, data, 0.2, 0.05)
					}
					c.health -= dimension.polygonDamage
					d.damage(3 * c.damageMultiplier * c.barrel.data.damage * c.parent.levelMultiplier, c.parent, 'tanks')
				} else if (b.type === 'wall') {
					if (!dimension.isSameTeam(c.parent, d)) {
						dimension.collideWall(data, c)
					}
				} else if (b.type === 'gate') {
					dimension.collideGate(data, c)
				} else if (b.type === 'wormhole') {
					if (d.type === 2) {
						dimension.bounceCircles(c, d, data, 1, 0.5)
					}
				}
			} else if (a.type === 'polygon') {
				if (b.type === 'polygon') {
					dimension.bounceCircles(c, d, data, 1, 0.2)
				} else if (b.type === 'wall') {
					dimension.collideWall(data, c)
				} else if (b.type === 'gate') {
					dimension.collideGate(data, c)
				} else if (b.type === 'wormhole') {
					dimension.bounceCircles(c, d, data, 1, 0.5)
				}
			} else if (a.type === 'detectFriends') {
				//
			}
		},
		getRadiantName: function (radiant) {
			if (radiant < 1) {
				return ''
			} else if (radiant < 5) {
				return ['Radiant', 'Gleaming', 'Luminous', 'Lustrous'][radiant - 1]
			} else {
				return 'Highly Radiant'
			}
		},
		getPolygonName: function (sides) {
			if (sides < 0) {
				return [
					'Tetrahedron',
					'Cube',
					'Octahedron',
					'Dodecahedron',
					'Icosahedron'
				][-sides - 1]
			}
			if (sides < 3) {
				return "???"
			}
			if (sides < 21) {
				return [
					"Triangle",
					"Square",
					"Pentagon",
					"Hexagon",
					"Heptagon",
					"Octagon",
					"Nonagon",
					"Decagon",
					"Hendecagon",
					"Dodecagon",
					"Tridecagon",
					"Tetradecagon",
					"Pentadecagon",
					"Hexadecagon",
					"Heptadecagon",
					"Octadecagon",
					"Nonadecagon",
					"Icosagon",
				][sides - 3];
			} else {
				return `Circle (${sides})`
			}
		},
		getFullPolygonName: function (polygon) {
			let name = dimension.getPolygonName(polygon.sides)
			let prefix
			if (polygon.radiant < 1) {
				prefix = ('AEIOU'.indexOf(name[0]) < 0 ? 'a ' : 'an ')
			} else {
				prefix = `a ${dimension.getRadiantName(polygon.radiant)} `
			}
			return prefix + name
		},
		update: function (dim, options, now) {
			if (options.gameUpdate) {
				for (let i = dim.newTanks.length - 1; i >= 0; i--) {
					let tank = dim.newTanks[i]
					tank[1].data.tank = generator.tank(tank[0], tank[1])
					tank[1].data.waiting = false
					tank[1].sendPacket('gameStart', packer.gameStart({
						tank: tank[1].data.tank,
						dim: tank[0].dim,
						upgrades: tank[1].data.tank.upgrades
					}))
					tank[0].dim.broadcast(`${tank[1].data.tank.name} has spawned.`)
				}
				dim.newTanks = []
			}
			let objects = []
			for (let i = dim.gates.length - 1; i >= 0; i--) {
				let gate = dim.gates[i]
				if (gate[0] === 1 || gate[0] === 3) {
					if (gate[6] > 0) {
						gate[6] -= 0.01
						if (gate[6] <= 0) {
							gate[6] = 0
						}
					}
					gate[5] = (gate[6] !== 0)
				} else {
					gate[5] = false
					gate[6] = 0
				}
			}
			for (let i = dim.tanks.length - 1; i >= 0; i--) {
				let tank = dim.tanks[i]
				if (tank.ai) {
					tank.ai({
						now: now
					})
				}
				if (!tank.regen || tank.regen < 1) {
					tank.regen = 1
				}
				if (tank.regenTime < 1) {
					let totalTime = 16 - tank.upgrades[6] / 1.5
					tank.regenTime += 0.01 / totalTime * tank.regen
					if (tank.regenTime > 1) {
						tank.regenTime = 1
					}
				} else {
					if (tank.health < tank.maxHealth) {
						let totalTime = 18 - tank.upgrades[6] / 2
						tank.health += tank.maxHealth * 0.01 / totalTime * (1 + (tank.levelMultiplier - 1) / 2) * tank.regen
						if (tank.health > tank.maxHealth) {
							tank.health = tank.maxHealth
						}
					}
				}
				tank.regen = 1
				tank.bodyDamageMultiplier = (1 + tank.upgrades[7] / 15)
				let maxHealth = 800 * tank.levelMultiplier * tank.bodyDamageMultiplier
				if (maxHealth != tank.maxHealth) {
					tank.setMaxHealth(maxHealth)
				}
				tank.mousePosition[0] = tank.x + tank.controlPosition[0]
				tank.mousePosition[1] = tank.y + tank.controlPosition[1]
				if (options.updateFinalDamage) {
					tank.finalDamage.tanks = generator.updateFinalDamage(tank.finalDamage.tanks)
					tank.finalDamage.polygons = generator.updateFinalDamage(tank.finalDamage.polygons)
				}
				tank.x += tank.xv
				tank.y += tank.yv
				if (tank.invincibleTime) {
					if (tank.invincibleTime > now) {
						if (tank.firing || tank.input.movement[0] || tank.input.movement[1]) {
							if (tank.invincibleTime - now > 1000) {
								tank.invincibleTime = now + 1000
							}
						}
					} else {
						tank.invincibleTime = false
						tank.invincible = false
					}
				}
				dimension.confine(tank, dim.mapSize - (tank.size < 100 ? tank.size / 2 : 50))
				let speed = 0.09 / tank.size * 30 * (1 + tank.upgrades[4] * 0.1)
				tank.xv = tank.xv * 0.97 + tank.input.movement[0] * speed
				tank.yv = tank.yv * 0.97 + tank.input.movement[1] * speed
				if (options.recordDirection) {
					tank._d.push((Math.round(tank.d / Math.PI * 100) % 200 + 200) % 200)
				}
				let object = {
					x: tank.x,
					y: tank.y,
					size: tank.size,
					object: tank,
					type: 'tank'
				}
				objects.push(object)
				if (1) {
					let object = {
						x: tank.x,
						y: tank.y,
						size: tank.size * 15,
						object: tank,
						type: 'detectEnemies',
						parent: tank,
						objects: [],
						closest: false,
						closestObject: false,
						possible: [],
					}
					tank.detector = object
					objects.push(object)
				} else {
					tank.detector = false
				}
				let sin = Math.sin(tank.d)
				let cos = Math.cos(tank.d)
				for (let u = 0, k = tank._turrets.length; u < k; u++) {
					let turret = tank._turrets[u]
					let object = {
						x: tank.x + tank.size * (turret.x * cos + turret.y * sin),
						y: tank.y - tank.size * (turret.y * cos - turret.x * sin),
						size: tank.size * 10,
						object: turret,
						type: 'detectEnemies',
						parent: tank,
						objects: [],
						closest: false,
						closestObject: false,
						possible: [],
					}
					turret.detector = object
					turret.gameX = object.x
					turret.gameY = object.y
					objects.push(object)
				}
				for (let u = 0, k = tank.auras.length; u < k; u++) {
					let aura = tank.auras[u]
					if (aura.type === 0) {
						if (tank.passive === false) {
							let object = {
								x: tank.x + tank.size * (aura.x * cos + aura.y * sin),
								y: tank.y - tank.size * (aura.y * cos - aura.x * sin),
								size: tank.size * aura.auraSize,
								object: aura,
								type: 'detectEnemies',
								parent: tank,
								objects: [],
								closest: false,
								closestObject: false,
								possible: [],
							}
							aura.detector = object
							aura.gameX = object.x
							aura.gameY = object.y
							objects.push(object)
						}
					} else if (aura.type === 1) {
						if (tank.passive === false) {
							let object = {
								x: tank.x + tank.size * (aura.x * cos + aura.y * sin),
								y: tank.y - tank.size * (aura.y * cos - aura.x * sin),
								size: tank.size * aura.auraSize,
								object: aura,
								type: 'detectFriends',
								parent: tank,
								objects: [],
								closest: false,
								closestObject: false,
								possible: [],
							}
							aura.detector = object
							aura.gameX = object.x
							aura.gameY = object.y
							objects.push(object)
						}
					}
				}
			}
			for (let i = dim.bullets.length - 1; i >= 0; i--) {
				let bullet = dim.bullets[i]
				bullet.x += bullet.xv
				bullet.y += bullet.yv
				if (bullet.type === 1 || bullet.type === 2 || bullet.type === 3 || bullet.type === 4) {
					bullet.xv *= 0.96
					bullet.yv *= 0.96
				}
				dimension.confine(bullet, dim.mapSize - (bullet.size < 100 ? bullet.size / 2 : 50))
				let object = {
					x: bullet.x,
					y: bullet.y,
					size: bullet.size,
					object: bullet,
					type: 'bullet'
				}
				objects.push(object)
				bullet.timeExisted += 0.01
				if ((bullet.timeExisted > bullet.lifeTime && bullet.type !== 2 && bullet.type !== 4) || bullet.health <= 0) {
					bullet.remove()
				}
				if (bullet.turrets && bullet.turrets[0]) {
					let sin = Math.sin(bullet.d)
					let cos = Math.cos(bullet.d)
					for (let u = 0, k = bullet.turrets.length; u < k; u++) {
						let turret = bullet.turrets[u]
						let object = {
							x: bullet.x - bullet.size * (turret.x * cos + turret.y * sin),
							y: bullet.y + bullet.size * (turret.y * cos - turret.x * sin),
							size: bullet.size * 10,
							object: turret,
							type: 'detectEnemies',
							parent: bullet.parent,
							objects: [],
							closest: false,
							closestObject: false,
							possible: [],
						}
						turret.detector = object
						turret.gameX = object.x
						turret.gameY = object.y
						objects.push(object)
					}
				}
			}
			for (let i = dim.polygons.length - 1; i >= 0; i--) {
				let polygon = dim.polygons[i]
				polygon.finalDamage.tanks = generator.updateFinalDamage(polygon.finalDamage.tanks)
				if (polygon.regenTime < 1) {
					polygon.regenTime += 0.02 / (9 + Math.abs(polygon.sides) * 2)
					if (polygon.regenTime > 1) {
						polygon.regenTime = 1
					}
				} else {
					if (polygon.health < polygon.maxHealth) {
						let sides = polygon.sides >= 3 ? polygon.sides : 10 - polygon.sides
						polygon.health += polygon.maxHealth * 0.004 / (sides * sides * 0.1 - 0.15)
						if (polygon.health > polygon.maxHealth) {
							polygon.health = polygon.maxHealth
						}
					}
				}
				polygon.x += polygon.xv
				polygon.y += polygon.yv
				polygon.xv *= 0.97
				polygon.yv *= 0.97
				let speed = 0.015 * polygon.speed
				polygon.d += speed
				if (polygon.d >= 2 * Math.PI) {
					polygon.d -= 2 * Math.PI
				}
				speed *= 4
				polygon.xv += Math.sin(polygon.d) * speed
				polygon.yv -= Math.cos(polygon.d) * speed
				dimension.confine(polygon, dim.mapSize - (polygon.size < 100 ? polygon.size / 2 : 50))
				let object = {
					x: polygon.x,
					y: polygon.y,
					size: polygon.size,
					object: polygon,
					type: 'polygon'
				}
				objects.push(object)
			}
			for (let i = dim.walls.length - 1; i >= 0; i--) {
				let wall = dim.walls[i]
				let object = {
					x: wall[0],
					y: wall[1],
					w: wall[2],
					h: wall[3],
					type: 'wall',
					rectangular: true,
					object: {
						team: wall[4] || -1
					}
				}
				objects.push(object)
			}
			for (let i = dim.gates.length - 1; i >= 0; i--) {
				let gate = dim.gates[i], w, h
				if (gate[3] === 0 || gate[3] === 2) {
					w = 16
					h = gate[4]
				} else {
					w = gate[4]
					h = 16
				}
				let object = {
					gateType: gate[0],
					x: gate[1],
					y: gate[2],
					d: gate[3],
					noClip: true,
					object: gate,
					w: w,
					h: h,
					type: 'gate',
					rectangular: true
				}
				objects.push(object)
			}
			for (let i in dim.wormholes) {
				let wormhole = dim.wormholes[i]
				if (wormhole.type < 2) {
					wormhole.time -= 0.01
					if (wormhole.time < 0) {
						for (let i in wormhole._objects) {
							wormhole.action(wormhole._objects[i])
						}
						wormhole.remove()
						continue
					}
					if (wormhole.time < 10) {
						wormhole.fadeTime = (10 - wormhole.time) / 10
						dim.fadeTimeChanges[wormhole.id] = wormhole
					}
				} else {
					wormhole.time = 0
				}
				let object = {
					x: wormhole.x,
					y: wormhole.y,
					object: wormhole,
					objects: {},
					size: wormhole.size,
					type: 'wormhole',
				}
				wormhole._objects = {}
				objects.push(object)
			}
			for (let i = objects.length - 1; i >= 0; i--) {
				let object = objects[i]
				let target = object.object
				if (object.type === 'tank') {
					target.fov.tanks = dim.tanks
					target.fov.bullets = dim.bullets
					target.fov.polygons = dim.polygons
				}
			}
			process.objects = objects
			Detector.detectCollisions(objects, function (objectA, objectB, data) {
				dimension.collide(objectA, objectB, data)
			})
			for (let i in dim.wormholes) {
				let wormhole = dim.wormholes[i]
				let objects = wormhole._objects
				if (wormhole.type < 2) {
					let contents = 0
					for (let i in objects) {
						let s = objects[i].size
						contents += s * s * 2
						if (!(i in wormhole.objects)) {
							if (!wormhole.ruptured && Math.random() < 0.01 + wormhole.entries * 0.02) {
								wormhole.rupture()
							}
							wormhole.entries++
						}
					}
					wormhole.objects = wormhole._objects
					if (contents !== wormhole.contents) {
						wormhole.contents = contents
						wormhole.size = Math.sqrt(wormhole.defaultSize + contents)
						dim.resizedWormholes[wormhole.id] = wormhole
					}
				} else {
					for (let i in objects) {
						wormhole.action(objects[i])
					}
					wormhole.objects = wormhole._objects = []
				}
			}
			for (let i = dim.bullets.length - 1; i >= 0; i--) {
				let bullet = dim.bullets[i], tank = bullet.parent
				if (bullet.type === 2 || bullet.type === 4) {
					let speed = bullet.speed * 0.05
					let dir = 1
					let moveTo = [tank.x, tank.y]
					let attacking = false
					bullet.target = false
					if (tank.firing || tank.droneControl) {
						moveTo = tank.mousePosition
						attacking = true
						if (tank.droneControl) {
							speed = -speed
						}
					} else if (tank.passive == false) {
						if (tank.detector) {
							if (tank.detector.closestObject) {
								bullet.target = tank.detector.closestObject
								moveTo = [bullet.target.x, bullet.target.y]
								attacking = true
							} else {
								bullet.target = false
							}
						}
					}
					let d
					if (speed >= 0) {
						d = Math.atan2(bullet.x - moveTo[0], moveTo[1] - bullet.y)
						if (bullet.type === 4 && attacking) {
							let d = [bullet.x - moveTo[0], bullet.y - moveTo[1]]
							d = Math.sqrt(d[0] * d[0] + d[1] * d[1]) - bullet.size - (bullet.target ? bullet.target.size : 0)
							if (d < 100) {
								dir = -1
							}
						}
					} else {
						d = Math.atan2(moveTo[0] - bullet.x, bullet.y - moveTo[1])
						speed = -speed
					}
					if (bullet.timeExisted < 1.5) {
						let slide = 10 * (1 - bullet.timeExisted / 1.5)
						bullet.d = dimension.averageAngles(bullet.d, d, slide)
					} else {
						bullet.d = d
					}
					bullet.xv += -Math.sin(bullet.d) * speed * dir
					bullet.yv += Math.cos(bullet.d) * speed * dir
				} if (bullet.type === 3 || bullet.type === 4) {
					for (let i = 0, l = bullet._barrels.length; i < l; i++) {
						let barrel = bullet._barrels[i]
						barrel.current += 0.01
						let reload = barrel.data.reload * 0.5 * (1 - tank.upgrades[3] / 30)
						let active
						if (barrel.data.type === 2 || barrel.data.type === 4) {
							if (barrel.bullets.length >= barrel.data.drones) {
								active = false
							} else {
								active = true
							}
						} else {
							if (bullet.type === 4) {
								active = tank.firing || tank.droneControl || (!tank.passive && bullet.target)
							} else {
								active = barrel.turret ? barrel.turret.active : (!tank.passive)
							}
						}
						if (active) {
							if (barrel.current >= reload) {
								if (reload) {
									barrel.current -= reload
									if (barrel.current >= reload) {
										barrel.current = barrel.current % reload
									}
								} else {
									barrel.current = 0
								}
								let d = (barrel.turret ? barrel.turret.d : bullet.d) + barrel.data.d
								let x = bullet.x
								let y = bullet.y
								let offsetX = -barrel.data.x
								let offsetY = -barrel.data.y + 2 * barrel.data.height + barrel.data.width
								let sin = Math.sin(d)
								let cos = Math.cos(d)
								let speed = dimension.getBulletSpeed(barrel.data, bullet.parent)
								let tank = bullet.parent
								let health = 1, time = 1
								if (barrel.data.type === 0) {
									time = 1.5
									health = 100
								} else if (barrel.data.type === 1) {
									time = 12
									health = 1000
								} else if (barrel.data.type === 2) {
									time = 0
									health = 100
								} else if (barrel.data.type === 3) {
									time = 12
									health = 1000
								} else if (barrel.data.type === 4) {
									time = 0
									health = 100
								}
								let rsize = barrel.data.relativeSize * tank.size
								let size = barrel.data.relativeSize * barrel.data.width
								generator.bullet({
									dim: dim,
									parent: tank,
									barrelId: barrel.id,
									size: size,
									d: d,
									damage: 1 + tank.upgrades[2] / 15,
									health: barrel.data.penetration * health * (1 + tank.upgrades[0] / 15),
									lifeTime: barrel.data.time * time,
									x: x + rsize * (cos * offsetX - sin * offsetY),
									y: y + rsize * (cos * offsetY + sin * offsetX),
									xv: -sin * speed,
									yv: cos * speed,
									speed: speed,
									barrel: barrel
								})
								if (barrel.data.recoil) {
									let recoil = 0.8 * barrel.data.recoil * size * size
									bullet.xv += recoil * sin
									bullet.yv -= recoil * cos
								}
							}
						} else {
							let max = reload * (1 - barrel.data.delay)
							if (barrel.current > max) {
								barrel.current = max
							}
						}
					}
				}
				if (bullet.turrets && bullet.turrets[0]) {
					for (let u = 0, k = bullet.turrets.length; u < k; u++) {
						let turret = bullet.turrets[u]
						let item = turret.detector.closestObject
						if (item) {
							let d = dimension.aimAtTarget({
								x: turret.gameX,
								y: turret.gameY
							}, item, dimension.getBulletSpeed(turret.barrels[0].data, tank))
							turret.d = Math.atan2(-d[0], d[1])
							turret.active = tank.passive ? false : true
						} else {
							turret.active = false
							turret.d += 0.01
							if (turret.d >= 2 * Math.PI) {
								turret.d -= 2 * Math.PI
							}
						}
					}
				}
			}
			for (let i = dim.tanks.length - 1; i >= 0; i--) {
				let tank = dim.tanks[i]
				tank.prevInBase = tank.inBase
				tank.inBase = false
				let closestObject = false
				if (tank.detector && tank.detector.closestObject) {
					closestObject = tank.detector.closestObject
				}
				if (tank.team === 7) {
					tank.passive = false
					if (tank.upgradeCount < 120 && tank.upgradeCount < tank.level - 1) {
						tank.upgradeCount++
						let k = []
						for (let i = 0; i < 8; i++) {
							if (tank.upgrades[i] < 15) {
								k.push(i)
							}
						}
						tank.upgrades[k[Math.floor(Math.random() * k.length)]]++
					}
					if (closestObject) {
						tank.mousePosition = [closestObject.x, closestObject.y]
						let d = [closestObject.x - tank.x, closestObject.y - tank.y]
						tank.controlPosition = [d[0], d[1]]
						let r = Math.sqrt(d[0] * d[0] + d[1] * d[1]) || 1
						if (r < closestObject.size + tank.size + 100) {
							r = -r
						}
						tank.input.movement = [d[0] / r, d[1] / r]
						tank.firing = true
						tank.d = Math.atan2(-d[0], d[1])
					} else {
						tank.input.movement = [0, 0]
						tank.firing = true
						tank.d += 0.01
					}
					tank.droneControl = false
					if (tank.d >= 2 * Math.PI) {
						tank.d -= 2 * Math.PI
					}
				}
				for (let u = 0, k = tank._turrets.length; u < k; u++) {
					let turret = tank._turrets[u]
					if (turret.position = 'weaponTurret') {
						turret.active = tank.passive ? false : true
					} else if (turret.position = 'turret') {
						turret.active = tank.passive ? false : true
					}
					let item = turret.detector.closestObject
					if (item) {
						let d = dimension.aimAtTarget({
							x: turret.gameX,
							y: turret.gameY
						}, item, dimension.getBulletSpeed(turret.barrels[0].data, tank))
						turret.d = Math.atan2(-d[0], d[1])
					} else {
						if (tank.firing) {
							turret.d = tank.d
						} else {
							turret.d += 0.01
							if (turret.d >= 2 * Math.PI) {
								turret.d -= 2 * Math.PI
							}
						}
					}
				}
				for (let u = 0, k = tank.auras.length; u < k; u++) {
					let aura = tank.auras[u]
					if (aura.detector && tank.passive === false) {
						if (aura.type === 0) {
							for (let i = aura.detector.objects.length - 1; i >= 0; i--) {
								let c = aura.detector.objects[i]
								if (!(c.invincible || c.inBase || c.prevInBase || c.static)) {
									c.damage(aura.auraDamage * 5 * tank.levelMultiplier, tank, 'tanks')
								}
							}
						} else if (aura.type === 1 && aura.healing) {
							for (let i = aura.detector.objects.length - 1; i >= 0; i--) {
								aura.detector.objects[i].regen *= aura.healing
							}
						}
					}
				}
				for (let i = 0, l = tank._barrels.length; i < l; i++) {
					let barrel = tank._barrels[i]
					if (barrel.child) { continue }
					barrel.current += 0.01
					let reload = barrel.data.reload * 0.5 * (1 - tank.upgrades[3] / 30)
					let active = tank.firing
					if (barrel.turret) {
						active = (barrel.turret.detector.closest ? barrel.turret.active : false)
					}
					if (barrel.data.type === 2 || barrel.data.type === 4) {
						if (barrel.bullets.length >= barrel.data.drones) {
							active = false
						} else {
							active = tank.passive ? tank.firing : true
						}
					}
					if (active) {
						if (barrel.current >= reload) {
							if (reload) {
								barrel.current -= reload
								if (barrel.current >= reload) {
									barrel.current = (barrel.current % reload)
								}
							} else {
								barrel.current = 0
							}
							let d = (barrel.turret ? barrel.turret.d : tank.d) + barrel.data.d
							let x = (barrel.turret ? barrel.turret.gameX : tank.x)
							let y = (barrel.turret ? barrel.turret.gameY : tank.y)
							let sin = Math.sin(d)
							let cos = Math.cos(d)
							let offsetX = -barrel.data.x
							let offsetY = -barrel.data.y + barrel.data.height * 2 + barrel.data.width
							let speed = dimension.getBulletSpeed(barrel.data, tank)
							let time = 1;
							let health = 1;
							if (barrel.data.type === 0) {
								time = 1.5
								health = 100
							} else if (barrel.data.type === 1) {
								time = 12
								health = 1000
							} else if (barrel.data.type === 2) {
								time = 0
								health = 100
							} else if (barrel.data.type === 3) {
								time = 12
								health = 1000
							} else if (barrel.data.type === 4) {
								time = 0
								health = 100
							}
							let rsize = barrel.data.relativeSize * tank.size
							tank.firedBarrels[i] = i
							let size = barrel.data.relativeSize * barrel.data.width
							generator.bullet({
								dim: dim,
								parent: tank,
								barrelId: i,
								size: size,
								d: d,
								damage: 1 + tank.upgrades[2] / 15,
								health: barrel.data.penetration * health * (1 + tank.upgrades[0] / 15),
								lifeTime: barrel.data.time * time,
								x: x + rsize * (cos * offsetX - sin * offsetY),
								y: y + rsize * (cos * offsetY + sin * offsetX),
								xv: -sin * speed,
								yv: cos * speed,
								speed: speed,
								barrel: barrel,
							})
							if (barrel.data.recoil && !tank.static) {
								let recoil = 0.8 * barrel.data.recoil * size * size
								tank.xv += recoil * sin
								tank.yv -= recoil * cos
							}
						}
					} else {
						let max = reload * (1 - barrel.data.delay)
						if (barrel.current > max) {
							barrel.current = max
						}
					}
				}
				if (tank.health <= 0) {
					tank.remove()
					let totalDamage = 0
					let totalScore = tank.score * dimension.getRadiantMultiplier(tank.radiant) * 0.8
					let tanks = {}, polygons = {}
					let tankNames = []
					let tankOrder = {}
					let dimTanks = {}, dimPolygons = {}
					for (let i = tank.dim.tanks.length - 1; i >= 0; i--) {
						let obj = tank.dim.tanks[i]
						dimTanks[obj.id] = obj
					} for (let i = tank.dim.polygons.length - 1; i >= 0; i--) {
						let obj = tank.dim.polygons[i]
						dimPolygons[obj.id] = obj
					}
					let count = 0
					for (let id in tank.finalDamage.tanks) {
						let _tank = dimTanks[id]
						if (_tank) {
							let finalDamage = tank.finalDamage.tanks[id]
							let damage = 0
							for (let i = 0; i < 16; i++) { damage += finalDamage[i] }
							tanks[id] = damage
							tankNames.push(_tank.name)
							tankOrder[id] = count
							count++
							totalDamage += damage
						}
					} for (let id in tank.finalDamage.polygons) {
						let _polygon = dimPolygons[id]
						if (_polygon) {
							let finalDamage = tank.finalDamage.polygons[id]
							let damage = 0
							for (let i = 0; i < 16; i++) { damage += finalDamage[i] }
							polygons[id] = damage
							tankNames.push(dimension.getFullPolygonName(_polygon))
							totalDamage += damage
						}
					} for (let id in tanks) {
						let part = tanks[id] / totalDamage
						let obj = dimTanks[id]
						obj.score += part * totalScore
						obj.update()
						if (obj.ws.sendPacket) {
							let slice = tankOrder[id]
							let names = tankNames.slice(0, slice).concat(tankNames.slice(slice + 1))
							let length = names.length
							if (length === 0) {
								obj.ws.sendPacket('announcement', `You killed ${tank.name}`)
							} else if (length === 1) {
								obj.ws.sendPacket('announcement', `You and ${names[0]} killed ${tank.name}`)
							} else {
								obj.ws.sendPacket('announcement', `You, ${names.slice(0, i - 1).join(', ')}, and ${names[i]} killed ${tank.name}`)
							}
						}
					} for (let id in polygons) {
						let part = polygons[id] / totalDamage
						let obj = dimPolygons[id]
						let r = 2 * (obj.radiant < 1 ? 1 : (22 * Math.pow(3.6, obj.radiant - 1)))
						obj.score += part * totalScore / r
						obj.update()
					}
					if (tank.ws.sendPacket) {
						tank.ws.sendPacket('death', [tankNames, Math.round(tank.ws.data.respawnScore = tank.score * 0.2)])
					}
				}
			}
			for (let i = dim.polygons.length - 1; i >= 0; i--) {
				let polygon = dim.polygons[i]
				if (polygon.health <= 0) {
					if (dim.polygons.length < 60) { ggg(dim) }
					let totalDamage = 0
					let totalScore = polygon.score * dimension.getRadiantMultiplier(polygon.radiant)
					let showNotification = (totalScore >= 1e8 || polygon.radiant > 3)
					let tanks = {}
					let tankNames = []
					let tankOrder = {}
					let dimTanks = {}
					let name = dimension.getFullPolygonName(polygon)
					for (let i = polygon.dim.tanks.length - 1; i >= 0; i--) {
						let obj = polygon.dim.tanks[i]
						dimTanks[obj.id] = obj
					}
					let count = 0
					for (let id in polygon.finalDamage.tanks) {
						let _tank = dimTanks[id]
						if (_tank) {
							let finalDamage = polygon.finalDamage.tanks[id]
							let damage = 0
							for (let i = 0; i < 16; i++) { damage += finalDamage[i] }
							tanks[id] = damage
							tankNames.push(_tank.name)
							tankOrder[id] = count
							count++
							totalDamage += damage
						}
					} for (let id in tanks) {
						let part = tanks[id] / totalDamage
						let obj = dimTanks[id]
						obj.score += part * totalScore
						obj.update()
						if (obj.ws.sendPacket && showNotification) {
							let slice = tankOrder[id]
							let names = tankNames.slice(0, slice).concat(tankNames.slice(slice + 1))
							let length = names.length
							if (length === 0) {
								obj.ws.sendPacket('announcement', `You killed ${name}`)
							} else if (length === 1) {
								obj.ws.sendPacket('announcement', `You and ${names[0]} killed ${name}`)
							} else {
								obj.ws.sendPacket('announcement', `You, ${names.slice(0, length - 1).join(', ')}, and ${names[i]} killed ${name}`)
							}
						}
					}
					polygon.remove()
				}
			}
			if (options.gameUpdate) {
				for (let i = dim.gates.length - 1; i >= 0; i--) {
					let gate = dim.gates[i]
					if (gate[5] !== gate[7]) {
						gate[7] = gate[5]
						dim.updatedGates[i] = [i, gate[5]]
					}
				}
				let objects = dimension.leaderboard(dim)
				let leaderboard = [], changes = {}
				for (let i = 0; i < 8; i++) {
					let current = objects[i]
					let obj = {
						place: i,
						id: current.id,
						type: (current.objectType === 'tank' ? 1 : 0),
						score: Math.round(current.score),
						sides: current.sides,
						radiant: current.radiant
					}
					let test = dim.leaderboard[i]
					if (test && (test.id !== obj.id || Math.round(test.score) !== obj.score || test.type !== obj.type)) {
						changes[i] = obj
					}
					if (obj) {
						leaderboard.push(obj)
					} else {
						leaderboard.push(false)
					}
				}
				dim.leaderboard = leaderboard
				let data = []
				for (let place in changes) {
					let obj = changes[place]
					data.push([
						place,
						obj.id,
						(obj.type ? 0 : [obj.sides, obj.radiant]),
						Math.round(obj.score)
					])
				}
				dim.leaderboardChanges = data
			}
		},
		leaderboard: function (dim) {
			return dim.tanks.concat(dim.polygons).sort((a, b) => (a.displayScore === b.displayScore ? b.radiant - a.radiant : b.displayScore - a.displayScore))
		}
	}

	const generator = {
		getId: function (name, dim) {
			let ids = dim.ids[name]
			let length = ids.length
			if (length === 0) {
				ids.push(0)
				return 0
			}
			let i = 0
			while (ids[i] === i && i < length) { i++ }
			ids.splice(i, 0, i)
			return i
		},
		removeId: function (name, id, dim) {
			setTimeout(function () {
				let ids = dim.ids[name]
				let i = ids.indexOf(id)
				if (i >= 0) {
					ids.splice(i, 1)
				}
			}, 1000)
		},
		updateTank: function (tank) {
			tank._barrels = []
			let check = function (barrel) {
				tank._barrels.push(barrel)
				let size = barrel.data.relativeSize * barrel.data.width
				if (barrel.data && (barrel.data.type === 3 || barrel.data.type === 4)) {
					let weapon = barrel.data.bulletWeapon
					if (weapon) {
						for (let i = 0, l = weapon.barrels.length; i < l; i++) {
							let barrel = weapon.barrels[i]
							barrel.relativeSize = size
							check({
								data: barrel,
								child: true
							})
						}
					}
					let body = barrel.data.bulletBody
					if (body) {
						for (let i = 0, l = body.turrets.length; i < l; i++) {
							let source = body.turrets[i]
							let turret = source
							let barrels = source.barrels
							for (let u = 0, k = barrels.length; u < k; u++) {
								let barrel = barrels[u]
								barrel.relativeSize = size * turret.size
								check({
									data: barrel,
									turret: turret,
									child: true
								})
							}
						}
					}
				}
			}
			for (let i = 0, l = tank.barrels.length; i < l; i++) {
				let barrel = tank.barrels[i]
				check(barrel)
			}
			tank._turrets = tank.weaponTurrets.concat(tank.turrets)
			for (let i = 0, l = tank._turrets.length; i < l; i++) {
				let turret = tank._turrets[i]
				for (let u = 0, k = turret.barrels.length; u < k; u++) {
					check(turret.barrels[u])
				}
			}
			tank.removeBullets()
		},
		setTankWeapon: function (tank, weapon) {
			let w = weapon
			weapon = tankData.weapons[weapon]
			if (weapon) {
				tank.weapon = w
				tank.weaponData = weapon
				tank.weaponCameraSize = weapon.cameraSizeMultiplier
				tank.barrels = []
				tank.weaponTurrets = []
				for (let i = 0, l = weapon.barrels.length; i < l; i++) {
					let barrel = weapon.barrels[i]
					barrel.relativeSize = 1
					tank.barrels.push({
						current: barrel.reload * 0.5 * (1 - barrel.delay) - 0.1,
						bullets: [],
						data: barrel
					})
				}
				for (let i = 0, l = weapon.weaponTurrets.length; i < l; i++) {
					let turret = { ...weapon.weaponTurrets[i] }
					turret.gameX = tank.x
					turret.gameY = tank.y
					turret.detector = {}
					turret.d = tank.d
					turret.position = 'weaponTurret'
					let barrels = turret.barrels
					turret.barrels = []
					for (let u = 0, k = barrels.length; u < k; u++) {
						let data = barrels[u]
						turret.barrels.push({
							current: data.reload * 0.5 * (1 - data.delay) - 0.1,
							bullets: [],
							data: data,
							turret: turret,
							active: false
						})
					}
					tank.weaponTurrets.push(turret)
				}
				generator.updateTank(tank)
			}
		},
		setTankBody: function (tank, body) {
			let b = body
			body = tankData.bodies[body]
			if (body) {
				tank.body = b
				tank.bodyData = body
				tank.movementSpeed = body.movementSpeed
				let maxHealth = body.maxHealth * 800
				tank.health *= maxHealth / tank.maxHealth
				tank.maxHealth = maxHealth
				tank.bodyDamage = body.bodyDamage
				tank.bodyCameraSize = body.cameraSizeMultiplier
				tank.turrets = []
				tank.auras = []
				for (let i = 0, l = body.turrets.length; i < l; i++) {
					let turret = { ...body.turrets[i] }
					turret.gameX = tank.x
					turret.gameY = tank.y
					turret.detector = {}
					turret.d = tank.d
					turret.position = 'turret'
					let barrels = turret.barrels
					turret.barrels = []
					for (let u = 0, k = barrels.length; u < k; u++) {
						let barrel = barrels[u]
						barrel.relativeSize = turret.size * 0.5
						turret.barrels.push({
							current: barrel.reload * 0.5 * (1 - barrel.delay) - 0.1,
							bullets: [],
							data: barrel,
							turret: turret,
							active: false
						})
					}
					tank.turrets.push(turret)
				}
				for (let i = 0, l = body.auras.length; i < l; i++) {
					let aura = { ...body.auras[i] }
					aura.gameX = tank.x
					aura.gameY = tank.y
					aura.detector = {}
					tank.auras.push(aura)
				}
				generator.updateTank(tank)
			}
		},
		updateFinalDamage: function (obj) {
			let updated = {}
			for (let id in obj) {
				let arr = obj[id]
				if (Math.max(...arr) > 0) {
					updated[id] = arr.slice(1).concat(0)
				}
			}
			return updated
		},
		log1: 1 / Math.log(1.2),
		log2: 1 / Math.log(4),
		getLevel: function (score) {
			return Math.floor(Math.round(10e5 * Math.log(score / 500 + 1) * generator.log1) / 10e5) + 1
		},
		getSides: function (score) {
			return Math.floor(Math.round(10e5 * Math.log(1 + 3 * (score - 250) / 1000) * generator.log2) / 10e5) + 3
		},
		tank: function (data, ws) {
			let tank = {
				id: generator.getId('tank', data.dim),
				dim: data.dim || false,
				x: data.x || 0,
				y: data.y || 0,
				d: data.d || 0,
				_d: [],
				xv: 0,
				yv: 0,
				static: data.static || false,
				firing: false,
				droneControl: false,
				firedBarrels: {},
				upgrades: data.upgrades || [0, 0, 0, 0, 0, 0, 0, 0],
				upgradeCount: data.upgradeCount || 0,
				bodyDamageMultiplier: 1,
				radiant: data.radiant || 0,
				controlPosition: [0, 0],
				mousePosition: [0, 0],
				name: data.name || '',
				team: data.team || 0,
				score: data.score || 0,
				displayScore: data.score || 0,
				level: 0,
				lastSendLevel: 0,
				levelMultiplier: 1,
				health: 800,
				maxHealth: 800,
				regenTime: 1,
				size: 30,
				detector: false,
				input: {
					movement: [0, 0]
				},
				typing: data.typing || false,
				passive: data.passive || false,
				invincible: ('invincible' in data ? data.invincible : true),
				invincibleTime: performance.now() + 30000,
				weapon: data.weapon || 'node',
				body: data.body || 'base',
				turrets: [],
				auras: [],
				bullets: {},
				fov: {
					tanks: [],
					polygons: [],
					bullets: []
				},
				finalDamage: {
					tanks: {},
					polygons: {}
				},
				removeBullets: function () {
					for (let id in tank.bullets) {
						tank.bullets[id].remove()
					}
				},
				setMaxHealth: function (health) {
					tank.health = tank.health / tank.maxHealth * health
					tank.maxHealth = health
				},
				damage: function (amount, object, type) {
					if (amount > 0) {
						tank.health -= amount
						if (tank.health < 0) {
							tank.health = 0
						}
						tank.regenTime = 0
						let obj = tank.finalDamage[type]
						if (obj) {
							if (!obj[object.id]) {
								obj[object.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, amount]
							} else {
								obj[object.id][15] += amount
							}
						}
					}
				},
				remove: function () {
					tank.removeBullets()
					let index = tank.dim.tanks.indexOf(tank)
					if (index >= 0) {
						tank.dim.tanks.splice(index, 1)
					}
					generator.removeId('tank', tank.id, tank.dim)
					if (ws && ws.data && ws.data.tank === tank) {
						ws.data.tank = false
					}
				},
				update: function () {
					tank.displayScore = tank.score * dimension.getRadiantMultiplier(tank.radiant)
					tank.level = generator.getLevel(tank.score)
					tank.levelMultiplier = Math.pow(1.01, tank.level - 1)
					tank.size = 30 * tank.levelMultiplier
					if (tank.barrels) {
						for (let i = tank.barrels.length - 1; i >= 0; i--) {
							let bullets = tank.barrels[i].bullets
							for (let u = bullets.length - 1; u >= 0; u--) {
								bullets[u].size = tank.size * bullets[u].rawSize
							}
						}
					}
				},
				ws: ws,
				objectType: 'tank'
			}
			if (data.ai === 'defender') {
				let passiveD = Math.random() * 2 * Math.PI
				let next = 0
				tank.ai = function (data) {
					tank.d = dimension.averageAngles(tank.d, passiveD, 100)
					if (next < data.now) {
						next = data.now + 10000 + Math.random() * 10000
						passiveD = Math.random() * 2 * Math.PI
					}
				}
			}
			tank.update()
			generator.setTankWeapon(tank, tank.weapon)
			generator.setTankBody(tank, tank.body)
			if (tank.dim) {
				tank.dim.updatedTanks[tank.id] = tank
				tank.dim.add('tanks', tank)
			}
			return tank
		},
		bullet: function (options) {
			let barrel = options.parent._barrels[options.barrelId]
			let b = options.barrel || barrel
			let bullet = {
				id: generator.getId('bullet', options.dim),
				type: barrel.data.type,
				parent: options.parent,
				parentId: options.parent.id,
				barrelId: options.barrelId,
				barrel: barrel,
				barrels: [],
				dim: options.dim || false,
				damageMultiplier: options.damage || 1,
				timeExisted: 0,
				target: false,
				lifeTime: options.lifeTime || 1,
				health: options.health || 125,
				d: options.d || 0,
				x: options.x || 0,
				y: options.y || 0,
				xv: options.xv || 0,
				yv: options.yv || 0,
				speed: options.speed || 0,
				size: options.size * options.parent.size,
				rawSize: options.size,
				remove: function () {
					if (bullet === options.parent.bullets[bullet.id]) {
						delete options.parent.bullets[bullet.id]
					}
					if (bullet.barrels) {
						for (let i = bullet.barrels.length - 1; i >= 0; i--) {
							let bullets = bullet.barrels[i].bullets
							for (let u = bullets.length - 1; u >= 0; u--) {
								bullets[u].remove()
							}
						}
					}
					let index = bullet.dim.bullets.indexOf(bullet)
					if (index >= 0) {
						bullet.dim.bullets.splice(index, 1)
					}
					generator.removeId('bullet', bullet.id, bullet.dim)
					index = b.bullets.indexOf(bullet)
					if (index >= 0) {
						b.bullets.splice(index, 1)
					}
				},
			}
			if (barrel.data.type === 3 || barrel.data.type === 4) {
				let weapon = barrel.data.bulletWeapon
				if (weapon) {
					bullet.barrels = []
					for (let i = 0, l = weapon.barrels.length; i < l; i++) {
						let barrel = weapon.barrels[i]
						let j = -1
						for (j = options.parent._barrels.length - 1; j >= 0; j--) {
							if (options.parent._barrels[j].data === barrel) {
								break
							}
						}
						bullet.barrels.push({
							current: barrel.reload * 0.5 * (1 - barrel.delay) - 0.1,
							bullets: [],
							data: barrel,
							id: j
						})
					}
				}
				bullet._barrels = bullet.barrels.slice(0)
				let body = barrel.data.bulletBody
				if (body) {
					bullet.bodyData = body
					bullet.speed *= body.movementSpeed
					bullet.health *= body.maxHealth
					bullet.damageMultiplier *= body.bodyDamage
					bullet.bodyCameraSize = body.cameraSizeMultiplier
					bullet.turrets = []
					bullet.auras = []
					for (let i = 0, l = body.turrets.length; i < l; i++) {
						let turret = { ...body.turrets[i] }
						turret.gameX = bullet.x
						turret.gameY = bullet.y
						turret.detector = {}
						turret.d = bullet.d
						turret.position = 'turret'
						let barrels = turret.barrels
						turret.barrels = []
						for (let u = 0, k = barrels.length; u < k; u++) {
							let barrel = barrels[u]
							barrel.relativeSize = turret.size * 0.25
							let j = -1
							for (j = options.parent._barrels.length - 1; j >= 0; j--) {
								if (options.parent._barrels[j].data === barrel) {
									break
								}
							}
							let obj = {
								current: barrel.reload * 0.5 * (1 - barrel.delay) - 0.1,
								bullets: [],
								data: barrel,
								turret: turret,
								active: false,
								id: j
							}
							turret.barrels.push(obj)
							bullet._barrels.push(obj)
						}
						bullet.turrets.push(turret)
					}
					for (let i = 0, l = body.auras.length; i < l; i++) {
						let aura = { ...body.auras[i] }
						aura.gameX = bullet.x
						aura.gameY = bullet.y
						aura.detector = {}
						bullet.auras.push(aura)
					}
				}
			}
			b.bullets.push(bullet)
			options.parent.bullets[bullet.id] = bullet
			if (bullet.dim) {
				bullet.dim.add('bullets', bullet)
			}
			return bullet
		},
		polygon: function (data) {
			let polygon = {
				id: generator.getId('polygon', data.dim),
				dim: data.dim || false,
				x: data.x || 0,
				y: data.y || 0,
				d: data.d || 0,
				xv: 0,
				yv: 0,
				radiant: data.radiant || 0,
				sides: data.sides || 3,
				score: 0,
				health: 0,
				maxHealth: 0,
				regenTime: 1,
				size: 0,
				finalDamage: {
					tanks: {}
				},
				damage: function (amount, object, type) {
					if (amount > 0) {
						polygon.health -= amount
						if (polygon.health < 0) {
							polygon.health = 0
						}
						polygon.regenTime = 0
						let obj = polygon.finalDamage[type]
						if (obj) {
							if (!obj[object.id]) {
								obj[object.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, amount]
							} else {
								obj[object.id][15] += amount
							}
						}
					}
				},
				remove: function () {
					let index = polygon.dim.polygons.indexOf(polygon)
					if (index >= 0) {
						polygon.dim.polygons.splice(index, 1)
					}
					generator.removeId('polygon', polygon.id, polygon.dim)
				},
				update: function () {
					if (polygon.sides < 0) { return }
					if (polygon.score < 150) { polygon.score = 250 }
					polygon.displayScore = polygon.score * dimension.getRadiantMultiplier(polygon.radiant)
					let sides = generator.getSides(polygon.score)
					if (sides !== polygon.sides) {
						polygon.sides = sides
						polygon.size = generator.getPolygonSize(polygon.sides);
						let maxHealth = generator.getPolygonHealth(polygon.sides)
						polygon.speed = generator.getPolygonSpeed(polygon.sides)
						polygon.health *= maxHealth / polygon.maxHealth
						polygon.maxHealth = maxHealth
					}
				}
			}
			if (polygon.sides < 0) {
				polygon.score = 1000000000 * Math.pow(3, -polygon.sides - 1)
			} else {
				polygon.score = 250 + 1000 * (Math.pow(4, polygon.sides - 3) - 1) / 3
			}
			polygon.displayScore = polygon.score * dimension.getRadiantMultiplier(polygon.radiant)
			//50 * Math.pow(1.4, -sides - 1)
			polygon.size = generator.getPolygonSize(polygon.sides)
			polygon.speed = generator.getPolygonSpeed(polygon.sides)
			polygon.health = polygon.maxHealth = generator.getPolygonHealth(polygon.sides)
			if (polygon.dim) {
				polygon.dim.add('polygons', polygon)
			}
			return polygon
		},
		getPolygonSize: function (sides) {
			if (sides >= 3) {
				return 18 * Math.pow(1.47, sides - 3)
			} else {
				return 50 * Math.pow(1.4, -sides - 1)
			}
		},
		getPolygonSpeed: function (sides) {
			if (sides >= 3) {
				return Math.pow(0.6, sides - 3)
			} else {
				return 0.5 * Math.pow(0.4, -sides - 1)
			}
		},
		getPolygonHealth: function (sides) {
			if (sides >= 3) {
				return 35 * Math.pow(3.6, sides - 3)
			} else {
				return 50000 * Math.pow(2, -sides - 1)
			}
		},
		wormhole: function (data) {
			let s = (data.size || 75)
			let wormhole = {
				id: generator.getId('wormhole', data.dim),
				dim: data.dim || false,
				type: data.type || 0,
				x: data.x || 0,
				y: data.y || 0,
				objects: {},
				_objects: {},
				time: data.time || 30,
				fadeTime: 0,
				action: data.action || function () { },
				ruptured: data.ruptured || false,
				entries: 0,
				contents: 0,
				size: s,
				defaultSize: s * s,
				remove: function () {
					if (wormhole.dim.wormholes[wormhole.id] === wormhole) {
						delete wormhole.dim.wormholes[wormhole.id]
					}
					wormhole.dim.removedWormholes[wormhole.id] = wormhole
					generator.removeId('wormhole', wormhole.id, wormhole.dim)
				},
				rupture: function () {
					if (!wormhole.ruptured) {
						wormhole.ruptured = true
						wormhole.dim.rupturedWormholes[wormhole.id] = wormhole
					}
				}
			}
			if (wormhole.dim) {
				wormhole.dim.wormholes[wormhole.id] = wormhole
				wormhole.dim.addedWormholes[wormhole.id] = wormhole
			}
			return wormhole
		},
	}

	const packer = {
		gameStart: function (options) {
			let dim = options.dim
			let tanks = []
			for (let i = dim.tanks.length - 1; i >= 0; i--) {
				let tank = dim.tanks[i]
				tanks.push([
					tank.id,
					tank.name,
					tank.team,
					tank.radiant,
					tank.weapon,
					tank.body
				])
			}
			let objects = dimension.leaderboard(dim)
			let leaderboard = []
			for (let i = 0; i < 8; i++) {
				let obj = objects[i]
				if (obj) {
					leaderboard.push([
						obj.id,
						(obj.objectType === 'tank' ? 0 : [obj.sides, obj.radiant]),
						Math.round(obj.score)
					])
				} else {
					leaderboard.push(false)
				}
			}
			let slicedGates = []
			for (let i = 0, l = dim.gates.length; i < l; i++) {
				slicedGates.push(dim.gates[i].slice(0, 5))
			}
			let wormholes = []
			for (let i in dim.wormholes) {
				let wormhole = dim.wormholes[i]
				wormholes.push([
					wormhole.id,
					wormhole.x,
					wormhole.y,
					wormhole.type,
					wormhole.size,
					wormhole.ruptured || false,
					Math.round(wormhole.fadeTime * 100),
				])
			}
			return [
				tanks,
				dim.mapSize,
				leaderboard,
				dim.walls,
				slicedGates,
				wormholes,
				options.upgrades,
				Math.round(dim.darkness),
				[dim.background.r, dim.background.g, dim.background.b, dim.grid.r, dim.grid.g, dim.grid.b, dim.gridSize]
			]
		},
		gameUpdate: function (options) {
			let packet = [options.id, options.score]
			if (Object.keys(options.tanks)[0] >= 0) {
				let data = [0]
				for (let i in options.tanks) {
					let tank = options.tanks[i]
					let d = (Math.round(tank.d / Math.PI * 100) % 200 + 200) % 200
					let recordedDirections = [], length = tank._d.length
					if (length <= 1) {
						recordedDirections = d
					} else {
						let same = true
						for (let i = 0; i < 5; i++) {
							if (i < length) {
								recordedDirections.push(tank._d[i])
								if (same && i > 0 && tank._d[i] !== recordedDirections[i - 1]) {
									same = false
								}
							} else {
								recordedDirections.push(d)
							}
						}
						if (same) {
							recordedDirections = d
						}
					}
					let turretDirections = []
					for (let i = 0, l = tank._turrets.length; i < l; i++) {
						let turret = tank._turrets[i]
						turretDirections.push((Math.round(turret.d / Math.PI * 50) % 100 + 100) % 100)
					}
					let arr = [
						tank.id,
						Math.round(tank.x),
						Math.round(tank.y),
						recordedDirections,
						turretDirections,
						Math.floor((1 - tank.health / tank.maxHealth) * 100),
						(tank.typing ? 1 : 0) + (tank.passive ? 2 : 0) + (tank.invincible ? 4 : 0),
						tank.level
					]
					let firedBarrels = Object.values(tank.firedBarrels)
					if (firedBarrels[0] >= 0) {
						arr.push(firedBarrels)
					}
					data.push(arr)
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.updatedTanks)[0] >= 0) {
				let data = [1]
				for (let i in options.dim.updatedTanks) {
					let tank = options.dim.updatedTanks[i]
					let arr = [
						tank.id,
						tank.name,
						tank.team,
						tank.radiant,
						tank.weapon,
						tank.body
					]
					data.push(arr)
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.chatMessages)[0] >= 0) {
				let data = [2]
				for (let i in options.dim.chatMessages) {
					data.push([i, options.dim.chatMessages[i]])
				}
				packet.push(data)
			}
			if (Object.keys(options.bullets)[0] >= 0) {
				let data = [3]
				let object = {}, ids = {}
				for (let i in options.bullets) {
					let bullet = options.bullets[i]
					let parentId = bullet.parentId
					let barrelId = bullet.barrelId
					if (!(parentId in object)) {
						object[parentId] = {}
						ids[parentId] = parentId
					}
					let obj = object[parentId]
					let arr = [
						bullet.id,
						Math.round(bullet.x),
						Math.round(bullet.y),
						(Math.round(bullet.d / Math.PI * 100) % 200 + 200) % 200
					]
					if (bullet.turrets && bullet.turrets[0]) {
						let a = []
						for (let i in bullet.turrets) {
							let turret = bullet.turrets[i]
							a.push((Math.round(turret.d / Math.PI * 100) % 200 + 200) % 200)
						}
						arr.push(a)
						process.qqqq = a
					}
					if (barrelId in obj) {
						obj[barrelId].push(arr)
					} else {
						obj[barrelId] = [barrelId, arr]
					}
				}
				for (let parentId in object) {
					let objects = object[parentId]
					let obj = [ids[parentId]]
					for (let barrelId in objects) {
						obj.push(objects[barrelId])
					}
					data.push(obj)
				}
				packet.push(data)
			}
			if (Object.keys(options.polygons)[0] >= 0) {
				let data = [4]
				let obj = {}, keys = {}, keys2 = {}
				for (let i in options.dim.polygons) {
					let polygon = options.dim.polygons[i]
					let object = obj[polygon.radiant]
					if (!object) {
						object = obj[polygon.radiant] = {}
						keys[polygon.radiant] = polygon.radiant
					}
					if (object[polygon.sides]) {
						object[polygon.sides][polygon.id] = polygon
					} else {
						let obj2 = {}
						obj2[polygon.id] = polygon
						object[polygon.sides] = obj2
						keys2[polygon.sides] = polygon.sides
					}
				}
				process.g = obj
				for (let radiant in obj) {
					radiant = keys[radiant]
					let object = obj[radiant]
					let arr = [radiant]
					for (let sides in object) {
						let obj2 = object[sides]
						let arr2 = [keys2[sides]]
						for (let id in obj2) {
							let polygon = obj2[id]
							arr2.push([
								polygon.id,
								Math.round(polygon.x),
								Math.round(polygon.y),
								(Math.round(polygon.d / Math.PI * 500) % 1000 + 1000) % 1000,
								Math.floor((1 - polygon.health / polygon.maxHealth) * 500),
							])
						}
						arr.push(arr2)
					}
					data.push(arr)
				}
				process.jj = data
				packet.push(data)
			}
			if (Object.keys(options.dim.leaderboardChanges)[0] >= 0) {
				let data = [5].concat(options.dim.leaderboardChanges)
				packet.push(data)
			}
			if (Object.keys(options.dim.updatedGates)[0] >= 0) {
				let data = [6]
				for (let i in options.dim.updatedGates) {
					let gate = options.dim.updatedGates[i]
					data.push(gate)
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.resizedWormholes)[0] >= 0) {
				let data = [7]
				for (let i in options.dim.resizedWormholes) {
					let wormhole = options.dim.resizedWormholes[i]
					data.push([
						wormhole.id,
						Math.round(wormhole.size)
					])
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.rupturedWormholes)[0] >= 0) {
				let data = [8]
				for (let i in options.dim.rupturedWormholes) {
					let wormhole = options.dim.rupturedWormholes[i]
					data.push(wormhole.id)
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.fadeTimeChanges)[0] >= 0) {
				let data = [9]
				for (let i in options.dim.fadeTimeChanges) {
					let wormhole = options.dim.fadeTimeChanges[i]
					data.push([wormhole.id, Math.round(wormhole.fadeTime * 100)])
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.removedWormholes)[0] >= 0) {
				let data = [10]
				for (let i in options.dim.removedWormholes) {
					let wormhole = options.dim.removedWormholes[i]
					data.push(wormhole.id)
				}
				packet.push(data)
			}
			if (Object.keys(options.dim.addedWormholes)[0] >= 0) {
				let data = [11]
				for (let i in options.dim.addedWormholes) {
					let wormhole = options.dim.addedWormholes[i]
					data.push([
						wormhole.id,
						wormhole.x,
						wormhole.y,
						wormhole.type,
						wormhole.size,
						wormhole.ruptured || false,
						Math.round(wormhole.fadeTime * 100)
					])
				}
				packet.push(data)
			}
			return packet
		}
	}

	const commands = {
		getTargets: function (selector, me) {
			switch (selector) {
				case 'all':
					return me.dim.tanks.concat(me.dim.polygons).concat(me.dim.bullets)
				case 'bullets':
					return me.dim.bullets
				case 'tanks':
					return me.dim.tanks
				case 'polygons':
					return me.dim.polygons
				case 'me':
					return [me]
			}
		},
		execute: function (message, tank, ws) {
			let dim = tank.dim
			let text = message.slice(1)
			let params = text.split(' ')
			let command = params[0]
			params = params.slice(1)
			if (command === 'polygon') {
				let sides = parseInt(params[0])
				let radiant = parseInt(params[1])
				let selector = params[2]
				let targets = commands.getTargets(selector, tank)
				let pos = [tank.x, tank.y]
				if (targets && targets.length === 1) {
					pos = [targets[0].x, targets[0].y]
				}
				if (!sides) {
					return ws.sendPacket('announcement', `Parse error! /polygon <sides> [radiance]`)
				}
				if (sides < -5 || sides > 20) {
					return ws.sendPacket('announcement', `Cannot create polygon with ${sides} sides`)
				}
				if (radiant < 0 || radiant > 100) {
					return ws.sendPacket('announcement', `${radiant} is not a valid radiant level`)
				}
				generator.polygon({
					x: pos[0],
					y: pos[1],
					d: 2 * Math.PI * Math.random(),
					sides: sides,
					dim: tank.dim,
					radiant: radiant,
				})
			} else if (command === 'radiant') {
				let radiant = parseInt(params[1])
				if (radiant < 0 || radiant > 100) {
					return ws.sendPacket('announcement', `${radiant} is not a valid radiant level`)
				}
				let targets = commands.getTargets(params[0], tank)
				if (targets) {
					for (let i = targets.length - 1; i >= 0; i--) {
						let object = targets[i]
						if ('radiant' in object) {
							object.radiant = radiant
							if (object.objectType === 'tank') {
								object.dim.updatedTanks[object.id] = object
							}
							if (object.update) { object.update() }
						}
					}
				}
			} else if (command === 'tp') {
				let targets = commands.getTargets(params[0], tank), target
				if (params.length === 2) {
					let arr = commands.getTargets(params[1], tank)
					if (arr && arr.length === 1) {
						target = [arr[0].x, arr[0].y]
					}
				} else {
					target = [parseInt(params[1]) || 0, parseInt(params[2]) || 0]
				}
				if (targets && target) {
					for (let i = targets.length - 1; i >= 0; i--) {
						let object = targets[i]
						object.x = target[0]
						object.y = target[1]
					}
				}
			} else if (command === 'xp') {
				let score = parseInt(params[1])
				if (score < 0) {
					return ws.sendPacket('announcement', `${score} must be posotive or zero`)
				}
				let targets = commands.getTargets(params[0], tank)
				if (targets) {
					for (let i = targets.length - 1; i >= 0; i--) {
						let object = targets[i]
						if ('score' in object) {
							object.score = score
							if (object.objectType === 'tank') {
								object.dim.updatedTanks[object.id] = object
							}
							if (object.update) { object.update() }
						}
					}
				}
			}
		}
	}

	const clients = []
	server.on("connection", (ws, request) => {
		console.log('connect')
		ws.data = {
			ready: false,
			tank: false,
			waiting: false,
			lastChat: 0,
			respawnScore: 0,
		}
		ws.sendPacket = function (type) {
			if (type in game.codes.recieve && ws.send) {
				if (arguments.length > 1) {
					ws.send(pack([game.codes.recieve[type], arguments[1]]))
				} else {
					ws.send(pack([game.codes.recieve[type]]))
				}
			}
		}

		ws.sendPacket('ready')
		ws.data.ready = true
		clients.push(ws)

		ws.on("message", (data) => {
			try {
				data = unpack(data)
			} catch (e) {
				console.log(e)
				return
			}
			if (data[0] in game.codes.send) {
				let type = game.codes.send[data[0]]
				if (type === 'joinGame') {
					if (ws.data.ready && ws.data.tank === false && ws.data.waiting === false) {
						let radiant = 0
						while (Math.random() < 0.1) { radiant++ }
						let dim = dimension.dims[data[1][1]]
						if (!dim) { return }
						let name = data[1][0]
						let weapon = 'node', body = 'base'
						if (name) {
							let _s = name.toLowerCase().split('-')
							if (_s.length === 2) {
								weapon = _s[0]
								body = _s[1]
							}
						}
						let team = 0, x = 0, y = 0
						if (dim.type === '2teams') {
							team = 1 + Math.floor(2 * Math.random())
						} else if (dim.type === 'ffa') {
							team = 0
						} else {
							team = 1 + Math.floor(4 * Math.random())
						}
						[x, y] = dim.spawnPlayer(team)
						let tank = {
							dim: dim,
							x: x,
							y: y,
							name: name || '',
							weapon: weapon,
							body: body,
							score: ws.data.respawnScore || 0,
							radiant: radiant,
							team: team
						}
						ws.data.waiting = true
						dim.newTanks.push([tank, ws])
						ws.data.respawnScore = 0
					}
				} else if (type === 'direction') {
					if (ws.data.tank) {
						if (data[1] === false) {
							ws.data.tank.input.movement = [0, 0]
						} else if (data[1] >= 0 && data[1] <= 200) {
							let rad = data[1] / 100 * Math.PI
							ws.data.tank.input.movement = [Math.cos(rad), Math.sin(rad)]
						}
					}
				} else if (type === 'd') {
					if (ws.data.tank) {
						ws.data.tank.d = ((data[1] % 200 + 200) % 200) / 100 * Math.PI
					}
				} else if (type === 'chat') {
					let message = data[1]
					if (message[0] === '/') {
						if (ws.data.tank) {
							commands.execute(message, ws.data.tank, ws)
						}
					} else {
						let now = performance.now()
						if (now - ws.data.lastChat < 750) {
							ws.sendPacket('announcement', 'You are sending chat messages too quickly. Please slow down.')
						} else if (ws.data.tank && message && message.length > 0) {
							ws.data.lastChat = now
							let dim = ws.data.tank.dim
							if (ws.data.tank.id in dim.chatMessages) {
								ws.sendPacket('announcement', 'You are sending chat messages too quickly. Please slow down.')
							} else {
								dim.chatMessages[ws.data.tank.id] = message
							}
						}
					}
				} else if (type === 'typing') {
					if (ws.data.tank) {
						ws.data.tank.typing = data[1] ? true : false
					}
				} else if (type === 'passive') {
					if (ws.data.tank) {
						ws.data.tank.passive = data[1] ? true : false
					}
				} else if (type === 'firing') {
					if (ws.data.tank) {
						ws.data.tank.firing = (data[1] % 2 === 1) ? true : false
						ws.data.tank.droneControl = (data[1] < 2) ? false : true
					}
				} else if (type === 'controlPosition') {
					if (ws.data.tank) {
						let x = data[1][0] || 0
						let y = data[1][1] || 0
						ws.data.tank.controlPosition = [x, y]
					}
				} else if (type === 'upgradeStat') {
					if (ws.data.tank) {
						let i = data[1][0]
						if (i >= 0 && i <= 7) {
							let amount = data[1][1]
							let required = amount - ws.data.tank.upgrades[i]
							if (required > 0 && ws.data.tank.upgradeCount + required < ws.data.tank.level && amount <= 15) {
								ws.data.tank.upgradeCount += required
								ws.data.tank.upgrades[i] = amount
							} else {
								ws.sendPacket('setStats', ws.data.tank.upgrades)
							}
						}
					}
				} else if (type === 'upgradeWeapon') {
					if (ws.data.tank) {
						let weapon = data[1] || ''
						ws.data.tank.removeBullets()
						generator.setTankWeapon(ws.data.tank, weapon)
						ws.data.tank.firedBarrels = {}
						generator.updateTank(ws.data.tank)
						ws.data.tank.dim.updatedTanks[ws.data.tank.id] = ws.data.tank
					}
				} else if (type === 'upgradeBody') {
					if (ws.data.tank) {
						let body = data[1] || ''
						ws.data.tank.removeBullets()
						generator.setTankBody(ws.data.tank, body)
						ws.data.tank.firedBarrels = {}
						generator.updateTank(ws.data.tank)
						ws.data.tank.dim.updatedTanks[ws.data.tank.id] = ws.data.tank
					}
				} else {
					console.log(type)
				}
			}
		})
		ws.on("close", () => {
			console.log("close")
			if (ws.data.tank) {
				let tank = ws.data.tank
				tank.ws.send = false
				tank.team = 7
				tank.name = `Fallen ${tank.weapon && tank.weapon[0] ? tank.weapon[0].toUpperCase() + tank.weapon.slice(1) : '???'}-${tank.body && tank.body[0] ? tank.body[0].toUpperCase() + tank.body.slice(1) : '???'}`
				tank.dim.updatedTanks[tank.id] = tank
				tank.removeBullets()
				let c = 0
				for (let i = tank.dim.tanks.length - 1; i >= 0; i--) {
					if (tank.dim.tanks[i].team === 7) {
						c++
					}
				}
				if (c >= 10 || 1) {
					tank.remove()
				}
			}
			let i = clients.indexOf(ws)
			if (i >= 0) {
				clients.splice(i, 1)
			}
		})
	})

	let _ = 0, $ = 0, ticks = []
	function tick(now) {
		ticks.push(now + 1000)
		let i = 0
		while (ticks[i] < now) {
			i++
		}
		ticks.splice(0, i)
		process.tps = ticks.length
		if ($ >= 49) {
			$ = 0
			updateFinalDamage = true
		} else {
			$++
		}
		let gameUpdate = (_ >= 9)
		for (let i in dimension.dims) {
			let dim = dimension.dims[i]
			dimension.update(dim, {
				recordDirection: ((_ + 1) % 2 === 0),
				updateFinalDamage: ($ === 0),
				gameUpdate: gameUpdate
			}, now)
		}
		if (gameUpdate) {
			_ = 0
			for (let i = clients.length - 1; i >= 0; i--) {
				let ws = clients[i], tank = ws.data.tank
				if (tank) {
					ws.sendPacket('gameUpdate', packer.gameUpdate({
						tanks: tank.fov.tanks,
						bullets: tank.fov.bullets,
						polygons: tank.fov.polygons,
						id: tank.id,
						score: Math.floor(tank.score),
						dim: tank.dim
					}))
				}
			}
			for (let i in dimension.dims) {
				let dim = dimension.dims[i]
				dimension.reset(dim)
			}
		} else {
			_++
		}
	}

	let lastTick = 0
	setInterval(function () {
		let now = performance.now()
		if (now >= lastTick) {
			process.delta = now - lastTick + 10
			lastTick += 10 * (1 + Math.floor((now - lastTick) * 0.1))
			tick(now)
		}
	}, 5)


	!function () {
		const dim = dimension.create({
			mapSize: 6000,
			name: 'ffa',
			type: 'ffa',
			walls: [],
			gates: [],
			background: {
				r: 205,
				g: 205,
				b: 205
			},
			grid: {
				r: 200,
				g: 200,
				b: 200
			},
			gridSize: 25,
			spawnPlayer: function (team) {
				return [(2 * Math.random() - 1) * dim.mapSize, (2 * Math.random() - 1) * dim.mapSize]
			}
		})
	}()
	!function () {
		const dim = dimension.create({
			mapSize: 6000,
			name: '2teams',
			type: '2teams',
			walls: [
				[-5200, 0, 800, 6000, 1],
				[5200, 0, 800, 6000, 2]
			],
			gates: [],
			background: {
				r: 205,
				g: 205,
				b: 205
			},
			grid: {
				r: 200,
				g: 200,
				b: 200
			},
			gridSize: 25,
			spawnPlayer: function (team) {
				let d = defenders[team]
				if (d) {
					let t = Math.floor(Math.random() * 4)
					d = d[Math.floor(Math.random() * d.length)]
					d.firedBarrels[t + 8] = t + 8
					let x = d.x, y = d.y
					let a = d.d + [0, -0.5, 0.5, 1][t] * Math.PI
					let r = d.size - 50
					return [x + r * Math.sin(a), y - r * Math.cos(a)]
				} else {
					return [(2 * Math.random - 1) * dim.mapSize, (2 * Math.random - 1) * dim.mapSize]
				}
			}
		})
		let defenders = {
			1: [],
			2: []
		}
		for (let i = -5200; i <= 5200; i += 2080) {
			let ws = {
				data: {},
				sendPacket: function () { }
			}
			let defender = generator.tank({
				dim: dim,
				x: -5200,
				y: i,
				name: 'Blue Defender',
				static: true,
				weapon: 'defender',
				body: 'defender',
				score: 17694994357968816000,
				radiant: 0,
				team: 1,
				invincible: false,
				ai: 'defender'
			}, ws)
			defenders[1].push(defender)
			ws.data.tank = defender
			ws = {
				data: {},
				sendPacket: function () { }
			}
			defender = generator.tank({
				dim: dim,
				x: 5200,
				y: i,
				name: 'Red Defender',
				static: true,
				weapon: 'defender',
				body: 'defender',
				score: 17694994357968816000,
				radiant: 0,
				team: 2,
				invincible: false,
				ai: 'defender'
			}, ws)
			defenders[2].push(defender)
			ws.data.tank = defender
		}
	}()
	!function () {
		const dim = dimension.create({
			mapSize: 6000,
			name: '4teams',
			type: '4teams',
			walls: [
				[-5200, -5200, 800, 800, 1],
				[5200, -5200, 800, 800, 2],
				[5200, 5200, 800, 800, 3],
				[-5200, 5200, 800, 800, 4],
			],
			gates: [],
			background: {
				r: 205,
				g: 205,
				b: 205
			},
			grid: {
				r: 200,
				g: 200,
				b: 200
			},
			gridSize: 25,
			spawnPlayer: function (team) {
				let d = defenders[team]
				if (d) {
					let t = Math.floor(Math.random() * 4)
					d = d[Math.floor(Math.random() * d.length)]
					d.firedBarrels[t + 8] = t + 8
					let x = d.x, y = d.y
					let a = d.d + [0, 0.5, -0.5, 1][t] * Math.PI
					let r = d.size - 50
					return [x + r * Math.sin(a), y - r * Math.cos(a)]
				} else {
					return [(2 * Math.random - 1) * dim.mapSize, (2 * Math.random - 1) * dim.mapSize]
				}
			}
		})
		let defenders = {
			1: [],
			2: [],
			3: [],
			4: []
		}
		for (let i = 0; i < 4; i++) {
			let ws = {
				data: {},
				sendPacket: function () { }
			}
			let team = i + 1
			let defender = generator.tank({
				dim: dim,
				x: [-5200, 5200, 5200, -5200][i],
				y: [-5200, -5200, 5200, 5200][i],
				name: ['Blue', 'Red', 'Green', 'Purple'][i] + ' Defender',
				static: true,
				weapon: 'defender',
				body: 'defender',
				score: 17694994357968816000,
				radiant: 0,
				team: team,
				invincible: false,
				ai: 'defender'
			}, ws)
			ws.data.tank = defender
			defenders[team].push(defender)
		}
	}()
	dimension.create({
		mapSize: 6000,
		name: 'crossroads',
		type: 'crossroads',
		walls: [],
		gates: [],
		background: {
			r: 54,
			g: 54,
			b: 54
		},
		grid: {
			r: 39,
			g: 39,
			b: 39
		},
		gridSize: 100
	})
	dimension.create({
		mapSize: 4000,
		name: 'abyss',
		type: 'abyss',
		walls: [],
		gates: [],
		darkness: 0.9,
		background: {
			r: 12,
			g: 12,
			b: 12
		},
		grid: {
			r: 21,
			g: 21,
			b: 21
		},
		gridSize: 100
	})




	function ggg(dim) {
		let polygons = {}
		for (let i = dim.polygons.length - 1; i >= 0; i--) {
			let polygon = dim.polygons[i]
			if (polygon.sides in polygons) {
				polygons[polygon.sides]++
			} else {
				polygons[polygon.sides] = 1
			}
		}
		let radiant = 0
		while (Math.random() < 0.2) { radiant++ }
		let chances = {}
		let total = 0
		let k = 1
		for (let i = 3; i < 13; i++) {
			let l = k * 1 / (1 + 2 * (polygons[i] || 0))
			chances[i] = l
			total += l
			k *= 0.4
		}
		k = 0.001
		for (let i = -1; i > -6; i--) {
			let l = k * 1 / (1 + 3 * (polygons[i] || 0))
			chances[i] = l
			total += l
			k *= 0.05
		}
		let int = Math.random() * total
		let current = 0
		let sides = 3
		for (let i in chances) {
			current += chances[i]
			if (int < current) {
				sides = parseInt(i)
				break
			}
		}
		let m = sides >= 3 ? 1 + (sides - 3) * 0.1 : 1 - (sides + 1) * 0.1
		generator.polygon({
			x: ((Math.random() < 0.5 ? 1 : -1) * (Math.pow(Math.random(), m))) * dim.mapSize,
			y: ((Math.random() < 0.5 ? 1 : -1) * (Math.pow(Math.random(), m))) * dim.mapSize,
			d: 2 * Math.PI * Math.random(),
			sides: sides,
			dim: dim,
			radiant: radiant,
		})
	}
	for (let name in dimension.dims) {
		for (let i = 0; i < 10; i++) {
			ggg(dimension.dims[name])
		}
	}

	return { game, dimension, packer, clients, generator, Detector, server }
})()