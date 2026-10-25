import React, { useRef, useState, useLayoutEffect, useMemo, useEffect } from 'react';
import type { FileReading, ReadingFocus } from './reading.ts';
import diffs from './diffs.json' with { type: 'json' };
import fullSource from './full-source.json' with { type: 'json' };
import functionContext from './function-context.json' with { type: 'json' };
import { rowCoordinates } from './coordinates.ts';
import { splitRows } from './change-rail.ts';
import { continuousSegments, scopeTestSegments, visibleHunk, type SourceRow } from './continuous.ts';
export type FileDiff = typeof diffs.files[number];
export type DiffMode = 'unified' | 'split';
export type SourceRelation = {
  file: FileDiff;
  index: number;
  side: 'before' | 'after';
};
export const fileDiffs = new Map(diffs.files.map(file => [
  file.path, file
]));
const SourceLine = ({ row, side, mode }: {
  row: SourceRow | null;
  side: 'before' | 'after';
  mode: DiffMode;
}) => <span
  className={`diff-line ${row?.kind ?? 'blank'}`}
  data-line={row ? (side === 'before' ? row.beforeLine : row.afterLine) ?? '' : ''}
  data-mark={row?.kind === 'removed' ? '−' : row?.kind === 'added' ? '+' : ' '}
  data-source-text={row?.text ?? ''}
  data-before-line={row?.beforeLine ?? undefined}
  data-after-line={row?.afterLine ?? undefined}
>

    {mode === 'unified' && row && <span
      className="unified-gutter"
      role="img"
      aria-label={rowCoordinates(row).label}
    >

      <span
        className="before-number"
        aria-hidden="true"
      >

        {rowCoordinates(row).before}

      </span>

      <span
        className="after-number"
        aria-hidden="true"
      >

        {rowCoordinates(row).after}

      </span>

      <span
        className="change-glyph"
        aria-hidden="true"
      >

        {rowCoordinates(row).mark}

      </span>

    </span>}

    {row?.text ?? ''}

  </span>;
