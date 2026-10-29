import type { SourceGraph } from '../domain/types.ts';
import { collectEntities, validateGraph } from '../domain/validation.ts';
import type { ExperienceState, ExperienceIntent, IntentResult } from './types.ts';
export const openComparison = (comparison: SourceGraph): ExperienceState => {
    validateGraph(comparison.entities, comparison.relations);
    const identity = [comparison.provenance.repository, comparison.provenance.base, comparison.provenance.head];
    if (identity.some(value => typeof value !== 'string' || !value))
        throw new Error('comparison_identity_unavailable');
    return { comparison, comparisonId: JSON.stringify(identity), limits: {}, sourceDisclosure: {}, inspection: null, changesOnly: false, revision: 0 };
};
export const handleIntent = (state: ExperienceState, intent: ExperienceIntent): IntentResult => {
    if (intent.comparisonId !== state.comparisonId)
        return { accepted: false, state, reason: 'stale_comparison_intent' };
    if (intent.type === 'set-changes-only') {
        return {
            accepted: true,
            state: state.changesOnly === intent.enabled ? state : {
                ...state,
                changesOnly: intent.enabled,
                revision: state.revision + 1,
            },
        };
    }
    const entities = collectEntities(state.comparison.entities);
    if (intent.type === 'show-source-units') {
        if (!entities.some(entity => entity.id === intent.fileId && entity.kind === 'file'))
            return { accepted: false, state, reason: 'file_scope_unavailable' };
        return { accepted: true, state: { ...state, limits: { ...state.limits, [intent.fileId]: intent.hide ? 0 : (state.limits[intent.fileId] ?? 0) + 20 }, revision: state.revision + 1 } };
    }
    if (intent.type === 'source-disclosure') {
        if (!entities.some(entity => entity.id === intent.entityId && ['function', 'test'].includes(entity.kind) && entity.data.editComposition))
            return { accepted: false, state, reason: 'source_inspection_unavailable' };
        return { accepted: true, state: { ...state, sourceDisclosure: { ...state.sourceDisclosure, [intent.entityId]: intent.open }, inspection: intent.open ? intent.entityId : state.inspection === intent.entityId ? null : state.inspection, revision: state.revision + 1 } };
    }
    return { accepted: true, state: { ...state, sourceDisclosure: state.inspection ? { ...state.sourceDisclosure, [state.inspection]: false } : state.sourceDisclosure, inspection: null, revision: state.revision + 1 } };
};
export const experienceService = { openComparison, handleIntent } as const;
