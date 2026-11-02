import React from 'react';
import {createRoot} from 'react-dom/client';
import {ChangeCard} from './ChangeCard.tsx';
import {startBaselineProbe} from './probe.ts';
import './style.css';

let sequence = 0;
let failures = 0;
const report = (stage: 'module' | 'mounted' | 'heartbeat' | 'error' | 'rejection', message?: string) => {
    if (sequence >= 24) return;
    const value = {stage, revision: 2, sequence: ++sequence, elapsed: Math.round(performance.now()), elements: document.getElementsByTagName('*').length,
        ...(message === undefined ? {} : {message: message.slice(0, 300)})};
    navigator.sendBeacon(new URL('./__preview-diagnostics', document.baseURI), new Blob([JSON.stringify(value)], {type: 'application/json'}));
};
const status = document.getElementById('status');
const host = document.getElementById('card-root');
if (!status || !host) throw new Error('stage2_markup_missing');
report('module');
const probe = startBaselineProbe({now: () => performance.now(), schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: id => window.clearTimeout(id)}, sample => {
    status.textContent = sample.status === 'error' ? 'A script error was captured. This stage failed.' :
        sample.status === 'elapsed' ? '30 seconds elapsed. Visual and device acceptance remain separate.' :
        `Shared diff running: ${Math.floor(sample.elapsed / 1000)} / 30 seconds`;
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
const root = createRoot(host, {
    onUncaughtError: error => fail('error', error instanceof Error ? error.message : 'React root error'),
    onCaughtError: error => fail('error', error instanceof Error ? error.message : 'React caught error'),
    onRecoverableError: error => fail('error', error instanceof Error ? error.message : 'React recoverable error'),
});
root.render(React.createElement(ChangeCard, {onMounted: () => report('mounted')}));
