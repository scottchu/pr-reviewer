export type PreviewDiagnostic = Readonly<{stage: string; [key: string]: string | number}>;
let sequence = 0;
const maximum = 40;
/** Same-origin, bounded diagnostic events for this isolated preview; never source/user data. */
export const reportPreviewDiagnostic = (value: PreviewDiagnostic): void => {
    if (sequence >= maximum) return;
    const event = {...value, sequence: ++sequence, elapsed: Math.round(performance.now())};
    const endpoint = new URL('./__preview-diagnostics', document.baseURI);
    const body = new Blob([JSON.stringify(event)], {type: 'application/json'});
    navigator.sendBeacon(endpoint, body);
};
reportPreviewDiagnostic({stage: 'module'});
window.addEventListener('error', event => reportPreviewDiagnostic({stage: 'error', message: String(event.message).slice(0, 300)}));
window.addEventListener('unhandledrejection', event => reportPreviewDiagnostic({stage: 'rejection', message: String(event.reason instanceof Error ? event.reason.message : 'unhandled rejection').slice(0, 300)}));
let beats = 0;
const heartbeat = window.setInterval(() => {
    reportPreviewDiagnostic({stage: 'heartbeat', elements: document.getElementsByTagName('*').length});
    if (++beats >= 5) window.clearInterval(heartbeat);
}, 1500);
