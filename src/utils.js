export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const inSquare = ([x1, y1], [x2, y2], d) => Math.abs(x1 - x2) <= d && Math.abs(y1 - y2) <= d;