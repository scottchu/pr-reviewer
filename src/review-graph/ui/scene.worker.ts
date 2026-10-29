import {createSceneIndex} from './scene-index.ts';
import type {SceneWorkerInputUI, SceneWorkerOutputUI} from './types.ts';

// Deliberately narrow worker global: this entry also typechecks under the owning DOM build.
const scope = globalThis as unknown as {
    onmessage: ((event: MessageEvent<SceneWorkerInputUI>) => void) | null;
    postMessage: (message: SceneWorkerOutputUI) => void;
};
let index: ReturnType<typeof createSceneIndex> | undefined;
scope.onmessage = event => {
    try {
        if (event.data.type === 'replace') {
            index = createSceneIndex(event.data.scene);
            scope.postMessage({type: 'ready', comparison: event.data.scene.comparison, revision: event.data.scene.revision});
        } else {
            if (!index) throw new Error('Scene not initialized');
            scope.postMessage({type: 'selection', selection: index.query(event.data.query)});
        }
    } catch (error) {
        index = undefined;
        scope.postMessage({type: 'error', message: error instanceof Error ? error.message : 'Scene worker failed'});
    }
};
