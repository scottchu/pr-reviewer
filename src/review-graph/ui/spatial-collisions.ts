import type { Box, Point } from './graph-geometry.ts';

const cellSize = 240;
const key = (x: number, y: number) => x + ':' + y;
const cell = (value: number) => Math.floor(value / cellSize);
const inside = (box: Box, point: Point) => point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height;
const overlap = (a: Box, b: Box) => Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);

export const boxCollisions = () => {
    const cells = new Map<string, Box[]>();
    const add = (box: Box) => {
        for (let x = cell(box.x); x <= cell(box.x + box.width); x++)
            for (let y = cell(box.y); y <= cell(box.y + box.height); y++) {
                const address = key(x, y);
                const entries = cells.get(address);
                if (entries) entries.push(box);
                else cells.set(address, [box]);
            }
    };
    const containsPoint = (point: Point) => {
        for (const box of cells.get(key(cell(point.x), cell(point.y))) ?? [])
            if (inside(box, point)) return true;
        return false;
    };
    const countOverlaps = (query: Box) => {
        const seen = new Set<Box>();
        let count = 0;
        for (let x = cell(query.x); x <= cell(query.x + query.width); x++)
            for (let y = cell(query.y); y <= cell(query.y + query.height); y++)
                for (const box of cells.get(key(x, y)) ?? [])
                    if (!seen.has(box)) {
                        seen.add(box);
                        if (overlap(box, query)) count++;
                    }
        return count;
    };
    return { add, containsPoint, countOverlaps };
};

export const pointCollisions = () => {
    const cells = new Map<string, Point[]>();
    const add = (point: Point) => {
        const address = key(cell(point.x), cell(point.y));
        const entries = cells.get(address);
        if (entries) entries.push(point);
        else cells.set(address, [point]);
    };
    const countInside = (box: Box) => {
        let count = 0;
        for (let x = cell(box.x); x <= cell(box.x + box.width); x++)
            for (let y = cell(box.y); y <= cell(box.y + box.height); y++)
                for (const point of cells.get(key(x, y)) ?? [])
                    if (inside(box, point)) count++;
        return count;
    };
    return { add, countInside };
};
