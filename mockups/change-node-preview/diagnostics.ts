export type PreviewDiagnostic = Readonly<{stage: string; [key: string]: string | number}>;
let sequence = 0;
const maximum = 64;
const counts = new Map<string, number>();
/** Same-origin, bounded diagnostic events for this isolated preview; never source/user data. */
export const reportPreviewDiagnostic = (value: PreviewDiagnostic): void => {
    if (sequence >= maximum) return;
    const count = (counts.get(value.stage) ?? 0) + 1; counts.set(value.stage, count);
    if (['layout', 'header', 'reflow', 'selection'].includes(value.stage) && (count > 128 || (count & (count - 1)) !== 0)) return;
    if (['error', 'rejection'].includes(value.stage) && count > 2) return;
    const event = {...value, stageCount: count, sequence: ++sequence, elapsed: Math.round(performance.now())};
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
