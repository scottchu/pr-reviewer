import type {SourceGraph} from '../domain/types.ts';
import type {ExperienceState} from '../experience/types.ts';
import {experienceService} from '../experience/service.ts';
import {collectEntities} from '../domain/validation.ts';
import {edgeRows} from './content.ts';
import {projectExperience} from './projection.ts';
import type {GraphSessionUI} from './types.ts';

const sessionFor = (state: ExperienceState): GraphSessionUI => {
    const registry = collectEntities(state.comparison.entities);
    return {
        view: projectExperience(state),
        layoutRelations: state.comparison.relations.map(edge => ({...edge, ui: edgeRows(edge, registry)})),
        limits: state.limits,
        expand: (fileId, hide) => sessionFor(experienceService.handleIntent(state, {
            type: 'show-source-units', comparisonId: state.comparisonId, fileId, hide,
        }).state),
        inspect: (entityId, open) => sessionFor(experienceService.handleIntent(state, {
            type: 'source-disclosure', comparisonId: state.comparisonId, entityId, open,
        }).state),
    };
};

export const createGraphSession = (comparison: SourceGraph): GraphSessionUI =>
    sessionFor(experienceService.openComparison(comparison));
