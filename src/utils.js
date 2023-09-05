export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const inSquare = ([x1, y1], [x2, y2], d) => Math.abs(x1 - x2) <= d && Math.abs(y1 - y2) <= d;

export const buf2hex = buffer =>
	[...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, '0'))
		.join('');