export const FileDiffBody = ({ file, mode, fullscreen, width, onExplain, activeRelation, reading, onReading, restoreVersion, focus, onCalls }: {
  file: FileDiff;
  mode: DiffMode;
  fullscreen: boolean;
  width: number;
  onExplain: (relation: SourceRelation) => void;
  activeRelation: SourceRelation | null;
  reading: FileReading | undefined;
  onReading: (value: FileReading) => void;
  restoreVersion: number;
  focus?: ReadingFocus | undefined;
  onCalls?: (() => void) | undefined;
}) => {
  const source = fullSource.files.find(s => s.path === file.path)!;
  const segments = useMemo(() => {
    const required = functionContext.files.find(context => context.path === file.path);
    const result = continuousSegments(file, source, {
      before: [
        ...(required?.before ?? []), ...(focus?.before ?? [])
      ],
      after: [
        ...(required?.after ?? []), ...(focus?.after ?? [])
      ]
    });
    return focus?.scope === 'test' ? scopeTestSegments(result, focus) : result;
  }, [
    file, source, focus
  ]);
  const visibleHunks = segments.filter(segment => segment.kind === 'hunk').map(segment => segment.index);
  const body = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLPreElement>(null);
  const horizontal = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  const travel = useRef<number | null>(null);
  const local = useRef<FileReading>(reading ?? {
    active: 0,
    top: 0,
    horizontal: {},
    mode,
    folds: []
  });
  const latest = useRef({
    onReading,
    mode
  });
  latest.current = {
    onReading,
    mode
  };
  const [active, setActive] = useState(local.current.active);
  const [folds, setFolds] = useState<readonly string[]>(local.current.folds ?? []);
  const [positions, setPositions] = useState<number[]>([]);
  const pendingRestore = useRef<FileReading | null>(reading ?? null);
  const foldReturn = useRef<{
    index: number;
    offset: number;
  } | null>(null);
  const save = (change: Partial<FileReading> = {}) => {
    local.current = {
      ...local.current,
      ...change,
      mode: latest.current.mode
    };
    latest.current.onReading(local.current);
  };
  const location = (index: number) => (anchors.current[index]?.offsetTop ?? 0) + (content.current?.offsetTop ?? 0);
  const observe = () => {
    const el = body.current;
    if (!el)
      return;
    const next = visibleHunks[visibleHunk(visibleHunks.map(location), el.scrollTop, el.clientHeight, el.scrollHeight)] ?? 0;
    setActive(next);
    save({
      active: next,
      top: el.scrollTop
    });
  };
  const stop = () => {
    if (travel.current === null)
      return;
    travel.current = null;
    const el = body.current;
    if (el)
      el.scrollTo({
        top: el.scrollTop,
        behavior: 'instant'
      });
  };
  const go = (index: number) => {
    travel.current = index;
    setActive(index);
    save({
      active: index
    });
    body.current?.scrollTo({
      top: Math.max(0, location(index) - 54),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  };
  useLayoutEffect(() => {
    if (reading) {
      pendingRestore.current = reading;
      local.current = reading;
      setActive(reading.active);
      setFolds(reading.folds ?? []);
    }
  }, [
    restoreVersion
  ]);
  useLayoutEffect(() => {
    const restore = pendingRestore.current;
    if (restore && JSON.stringify(restore.folds ?? []) === JSON.stringify(folds)) {
      body.current?.scrollTo({
        top: restore.top,
        behavior: 'instant'
      });
      if (horizontal.current)
        horizontal.current.scrollLeft = restore.horizontal[-1] ?? 0;
      save(restore);
      pendingRestore.current = null;
    }
    else if (foldReturn.current) {
      const saved = foldReturn.current;
      body.current?.scrollTo({
        top: location(saved.index) - saved.offset,
        behavior: 'instant'
      });
      foldReturn.current = null;
    }
  }, [
    folds, mode, width, restoreVersion
  ]);
  useLayoutEffect(() => {
    const el = horizontal.current;
    if (el && local.current.horizontal[-1] !== undefined)
      el.scrollLeft = local.current.horizontal[-1] ?? 0;
  }, [
    mode, width
  ]);
  useLayoutEffect(() => {
    if (!focus || reading?.focusId === focus.id)
      return;
    const line = focus[focus.preferredSide][0]?.startLine;
    if (line === undefined)
      return;
    const side = mode === 'split' ? `.diff-side.${focus.preferredSide} ` : '';
    const row = content.current?.querySelector<HTMLElement>(`${side}[data-${focus.preferredSide}-line="${line}"]`);
    if (row) {
      travel.current = null;
      body.current?.scrollTo({
        top: Math.max(0, row.offsetTop + (content.current?.offsetTop ?? 0) - 54),
        behavior: 'instant'
      });
      if (focus.revealSide && horizontal.current) {
        const comparison = horizontal.current;
        const bounds = comparison.getBoundingClientRect();
        const scale = bounds.width / comparison.offsetWidth || 1;
        const left = (row.getBoundingClientRect().left - bounds.left) / scale + comparison.scrollLeft;
        comparison.scrollLeft = Math.max(0, left);
        save({ horizontal: { ...local.current.horizontal, [-1]: comparison.scrollLeft } });
      }
      save({
        focusId: focus.id
      });
    }
  }, [
    focus?.id
  ]);
  useEffect(() => {
    const pre = content.current;
    if (!pre)
      return;
    const observer = new ResizeObserver(() => {
      const values = file.hunks.map((_, i) => location(i));
      setPositions(current => JSON.stringify(current) === JSON.stringify(values) ? current : values);
    });
    observer.observe(pre);
    return () => observer.disconnect();
  }, [
    file, folds, mode, width, focus?.id
  ]);
  useLayoutEffect(() => () => {
    latest.current.onReading({
      ...local.current,
      top: body.current?.scrollTop ?? local.current.top,
      horizontal: {
        ...local.current.horizontal,
        [-1]: horizontal.current?.scrollLeft ?? local.current.horizontal[-1] ?? 0
      },
      mode: latest.current.mode
    });
  }, []);
  const toggle = (id: string) => {
    stop();
    foldReturn.current = {
      index: active,
      offset: location(active) - (body.current?.scrollTop ?? 0)
    };
    const next = folds.includes(id) ? folds.filter(f => f !== id) : [
      ...folds, id
    ];
    setFolds(next);
    save({
      folds: next
    });
  };
  const renderRows = (rows: SourceRow[], hunk: number | null) => {
    let assigned = false;
    const mark = (element: HTMLElement | null, changed: boolean) => {
      if (hunk !== null && changed && !assigned) {
        anchors.current[hunk] = element;
        assigned = true;
      }
    };
    return mode === 'unified' ? rows.map((row, i) => <span
      key={i}
      className="unified-row"
      ref={el => mark(el, row.kind !== 'context')}
      data-change-anchor={hunk !== null && row.kind !== 'context' ? hunk : undefined}
    >

      <SourceLine
        row={row}
        side={row.kind === 'removed' ? 'before' : 'after'}
        mode={mode}
      />

    </span>) : splitRows(rows).map((pair, i) => <span
      key={i}
      className="paired-row"
      ref={el => mark(el, pair.before?.kind === 'removed' || pair.after?.kind === 'added')}
    >

      <span className="diff-side before">

        <SourceLine
          row={pair.before}
          side="before"
          mode={mode}
        />

      </span>

      <span className="diff-side after">

        <SourceLine
          row={pair.after}
          side="after"
          mode={mode}
        />

      </span>

    </span>);
  };
  return <>

    <nav
      className={`change-rail continuous-rail ${fullscreen ? 'workspace-rail' : ''} nodrag nopan nowheel`}
      aria-label={`Changes in ${file.path}`}
      onClick={e => e.stopPropagation()}
    >

      {visibleHunks.map(index => {
        const h = file.hunks[index]!;
        const removed = h.rows.some(r => r.kind === 'removed');
        const added = h.rows.some(r => r.kind === 'added');
        const kind = removed && added ? 'modified' : removed ? 'removed' : 'added';
        return <button
          key={index}
          className={`change-dot ${kind}`}
          style={{
            top: `${Math.max(2, Math.min(98, (positions[index] ?? 0) / Math.max(1, body.current?.scrollHeight ?? 1) * 100))}%`
          }}
          aria-label={`${file.path} change ${index + 1} · ${kind} · Before L${h.beforeStart},${h.beforeCount} / After L${h.afterStart},${h.afterCount}`}
          aria-current={active === index ? 'location' : undefined}
          onClick={() => go(index)}
        >

          <span />

        </button>;
      })}

    </nav>

    <div
      ref={body}
      className={`source-diff continuous-reader ${mode} ${fullscreen ? 'workspace-reader' : ''} nodrag nopan nowheel`}
      tabIndex={0}
      role="region"
      aria-label={`Pinned diff for ${file.path}`}
      onClick={e => e.stopPropagation()}
      onWheel={e => {
        stop();
        e.stopPropagation();
      }}
      onTouchStart={stop}
      onTouchMove={stop}
      onPointerDown={stop}
      onKeyDown={stop}
      onScroll={() => {
        const el = body.current;
        if (!el)
          return;
        save({
          top: el.scrollTop
        });
        if (travel.current !== null) {
          const target = Math.max(0, Math.min(location(travel.current) - 54, el.scrollHeight - el.clientHeight));
          if (Math.abs(el.scrollTop - target) < 2)
            travel.current = null;
          return;
        }
        observe();
      }}
    >

      <div className="continuous-version-header">

        <span className="coordinate-headings">

          <span>Before</span>

          <span>After</span>

        </span>

        <span
          className="version-hashes"
          title={`${focus ? focus.name + '\n' : ''}Before ${file.before.commit} · ${file.before.hash ?? 'absent'}\nAfter ${file.after.commit} · ${file.after.hash ?? 'absent'}`}
        >

          {file.before.commit.slice(0, 7)} →

          {file.after.commit.slice(0, 7)}</span>

        {onCalls && <button
          aria-label="Show changed-function relationships"
          title="Changed function and direct callers/callees"
          onClick={onCalls}
        >

          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >

            <path d="M3 10h6m0 0 5-6m-5 6 5 6" />

            <circle
              cx="3"
              cy="10"
              r="2"
            />

            <circle
              cx="16"
              cy="3"
              r="2"
            />

            <circle
              cx="16"
              cy="17"
              r="2"
            />

          </svg>

        </button>}

        <button
          disabled={visibleHunks.length === 0}
          aria-label="Explain current source comparison"
          title="Explain current source comparison"
          className={activeRelation?.file.path === file.path ? 'relation-selected' : ''}
          onClick={() => onExplain({
            file,
            index: active,
            side: 'after'
          })}
        >↔</button>

      </div>

      {focus?.scope === 'test' && <div
        className="test-source-caption"
        title={focus.name}
      >
        {focus.before.length === 0 ? 'Added declared test · Before absent · not run' : focus.after.length === 0 ? 'Removed declared test · After absent · not run' : visibleHunks.length ? 'Selected declared test · source changes · not run' : 'Selected declared test · unchanged source · not run'}
      </div>}

      <div
        ref={horizontal}
        className="continuous-comparison inner-comparison horizontal nodrag nopan nowheel"
        onScroll={e => save({
          horizontal: {
            ...local.current.horizontal,
            [-1]: e.currentTarget.scrollLeft
          }
        })}
      >

        <pre ref={content}>

          <code>

            {mode === 'unified' && <span className="unified-column-heading">

              <span>Before</span>

              <span>After</span>

            </span>}

            {segments.map(segment => segment.kind === 'fold' ? <span
              className="context-fold"
              key={segment.id}
            >

              <button
                className="fold-control"
                aria-expanded={folds.includes(segment.id)}
                title={segment.label}
                onClick={() => toggle(segment.id)}
              >

                {folds.includes(segment.id) ? '−' : '+'}

                {segment.label}

              </button>

              {folds.includes(segment.id) && renderRows(segment.rows, null)}

            </span> : segment.kind === 'context' ? <span
              key={segment.id}
              className="required-function-context"
            >

              {renderRows(segment.rows, null)}

            </span> : <span
              key={segment.id}
              className={`continuous-hunk ${active === segment.index ? 'active' : ''}`}
              data-hunk-id={segment.id}
              data-hunk={segment.index}
              data-before-source-id={`source:${file.path}:${segment.index}:before`}
              data-after-source-id={`source:${file.path}:${segment.index}:after`}
              title={segment.label}
            >

              {renderRows(segment.rows, segment.index)}

            </span>)}

          </code>

        </pre>

      </div>

    </div>

  </>;
};
export const DiffControls = ({ mode, onMode }: {
  mode: DiffMode;
  onMode: (m: DiffMode) => void;
}) => {
  const [position, setPosition] = useState({
    x: 20,
    y: 20
  });
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    bottom: number;
  } | null>(null);
  return <div
    className="diff-controls nodrag nopan nowheel"
    style={{
      left: position.x,
      bottom: position.y
    }}
    role="group"
    aria-label="Diff presentation"
    onClick={e => e.stopPropagation()}
  >

    <button
      className="control-grip"
      aria-label="Move diff controls"
      onPointerDown={e => {
        if (window.innerWidth < 650)
          return;
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          left: position.x,
          bottom: position.y
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (d)
          setPosition({
            x: Math.max(0, Math.min(window.innerWidth - 160, d.left + e.clientX - d.x)),
            y: Math.max(0, Math.min(window.innerHeight - 100, d.bottom + d.y - e.clientY))
          });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >⠿</button>

    {([
      'unified', 'split'
    ] as const).map(value => <button
      key={value}
      aria-label={value === 'unified' ? 'Unified' : 'Split'}
      title={value === 'unified' ? 'Unified diff' : 'Split diff'}
      aria-pressed={mode === value}
      onClick={() => onMode(value)}
    >

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >

        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="1"
        />

        {value === 'split' ? <path d="M12 4v16M6 8h3m6 0h3M6 12h3m6 0h3M6 16h3m6 0h3" /> : <path d="M6 8h12M6 12h12M6 16h12" />}

      </svg>

    </button>)}

  </div>;
};
