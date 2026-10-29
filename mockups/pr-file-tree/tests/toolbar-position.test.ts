import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampToolbarPosition, dragToolbarPosition, toolbarArrowPosition} from '../../../src/review-graph/ui/toolbar-position.ts';

const bounds = {width: 366, height: 650, toolbarWidth: 102, toolbarHeight: 54};
test('toolbar drag uses CSS deltas and stays inside the safe-area layer', () => {
    const drag = {pointerId: 3, pointer: {x: 220, y: 620}, origin: {x: 132, y: 596}};
    assert.deepEqual(dragToolbarPosition(drag, {x: 180.5, y: 560.25}, bounds), {x: 92.5, y: 536.25});
    assert.deepEqual(dragToolbarPosition(drag, {x: -1000, y: -1000}, bounds), {x: 0, y: 0});
    assert.deepEqual(dragToolbarPosition(drag, {x: 2000, y: 2000}, bounds), {x: 264, y: 596});
    assert.deepEqual(drag.origin, {x: 132, y: 596});
});
test('resize clamps saved position and tiny/nonfinite bounds remain safe', () => {
    assert.deepEqual(clampToolbarPosition({x: 700, y: 600}, bounds), {x: 264, y: 596});
    assert.deepEqual(clampToolbarPosition({x: 150, y: 100}, {...bounds, width: 80, height: 40}), {x: 0, y: 0});
    assert.deepEqual(clampToolbarPosition({x: NaN, y: Infinity}, bounds), {x: 0, y: 0});
});
test('grip keyboard movement is bounded and unrelated keys do not move it', () => {
    assert.deepEqual(toolbarArrowPosition({x: 100, y: 100}, 'ArrowRight', bounds), {x: 110, y: 100});
    assert.deepEqual(toolbarArrowPosition({x: 100, y: 100}, 'ArrowUp', bounds), {x: 100, y: 90});
    assert.deepEqual(toolbarArrowPosition({x: 0, y: 0}, 'ArrowLeft', bounds), {x: 0, y: 0});
    assert.equal(toolbarArrowPosition({x: 100, y: 100}, 'Enter', bounds), null);
    assert.equal(toolbarArrowPosition({x: 100, y: 100}, 'toString', bounds), null);
});
