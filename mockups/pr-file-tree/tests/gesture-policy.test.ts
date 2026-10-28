import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beginsRouteDrag, keyboardDelta, movedNodePosition } from '../gesture-policy.ts';

test('touch strokes and label bodies pan; the designated label handle alone owns touch bending', () => {
    assert.equal(beginsRouteDrag('touch', false, true), false);
    assert.equal(beginsRouteDrag('touch', true, true), false);
    assert.equal(beginsRouteDrag('touch', false, false), false);
    assert.equal(beginsRouteDrag('touch', true, false), true);
    assert.equal(beginsRouteDrag('mouse', false, true), true);
    assert.equal(beginsRouteDrag('mouse', false, false), true);
    assert.deepEqual(keyboardDelta('ArrowDown'), { x: 0, y: 10 });
    assert.equal(keyboardDelta('Enter'), undefined);
});


test('explicit node handles preserve parent bounds and immutable gesture origins', () => {
    const nodes = [{ id: 'group', position: { x: 10, y: 10 }, style: { width: 800, height: 500 } }, { id: 'child', parentId: 'group', position: { x: 50, y: 50 }, measured: { width: 300, height: 100 } }];
    assert.deepEqual(movedNodePosition(nodes, 'child', { x: 900, y: -100 }), { x: 480, y: 80 });
    assert.deepEqual(movedNodePosition(nodes, 'group', { x: -100, y: 20 }), { x: -90, y: 30 });
    assert.deepEqual(nodes[1]!.position, { x: 50, y: 50 });
    assert.equal(movedNodePosition(nodes, 'missing', { x: 10, y: 10 }), undefined);
});
