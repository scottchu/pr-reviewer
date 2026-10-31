import {startBaselineProbe} from './probe.ts';
import './style.css';

let sequence = 0;
let failures = 0;
const report = (stage: 'module' | 'heartbeat' | 'error' | 'rejection', message?: string) => {
    if (sequence >= 24) return;
    const value = {stage, revision: 0, sequence: ++sequence, elapsed: Math.round(performance.now()), elements: document.getElementsByTagName('*').length,
        ...(message === undefined ? {} : {message: message.slice(0, 300)})};
    navigator.sendBeacon(new URL('./__preview-diagnostics', document.baseURI), new Blob([JSON.stringify(value)], {type: 'application/json'}));
};
const status = document.getElementById('status');
const response = document.getElementById('response');
const taps = document.getElementById('taps');
if (!status || !response || !taps) throw new Error('baseline_markup_missing');
report('module');
const probe = startBaselineProbe({now: () => performance.now(), schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: id => window.clearTimeout(id)}, sample => {
    status.textContent = sample.status === 'error' ? 'A script error was captured. This stage failed.' :
        sample.status === 'elapsed' ? '30 seconds elapsed. Visual and device acceptance remain separate.' :
        `Baseline running: ${Math.floor(sample.elapsed / 1000)} / 30 seconds`;
    if (sample.status !== 'error') report('heartbeat');
});
const fail = (stage: 'error' | 'rejection', message: string) => {
    if (++failures > 2) return;
    probe.fail();
    status.textContent = 'A script error was captured. This stage failed.';
    report(stage, message);
};
window.addEventListener('error', event => fail('error', event.message));
window.addEventListener('unhandledrejection', event => fail('rejection', event.reason instanceof Error ? event.reason.message : 'unhandled rejection'));
window.addEventListener('pagehide', () => probe.dispose(), {once: true});
let responses = 0;
response.addEventListener('click', () => {taps.textContent = `Tap responses: ${++responses}`;});
