import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {GraphFilterUI} from '../types.ts';
import {clampToolbarPosition, dragToolbarPosition, toolbarArrowPosition, type ToolbarDragUI, type ToolbarPointUI} from '../toolbar-position.ts';

export const GraphToolbar = ({filter, onToggle}: {filter: Pick<GraphFilterUI, 'changesOnly'>; onToggle: () => void}) => {
    const layer = useRef<HTMLDivElement>(null), toolbar = useRef<HTMLDivElement>(null), grip = useRef<HTMLButtonElement>(null);
    const drag = useRef<ToolbarDragUI | null>(null);
    const [position, setPosition] = useState<ToolbarPointUI | null>(null);
    const [dragging, setDragging] = useState(false);
    const geometry = useCallback(() => {
        if (!layer.current || !toolbar.current) return null;
        const frame = layer.current.getBoundingClientRect(), box = toolbar.current.getBoundingClientRect();
        return {point: {x: box.left - frame.left, y: box.top - frame.top}, bounds: {width: frame.width, height: frame.height, toolbarWidth: box.width, toolbarHeight: box.height}};
    }, []);
    const finish = useCallback((notify = true) => {
        const active = drag.current;
        drag.current = null;
        if (!active) return;
        if (grip.current?.hasPointerCapture(active.pointerId)) grip.current.releasePointerCapture(active.pointerId);
        if (notify) setDragging(false);
    }, []);
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            finish();
            const measured = geometry();
            if (!measured) return;
            setPosition(previous => {
                if (!previous) return previous;
                const next = clampToolbarPosition(previous, measured.bounds);
                return next.x === previous.x && next.y === previous.y ? previous : next;
            });
        });
        if (layer.current) observer.observe(layer.current);
        if (toolbar.current) observer.observe(toolbar.current);
        return () => {observer.disconnect(); finish(false);};
    }, [finish, geometry]);
    const end = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        event.stopPropagation(); finish();
    };
    return <div ref={layer} className="minimal-toolbar-layer">
        <div ref={toolbar} className="minimal-graph-toolbar nodrag nopan nowheel" role="toolbar" aria-label="Graph view"
            style={position ? {left: 0, top: 0, bottom: 'auto', transform: 'translate(' + position.x + 'px, ' + position.y + 'px)'} : undefined}
            onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
            onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
            <button ref={grip} type="button" className="toolbar-grip" aria-label="Move toolbar"
                title="Move toolbar · Arrow keys to reposition" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
                data-dragging={dragging}
                onPointerDown={event => {
                    if (event.button !== 0 || !event.isPrimary || drag.current) return;
                    const measured = geometry(); if (!measured) return;
                    event.preventDefault(); event.stopPropagation(); event.currentTarget.focus({preventScroll: true});
                    const origin = clampToolbarPosition(measured.point, measured.bounds);
                    drag.current = {pointerId: event.pointerId, pointer: {x: event.clientX, y: event.clientY}, origin};
                    setPosition(origin); setDragging(true); event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={event => {
                    const active = drag.current;
                    if (!active || active.pointerId !== event.pointerId) return;
                    const measured = geometry(); if (!measured) return;
                    event.preventDefault(); event.stopPropagation();
                    setPosition(dragToolbarPosition(active, {x: event.clientX, y: event.clientY}, measured.bounds));
                }}
                onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
                onKeyDown={event => {
                    const measured = geometry(); if (!measured) return;
                    const next = toolbarArrowPosition(measured.point, event.key, measured.bounds);
                    if (!next) return;
                    event.preventDefault(); event.stopPropagation(); finish(); setPosition(next);
                }}>
                <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
                    {[6, 10, 14].flatMap(y => [7, 13].map(x => <circle key={x + ':' + y} cx={x} cy={y} r="1.3"/>))}
                </svg>
            </button>
            <button type="button" aria-label="Changes only" title="Changes only" aria-pressed={filter.changesOnly} onClick={onToggle}>
                <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5h14M5.5 10h9M8 15h4"/>
                </svg>
            </button>
        </div>
    </div>;
};
