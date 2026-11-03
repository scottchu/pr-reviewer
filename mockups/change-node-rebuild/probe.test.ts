import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startBaselineProbe, type BaselineSample} from './probe.ts';

const fixture = () => {
    let now = 0;
    let next = 0;
    const jobs = new Map<number, () => void>();
    const samples: BaselineSample[] = [];
    const probe = startBaselineProbe({now: () => now, schedule: callback => {jobs.set(++next, callback); return next;}, cancel: id => {jobs.delete(id);}}, sample => samples.push(sample));
    const advance = (time: number) => {now = time; const callbacks = [...jobs.values()]; jobs.clear(); callbacks.forEach(callback => callback());};
    return {probe, samples, jobs, advance};
};

test('baseline reports elapsed execution through30 seconds then stops with finite work', () => {
    const {samples, jobs, advance} = fixture();
    assert.equal(samples[0]?.status, 'running');
    for (let time = 2000; time <= 30000; time += 2000) advance(time);
    assert.equal(samples.length, 16);
    assert.deepEqual(samples.at(-1), {status: 'elapsed', elapsed: 30000});
    assert.equal(jobs.size, 0);
    advance(60000);
    assert.equal(samples.length, 16);
});

test('failure cancels pending work and cannot be overwritten by a stale callback', () => {
    const {probe, samples, jobs} = fixture();
    const stale = [...jobs.values()][0]!;
    probe.fail(); stale(); probe.fail();
    assert.equal(jobs.size, 0);
    assert.deepEqual(samples.at(-1), {status: 'error', elapsed: 0});
    assert.equal(samples.length, 2);
});

test('disposal prevents pending callbacks and a delayed timer reports elapsed only', () => {
    const first = fixture();
    const stale = [...first.jobs.values()][0]!;
    first.probe.dispose(); stale(); first.probe.fail();
    assert.equal(first.samples.length, 1);
    const second = fixture(); second.advance(60000);
    assert.deepEqual(second.samples.at(-1), {status: 'elapsed', elapsed: 60000});
    assert.equal(second.jobs.size, 0);
});
