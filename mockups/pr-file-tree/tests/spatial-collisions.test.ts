import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { boxCollisions, pointCollisions } from '../spatial-collisions.ts';
import { automaticRoutes } from '../graph-geometry.ts';

test('box queries preserve strict boundaries, negative cells and cross-cell uniqueness', () => {
    const boxes = boxCollisions();
    boxes.add({ x: -300, y: -100, width: 600, height: 200 });
    boxes.add({ x: 250, y: 0, width: 100, height: 100 });
    assert.equal(boxes.countOverlaps({ x: -400, y: -200, width: 800, height: 400 }), 2);
    assert.equal(boxes.countOverlaps({ x: 350, y: 0, width: 40, height: 40 }), 0);
    assert.equal(boxes.containsPoint({ x: -300, y: 0 }), false);
    assert.equal(boxes.containsPoint({ x: -299, y: 0 }), true);
    assert.equal(boxes.containsPoint({ x: 350, y: 100 }), false);
});

test('point queries retain duplicates, strict bounds and incremental insertion', () => {
    const points = pointCollisions();
    for (const point of [{ x: -1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: 0 }, { x: 200, y: 200 }])
        points.add(point);
    assert.equal(points.countInside({ x: -200, y: -200, width: 200, height: 200 }), 2);
    assert.equal(points.countInside({ x: -1, y: -1, width: 201, height: 201 }), 1);
    points.add({ x: 199, y: 199 });
    assert.equal(points.countInside({ x: -1, y: -1, width: 201, height: 201 }), 2);
});

test('indexed router preserves the frozen dense collision layout exactly', () => {
    const nodes = Array.from({ length: 16 }, (_, i) => ({ id: 'n' + i, position: { x: (i % 4) * 360 - 400, y: Math.floor(i / 4) * 160 - 200 }, measured: { width: 180, height: 80 } }));
    const links = Array.from({ length: 24 }, (_, i) => ({ id: 'e' + i, source: 'n' + (i % 16), target: 'n' + ((i * 7 + 5) % 16) }));
    const result = JSON.stringify([...automaticRoutes(nodes, links, {}, {}).entries()]);
    assert.equal(createHash('sha256').update(result).digest('hex'), '35d51a0061af8e716b74d24bb8288e7db37800e8b37073a319218a1ffc02e059');
});
