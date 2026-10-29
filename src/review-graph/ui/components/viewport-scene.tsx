import {useEffect, useLayoutEffect, useRef} from 'react';
import {useOnViewportChange, useReactFlow} from '@xyflow/react';
import {browserSceneWorker, createViewportWorker} from '../../integration/viewport-worker.ts';
import type {SceneSnapshotUI, SceneSelectionUI} from '../types.ts';
import type {ScenePinsUI} from '../scene-membership.ts';
/** Open native details are pinned too: their disclosure and scroll state stay mounted. */
export const currentScenePins = (root: HTMLElement): ScenePinsUI => {
    const nodes = new Set<string>(), routes = new Set<string>();
    const collect = (element: Element | null) => {
        const node = element?.closest<HTMLElement>('.react-flow__node[data-id]')?.dataset.id;
        const route = element?.closest<HTMLElement>('[data-edge-id],[data-route-id]');
        if (node) nodes.add(node);
        const id = route?.dataset.edgeId ?? route?.dataset.routeId;
        if (id) routes.add(id);
    };
    if (root.contains(document.activeElement)) collect(document.activeElement);
    for (const details of root.querySelectorAll('details[open]')) collect(details);
    return {nodes: [...nodes].sort(), routes: [...routes].sort()};
};
export const ViewportScene = ({scene, publish, pinsChanged}: {
    scene: SceneSnapshotUI | null;
    publish: (selection: SceneSelectionUI | null) => void;
    pinsChanged: (pins: ScenePinsUI) => void;
}) => {
    const {getViewport} = useReactFlow();
    const bridge = useRef<ReturnType<typeof createViewportWorker> | null>(null);
    const activeScene = useRef(scene), request = useRef(0);
    const callbacks = useRef({publish, pinsChanged});
    callbacks.current = {publish, pinsChanged};
    const root = useRef<HTMLElement | null>(null);
    const livePins = useRef<ScenePinsUI>({nodes: [], routes: []});
    const query = () => {
        const snapshot = activeScene.current, element = root.current;
        if (!snapshot || !element) return;
        const pins = livePins.current;
        bridge.current?.query({comparison: snapshot.comparison, revision: snapshot.revision, ...getViewport(), request: ++request.current,
            width: element.clientWidth, height: element.clientHeight, pixelRatio: window.devicePixelRatio || 1,
            overscan: 240, pinnedNodes: pins.nodes, pinnedRoutes: pins.routes});
    };
    const latestQuery = useRef(query); latestQuery.current = query;
    useOnViewportChange({onChange: () => latestQuery.current()});
    useEffect(() => {
        const element = document.querySelector<HTMLElement>('main[aria-label="PR25 source comparison graph"] .react-flow');
        if (!element) return;
        root.current = element;
        const owner = createViewportWorker(browserSceneWorker, selection => {
            // Apply the current pin union again at acceptance, even if native focus changed
            // while the old request was in flight. No domain/DOM object crosses the wire.
            const pins = currentScenePins(element);
            livePins.current = pins;
            callbacks.current.pinsChanged(pins);
            callbacks.current.publish(selection ? {...selection, nodeIds: [...new Set([...selection.nodeIds, ...pins.nodes])], routeIds: [...new Set([...selection.routeIds, ...pins.routes])]} : null);
        });
        bridge.current = owner;
        if (activeScene.current) {owner.replace(activeScene.current); latestQuery.current();}
        const pins = () => {livePins.current = currentScenePins(element); callbacks.current.pinsChanged(livePins.current); latestQuery.current();};
        element.addEventListener('toggle', pins, true); element.addEventListener('focusin', pins); element.addEventListener('focusout', pins);
        const observer = new ResizeObserver(() => latestQuery.current()); observer.observe(element);
        return () => {
            observer.disconnect(); element.removeEventListener('toggle', pins, true); element.removeEventListener('focusin', pins); element.removeEventListener('focusout', pins);
            owner.dispose(); bridge.current = null; root.current = null;
        };
    }, []);
    useLayoutEffect(() => {
        activeScene.current = scene;
        if (scene) {bridge.current?.replace(scene); latestQuery.current();}
        else bridge.current?.suspend();
    }, [scene]);
    return null;
};
