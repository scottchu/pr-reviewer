import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMeasurementScheduler, observeGeometry} from '../../../src/review-graph/ui/geometry-observer.ts';

test('measurement coalesces a delivery batch and cancels stale callbacks after disposal', () => {
    const callbacks = new Map<number, () => void>();
    let sequence = 0;
    let calls = 0;
    const scheduler = createMeasurementScheduler(() => calls++, {
        request: callback => {callbacks.set(++sequence, callback); return sequence;},
        cancel: id => {callbacks.delete(id);},
    });
    for (let index = 0; index < 100; index++) scheduler.schedule();
    assert.equal(calls, 0);
    assert.equal(callbacks.size, 1);
    callbacks.get(1)!();
    assert.equal(calls, 1);
    scheduler.schedule();
    const stale = callbacks.get(2)!;
    scheduler.dispose();
    stale();
    scheduler.schedule();
    assert.equal(calls, 1);
    assert.equal(sequence, 2);
});

test('observer initializes once and defers resize delivery, ignoring disconnected and disposed targets', () => {
    const original = {ResizeObserver: globalThis.ResizeObserver, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame};
    let callback: () => void = () => {};
    let frame: () => void = () => {};
    let calls = 0;
    let disconnected = false;
    Object.assign(globalThis, {
        ResizeObserver: class {constructor(next: () => void) {callback = next;} observe() {} disconnect() {disconnected = true;}},
        requestAnimationFrame: (next: () => void) => {frame = next; return 1;},
        cancelAnimationFrame: () => {},
    });
    try {
        const element = {isConnected: true} as HTMLElement;
        const dispose = observeGeometry([element], () => calls++);
        assert.equal(calls, 1);
        callback(); callback();
        assert.equal(calls, 1);
        frame();
        assert.equal(calls, 2);
        callback();
        Object.assign(element, {isConnected: false});
        frame();
        assert.equal(calls, 2);
        callback(); dispose(); frame();
        assert.equal(calls, 2);
        assert.equal(disconnected, true);
    } finally {Object.assign(globalThis, original);}
});
