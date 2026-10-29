import type {ReaderIdentityUI, ReaderKindUI, ReaderStateUI, ReaderStateCacheUI, UIEntity} from './types.ts';
const empty: ReaderStateUI = Object.freeze({open: false, scrollTop: 0, scrollLeft: 0});
const kinds = new Set<ReaderKindUI>(['inline-hunks', 'source-hunks', 'removed-preview', 'added-preview', 'unpaired-source']);

/** Small presentation values only, bounded by known entities × fixed reader kinds. */
export const createReaderStateCache = (entityIds: readonly string[]): ReaderStateCacheUI => {
    const allowed = new Set(entityIds);
    const states = new Map<string, Map<ReaderKindUI, ReaderStateUI>>();
    const read = ({entityId, kind}: ReaderIdentityUI) => states.get(entityId)?.get(kind) ?? empty;
    const update = (identity: ReaderIdentityUI, patch: Partial<ReaderStateUI>) => {
        if (!allowed.has(identity.entityId) || !kinds.has(identity.kind)) return;
        const readers = states.get(identity.entityId) ?? new Map<ReaderKindUI, ReaderStateUI>();
        readers.set(identity.kind, {...read(identity), ...patch});
        states.set(identity.entityId, readers);
    };
    return {
        read,
        disclose: (identity, open) => update(identity, {open}),
        capture: (identity, {scrollTop, scrollLeft}) => {
            if (Number.isFinite(scrollTop) && Number.isFinite(scrollLeft)) update(identity, {scrollTop, scrollLeft});
        },
        restore: (identity, target) => {
            const saved = read(identity);
            target.scrollTop = saved.scrollTop; target.scrollLeft = saved.scrollLeft;
        },
    };
};

/** Native open readers retain their pins even while a semantic mask discards their DOM. */
export const retainedReaderPins = (
    entities: readonly UIEntity[],
    limits: Readonly<Record<string, number>>,
    cache: ReaderStateCacheUI,
): readonly string[] => entities.filter(entity => entity.ui.sourceOpen
    || (entity.ui.inlineSourceReading && cache.read({entityId: entity.id, kind: 'inline-hunks'}).open)
    || (entity.ui.fileControl && Boolean(limits[entity.id]) && entity.ui.unpairedRows.length > 0
        && cache.read({entityId: entity.id, kind: 'unpaired-source'}).open))
    .map(entity => entity.id);
