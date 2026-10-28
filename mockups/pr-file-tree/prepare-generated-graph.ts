import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import comparison from './diffs.json' with { type: 'json' };
import {prepareReviewComparison} from '../../src/review-graph/preparation/run.ts';
import { prepareAppGraph } from './prepare-app-graph.ts';
const prepared = await prepareReviewComparison('scottchu/pr-reviewer', comparison.base, comparison.head, facts=>createHash('sha256').update(JSON.stringify(facts)).digest('hex'));
const facts = prepared.facts;
const bytes = JSON.stringify(facts);
const digest = createHash('sha256').update(bytes).digest('hex');
const folder = join(homedir(), '.codex-workspaces/artifacts/pr-reviewer-generated-graph', comparison.head);
mkdirSync(folder, { recursive: true });
const evidencePath = join(folder, 'source-facts-' + digest + '.json');
if (existsSync(evidencePath)) {
    if (readFileSync(evidencePath, 'utf8') !== bytes)
        throw new Error('source_evidence_identity_collision');
}
else
    writeFileSync(evidencePath, bytes, { flag: 'wx' });
const graph = prepared.graph;
writeFileSync(new URL('./generated-source-graph.json', import.meta.url), JSON.stringify(graph));
console.log(JSON.stringify({
    changedFiles: facts.files.length, contextFiles: facts.contextFiles.length, rootRecords: graph.entities.length, inputHash: digest, sourceArtifact: join(folder, 'source-facts-' + digest + '.json')
}));
