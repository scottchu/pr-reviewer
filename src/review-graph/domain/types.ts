import type ts from 'typescript-analysis';
export type SourceInput = Readonly<{
    repository: string;
    side: 'base' | 'head';
    commit: string;
    path: string;
    content: string;
    contentHash: string;
    gitBlob: string;
}>;
export type SourceAnchor = Readonly<{
    repository: string;
    side: 'base' | 'head';
    commit: string;
    path: string;
    contentHash: string;
    start: number;
    end: number;
    startLine: number;
    endLine: number;
}>;
export type StructuralUnit = Readonly<{
    id: string;
    kind: 'function' | 'callsite' | 'test' | 'assertion' | 'header';
    name: string;
    sourceText: string;
    anchor: SourceAnchor;
    ownerId?: string;
    basis: string;
    diagnostic?: string;
    exportName?: string;
    identityPath?: string;
    binding?: Readonly<{
        kind: 'local-const' | 'relative-import';
        targetId?: string;
        module?: string;
        name?: string;
    }>;
}>;
export type GraphEntity = Readonly<{
    id: string;
    kind: string;
    data: Readonly<Record<string, unknown>>;
    nodes?: readonly GraphEntity[];
    edges?: readonly GraphRelation[];
}>;
export type GraphRelation = Readonly<{
    id: string;
    from: string;
    to: string;
    version: 'before' | 'after' | 'comparison';
    relation: string;
    data: Readonly<Record<string, unknown>>;
}>;
export type SourceGraph = Readonly<{
    entities: readonly GraphEntity[];
    relations: readonly GraphRelation[];
    fileUnits: Readonly<Record<string, readonly string[]>>;
    groupFor: Readonly<Record<string, string>>;
    initialVisible: readonly string[];
    unresolved: readonly {
        path: string;
        name: string;
        kind: string;
        sourceTextHash: string;
        anchor: {
            side: string;
            startLine: number;
            endLine: number;
        };
        reason: string;
    }[];
    provenance: Readonly<Record<string, unknown>>;
}>;
export type SourceSide = Readonly<{
    side: 'base' | 'head';
    commit: string;
    available: boolean;
    mode?: string;
    type?: string;
    objectId?: string;
    contentHash?: string;
    disposition?: string;
}>;
export type NativeFile = Readonly<{
    id: string;
    path: string;
    nativeStatus: string;
    comparisonStatus: string;
    sides: readonly SourceSide[];
    patch: string | null;
    patchHash: string;
}>;
export type ContextFile = Readonly<{
    id: string;
    path: string;
    comparisonStatus: string;
    sides: readonly SourceSide[];
    scope: string;
}>;
export type SourceProducer = Readonly<{
    version: string;
    parser: string;
    sourceHashes: Readonly<Record<string, string>>;
}>;
export type FactDocument = Readonly<{
    format: string;
    producer: SourceProducer;
    repository: string;
    base: string;
    head: string;
    files: readonly NativeFile[];
    contextFiles: readonly ContextFile[];
    units: readonly StructuralUnit[];
    coverage: Readonly<Record<string, unknown>>;
}>;
export type SourceSnapshot = Omit<FactDocument, 'units'> & Readonly<{
    sources: readonly SourceInput[];
}>;
export type ParsedSource = Readonly<{
    input: SourceInput;
}> & (Readonly<{
    kind: 'unsupported';
}> | Readonly<{
    kind: 'typescript';
    ast: ts.SourceFile;
    checker: ts.TypeChecker;
}>);
export type ParsedSnapshot = Readonly<{
    snapshot: SourceSnapshot;
    sources: readonly ParsedSource[];
    nativeDiffs: ReadonlyMap<string, readonly NativeDocumentHunk[]>;
    nativeDiagnostics: readonly {
        fileId: string;
        reason: string;
    }[];
}>;
export type PreparationAliases = Readonly<{
    fileId?: (path: string, fallback: string) => string;
    unitId?: (unit: StructuralUnit, fallback: string) => string;
    headerId?: (owner: string | undefined, fallback: string) => string;
    headerScope?: (owner: string | undefined) => string;
    reviewId?: string;
    reviewName?: string;
    graphId?: string;
}>;
export type CompiledSourceGraph = Readonly<{
    id: string;
    kind: string;
    entities: readonly GraphEntity[];
    relations: readonly GraphRelation[];
    fileUnits: Readonly<Record<string, readonly string[]>>;
    unresolved: readonly {
        path: string;
        occurrence: StructuralUnit;
        reason: string;
    }[];
    provenance: Readonly<Record<string, unknown>>;
}>;
export type ExtractedComparison = Readonly<{
    facts: FactDocument;
    comparison: CompiledSourceGraph;
    nativeDiffs: ReadonlyMap<string, readonly NativeDocumentHunk[]>;
    editCompositions: ReadonlyMap<string, import('./edit-composition.ts').EditComposition>;
}>;
export type DocumentWitness = Readonly<{
    side: 'base' | 'head';
    commit: string;
    path: string;
    contentHash: string;
    startLine: number;
    endLine: number;
    text: string;
}>;
export type NativeEditRow = Readonly<{
    kind: 'add' | 'remove' | 'context';
    text: string;
    beforeLine: number | null;
    afterLine: number | null;
}>;
export type NativeDocumentHunk = Readonly<{
    index: number;
    header: string;
    rows: readonly NativeEditRow[];
    before: DocumentWitness | null;
    after: DocumentWitness | null;
}>;
