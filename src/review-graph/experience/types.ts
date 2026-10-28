import type { SourceGraph } from '../domain/types.ts';
export type ExperienceState = Readonly<{
    comparison: SourceGraph;
    comparisonId: string;
    limits: Readonly<Record<string, number>>;
    sourceDisclosure: Readonly<Record<string, boolean>>;
    inspection: string | null;
    revision: number;
}>;
export type ExperienceIntent = Readonly<{
    comparisonId: string;
}> & (Readonly<{
    type: 'show-source-units';
    fileId: string;
    hide?: boolean;
}> | Readonly<{
    type: 'source-disclosure';
    entityId: string;
    open: boolean;
}> | Readonly<{
    type: 'return-to-graph';
}>);
export type IntentResult = Readonly<{
    accepted: true;
    state: ExperienceState;
}> | Readonly<{
    accepted: false;
    state: ExperienceState;
    reason: string;
}>;
