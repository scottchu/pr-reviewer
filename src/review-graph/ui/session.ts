import type {SourceGraph} from '../domain/types.ts';
import type {ExperienceState} from '../experience/types.ts';
import {experienceService} from '../experience/service.ts';
import {collectEntities} from '../domain/validation.ts';
import {edgeRows} from './content.ts';
import {projectExperience} from './projection.ts';
import {projectChangeFilter} from './change-filter.ts';
import type {GraphSessionUI} from './types.ts';

const sessionFor = (state: ExperienceState, layoutRelations: GraphSessionUI['layoutRelations']): GraphSessionUI => {
    const view = projectExperience(state);
    return {
        comparisonId: state.comparisonId,
        view,
        layoutRelations,
        limits: state.limits,
        filter: projectChangeFilter(view, state.changesOnly),
        setChangesOnly: enabled => sessionFor(experienceService.handleIntent(state, {
            type: 'set-changes-only', comparisonId: state.comparisonId, enabled,
        }).state, layoutRelations),
        expand: (fileId, hide) => sessionFor(experienceService.handleIntent(state, {
            type: 'show-source-units', comparisonId: state.comparisonId, fileId, hide,
        }).state, layoutRelations),
        inspect: (entityId, open) => sessionFor(experienceService.handleIntent(state, {
            type: 'source-disclosure', comparisonId: state.comparisonId, entityId, open,
        }).state, layoutRelations),
    };
};

export const createGraphSession = (comparison: SourceGraph): GraphSessionUI => {
    const registry = collectEntities(comparison.entities);
    const layoutRelations = comparison.relations.map(edge => ({...edge, ui: edgeRows(edge, registry)}));
    return sessionFor(experienceService.openComparison(comparison), layoutRelations);
};
