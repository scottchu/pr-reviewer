import React, { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type Offset = { x: number; y: number };
export const WorkspaceActions = ({ children, blocked }: { children: ReactNode; blocked: boolean }) => {
  const element = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const drag = useRef<{ pointer: Offset; origin: Offset } | null>(null);
  useLayoutEffect(() => {
    const surface = element.current;
    if (!surface) return;
    const measure = () => document.documentElement.style.setProperty('--workspace-actions-height', `${surface.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--workspace-actions-height'); };
  }, []);
  useLayoutEffect(() => {
    const clampOnResize = () => {
      if (window.innerWidth < 650) return;
      const rect = element.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = rect.left < 8 ? 8 - rect.left : rect.right > window.innerWidth - 8 ? window.innerWidth - 8 - rect.right : 0;
      const dy = rect.top < 8 ? 8 - rect.top : rect.bottom > window.innerHeight - 8 ? window.innerHeight - 8 - rect.bottom : 0;
      if (dx || dy) setOffset(current => ({ x: current.x + dx, y: current.y + dy }));
    };
    window.addEventListener('resize', clampOnResize);
    return () => window.removeEventListener('resize', clampOnResize);
  }, []);
  const move = (next: Offset) => {
    const rect = element.current?.getBoundingClientRect();
    if (!rect) return;
    setOffset({
      x: Math.max(offset.x + 8 - rect.left, Math.min(offset.x + window.innerWidth - 8 - rect.right, next.x)),
      y: Math.max(offset.y + 8 - rect.top, Math.min(offset.y + window.innerHeight - 8 - rect.bottom, next.y)),
    });
  };
  return <nav ref={element} className={`workspace-actions${blocked ? ' workspace-actions-blocked' : ''}`} aria-label="Workspace actions" inert={blocked ? true : undefined}
    style={{ transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)` }}>
    <button className="workspace-action-grip" aria-label="Move workspace controls" title="Drag controls; arrow keys move, Home resets"
      onPointerDown={event => {
        if (window.innerWidth < 650) return;
        drag.current = { pointer: { x: event.clientX, y: event.clientY }, origin: offset };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const current = drag.current;
        if (current) move({ x: current.origin.x + event.clientX - current.pointer.x, y: current.origin.y + event.clientY - current.pointer.y });
      }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={event => {
        if (event.key === 'Home') { event.preventDefault(); setOffset({ x: 0, y: 0 }); return; }
        const delta: Record<string, Offset> = { ArrowLeft: { x: -20, y: 0 }, ArrowRight: { x: 20, y: 0 }, ArrowUp: { x: 0, y: -20 }, ArrowDown: { x: 0, y: 20 } };
        const change = delta[event.key];
        if (change) { event.preventDefault(); event.stopPropagation(); move({ x: offset.x + change.x, y: offset.y + change.y }); }
      }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="5" cy="4" r="1"/><circle cx="11" cy="4" r="1"/><circle cx="5" cy="8" r="1"/><circle cx="11" cy="8" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="11" cy="12" r="1"/></svg>
    </button>
    {children}
  </nav>;
};
