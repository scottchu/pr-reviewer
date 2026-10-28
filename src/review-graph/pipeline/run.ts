import type { SourceSnapshot, ParsedSnapshot, FactDocument, ExtractedComparison } from '../domain/types.ts';
export type PipelineStage = 'read' | 'parse' | 'extract' | 'enrich';
export type PipelinePorts<T> = Readonly<{
    read: () => SourceSnapshot | Promise<SourceSnapshot>;
    parse: (snapshot: SourceSnapshot) => ParsedSnapshot;
    extract: (parsed: ParsedSnapshot) => ExtractedComparison;
    enrich: (source: ExtractedComparison) => T | Promise<T>;
}>;
export type PipelineResult<T> = Readonly<{
    status: 'ready';
    facts: FactDocument;
    source: ExtractedComparison;
    enrichment: T;
}> | Readonly<{
    status: 'failed';
    stage: PipelineStage;
    error: unknown;
    facts?: FactDocument;
    source?: ExtractedComparison;
}>;
export const runSourcePipeline = async <T>(ports: PipelinePorts<T>, onStage: (stage: PipelineStage) => void = () => { }, signal?: AbortSignal): Promise<PipelineResult<T>> => {
    let stage: PipelineStage = 'read';
    let facts: FactDocument | undefined;
    let source: ExtractedComparison | undefined;
    const enter = (next: PipelineStage) => {
        stage = next;
        if (signal?.aborted)
            throw new Error('source_pipeline_cancelled');
        onStage(next);
    };
    try {
        enter('read');
        const snapshot = await ports.read();
        enter('parse');
        const parsed = ports.parse(snapshot);
        enter('extract');
        source = ports.extract(parsed);
        facts = source.facts;
        enter('enrich');
        const enrichment = await ports.enrich(structuredClone(source));
        if (signal?.aborted)
            throw new Error('source_pipeline_cancelled');
        return { status: 'ready', facts, source, enrichment };
    }
    catch (error) {
        return { status: 'failed', stage, error, ...(facts ? { facts } : {}), ...(source ? { source } : {}) };
    }
};
