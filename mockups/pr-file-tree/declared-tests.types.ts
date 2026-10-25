/** Task-local evidence types; not a proposed production persistence schema. */
export type Side = 'base' | 'head';
export type EvidenceAnchor = Readonly<{
  snapshotId: string;
  side: Side;
  path: string;
  contentHash: string;
  start: number;
  end: number;
  startLine: number;
  endLine: number;
  commit?: string;
}>;
export type SourceEvidence = Readonly<{
  anchor: EvidenceAnchor;
  sourceText: string;
}>;
export type TestVersion = Readonly<{
  availability: 'absent';
}> | Readonly<{
  availability: 'available';
  definition: SourceEvidence;
  callback: SourceEvidence & Readonly<{
    bodyHash: string;
  }>;
}>;
export type NativeTestHunk = Readonly<{
  id: string;
  header: string;
  beforeStart: number;
  beforeCount: number;
  afterStart: number;
  afterCount: number;
  patchHash: string;
  changeKind: 'added' | 'removed' | 'modified';
  rows: readonly Readonly<{
    kind: 'context' | 'added' | 'removed';
    beforeLine: number | null;
    afterLine: number | null;
    text: string;
  }>[];
}>;
export type MappingBasis = 'factory_public_api_behavior' | 'http_public_api_behavior_source_chain' | 'factory_public_api_behavior_source_chain' | 'react_user_journey_source_chain';
export type TestMapping = Readonly<{
  targetId: string;
  target: EvidenceAnchor;
  certainty: MappingBasis;
  executionClaim: false;
  chain: readonly string[];
  bindingAnchors: readonly EvidenceAnchor[];
  limit: string;
}>;
export type DeclaredTest = Readonly<{
  id: string;
  path: string;
  name: string;
  summary: string;
  targets: readonly string[];
  basis: MappingBasis;
  limit: string;
  classification: 'added' | 'removed' | 'modified' | 'unmodified';
  declaredTest: true;
  execution: Readonly<{
    state: 'unrun_in_this_packet';
    result: null;
    coverage: null;
  }>;
  versions: Readonly<Record<Side, TestVersion>>;
  nativeHunks: readonly NativeTestHunk[];
  functionMappings: readonly TestMapping[];
}>;
export type ChangeCenteredTestEvidence = Readonly<{
  format: 'task-local-change-centered-test-evidence-v1';
  commits: Readonly<Record<Side, string>>;
  provenance: string;
  coordinates: string;
  cases: readonly DeclaredTest[];
  bindings: readonly SourceEvidence[];
  mappingUnknown: readonly Readonly<{
    caseId: string;
    side: Side;
    target: string;
    reason: string;
  }>[];
  selectedFunctionTargets: readonly Readonly<{
    id: string;
    name: string;
    declaration: EvidenceAnchor;
    body: EvidenceAnchor;
  }>[];
  frontiers: readonly string[];
}>;
