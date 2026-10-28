import test from 'node:test';
import assert from 'node:assert/strict';
import { directFileCallRoute } from '../file-call-route.ts';

test('direct calls adapt sides and retain one continuous path between file boundaries', () => {
  const target = { x: 760, y: 0, width: 160, height: 26 };
  const review = directFileCallRoute({ x: 370, y: 100, width: 117, height: 26 }, target, 0, 1, 0, 4, false);
  assert.deepEqual(review.start, { x: 487, y: 113 });
  assert.deepEqual(review.end, { x: 760, y: 13 });
  const analysis = directFileCallRoute({ x: 0, y: 326, width: 132, height: 26 }, target, 0, 1, 1, 4, false);
  assert.equal(analysis.end.y, 26);
  assert.equal((analysis.path.match(/M/g) ?? []).length, 1);
  assert.ok(!analysis.path.includes('H'));
});
test('crowded call routes have distinct boundary points and paths at both collapsed and expanded sizes', () => {
  for (const narrow of [false, true]) for (const width of [132, narrow ? 324 : 760]) {
    const source = { x: 0, y: 300, width, height: width === 132 ? 26 : 480 };
    const target = { x: width + 80, y: 0, width: 160, height: 26 };
    const routes = Array.from({ length: 6 }, (_, index) => directFileCallRoute(source, target, index, 6, index, 11, narrow));
    assert.equal(new Set(routes.map(route => JSON.stringify(route.start))).size, 6);
    assert.equal(new Set(routes.map(route => JSON.stringify(route.end))).size, 6);
    assert.equal(new Set(routes.map(route => route.path)).size, 6);
    for (const route of routes) { assert.equal(route.start.y, source.y + source.height); assert.equal(route.end.y, target.y + target.height); }
  }
});
