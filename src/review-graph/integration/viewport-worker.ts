import {contains, viewportBounds} from '../ui/scene-index.ts';
import type {SceneSnapshotUI, SceneSelectionUI, ViewportQueryUI, SceneWorkerInputUI, SceneWorkerOutputUI} from '../ui/types.ts';

export type SceneWorkerPort = Readonly<{
    postMessage: (message: SceneWorkerInputUI) => void;
    addEventListener: (type: 'message' | 'error' | 'messageerror', listener: (event: MessageEvent<SceneWorkerOutputUI>) => void) => void;
    removeEventListener: (type: 'message' | 'error' | 'messageerror', listener: (event: MessageEvent<SceneWorkerOutputUI>) => void) => void;
    terminate: () => void;
}>;
type Pending = SceneWorkerInputUI;
const sameScene = (a: {comparison: string; revision: number}, b: {comparison: string; revision: number}) => a.comparison === b.comparison && a.revision === b.revision;
const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

/** One in-flight message, one newest replacement/query. Camera never waits on this owner. */
export const createViewportWorker = (
    createPort: () => SceneWorkerPort,
    publish: (selection: SceneSelectionUI | null) => void,
    timeoutMs = 2000,
) => {
    let port: SceneWorkerPort | undefined, disposed = false, failed = false;
    let scene: SceneSnapshotUI | undefined, loaded: SceneSnapshotUI | undefined;
    let query: ViewportQueryUI | undefined, pending: Pending | undefined;
    let selection: SceneSelectionUI | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {if (timer !== undefined) clearTimeout(timer); timer = undefined;};
    const emit = (value: SceneSelectionUI | null) => {
        if (selection === value) return;
        if (value && selection && sameScene(value, selection) && sameIds(value.nodeIds, selection.nodeIds) && sameIds(value.routeIds, selection.routeIds) && sameIds(value.metadataNodeIds, selection.metadataNodeIds)) {
            // Preserve the published membership reference while advancing private coverage.
            selection = value; return;
        }
        selection = value; publish(value);
    };
    const detach = () => {
        clear();
        if (!port) return;
        port.removeEventListener('message', receive); port.removeEventListener('error', fail); port.removeEventListener('messageerror', fail);
        port.terminate(); port = undefined;
    };
    const fail = () => {failed = true; pending = undefined; loaded = undefined; detach(); emit(null);};
    const pump = () => {
        if (!port || disposed || failed || pending || !scene) return;
        let next: Pending | undefined;
        if (!loaded || !sameScene(loaded, scene)) next = {type: 'replace', scene};
        else if (query) next = {type: 'query', query};
        if (!next) return;
        pending = next;
        timer = setTimeout(fail, timeoutMs);
        try {port.postMessage(next);} catch {fail();}
    };
    const receive = (event: MessageEvent<SceneWorkerOutputUI>) => {
        if (disposed || failed || !pending) return;
        const message = event.data;
        if (message.type === 'error') {fail(); return;}
        const sent = pending;
        // Unsolicited/late replies do not release an unrelated in-flight slot.
        if (message.type === 'ready') {
            if (sent.type !== 'replace' || !sameScene(message, sent.scene)) return;
            loaded = sent.scene;
        } else {
            if (sent.type !== 'query' || !sameScene(message.selection, sent.query) || message.selection.request !== sent.query.request) return;
            if (scene && query && sameScene(message.selection, scene) && message.selection.request === query.request) emit(message.selection);
            if (query?.request === sent.query.request) query = undefined;
        }
        clear(); pending = undefined; pump();
    };
    try {
        port = createPort();
        port.addEventListener('message', receive); port.addEventListener('error', fail); port.addEventListener('messageerror', fail);
    } catch {fail();}
    return {
        replace: (next: SceneSnapshotUI) => {
            if (disposed || failed) return;
            scene = next; query = undefined; emit(null); pump();
        },
        suspend: () => {if (disposed) return; scene = undefined; query = undefined; emit(null);},
        query: (next: ViewportQueryUI) => {
            if (disposed || failed || !scene || !sameScene(next, scene)) return;
            try {
                const coverage = viewportBounds(next, 0);
                if (selection && (!contains(selection.coverage, coverage) || !next.pinnedNodes.every(id => selection!.nodeIds.includes(id)) || !next.pinnedRoutes.every(id => selection!.routeIds.includes(id)))) emit(null);
            } catch {fail(); return;}
            query = next; pump();
        },
        dispose: () => {if (disposed) return; disposed = true; scene = undefined; query = undefined; pending = undefined; detach(); selection = null;},
    };
};

export const browserSceneWorker = (): SceneWorkerPort =>
    new Worker(new URL('../ui/scene.worker.ts', import.meta.url), {type: 'module'}) as unknown as SceneWorkerPort;
