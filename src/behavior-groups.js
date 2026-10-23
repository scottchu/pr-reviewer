// Manually grounded in Flow #32's pinned patch. Other heads must not reuse this model.
export const behaviorDefinitions = [
  { id: 'route', title: 'Handle requests', icon: 'git-branch', step: 0, steps: [0,1], paths: ['apps/cli/src/main.ts'], summary: 'Separate a request to continue unfinished work from a request to verify a task. The new route calls the handler; ordinary verification keeps its existing route.' },
  { id: 'decide', title: 'Decide whether to continue', icon: 'circle-dot', step: 2, steps: [2,4], paths: ['apps/cli/src/plugin-api.ts'], summary: 'Reuse the task-record check, then reject mismatched sessions, repeated requests, missing progress and too many attempts. These added lines work together to produce one continue-or-stop answer.' },
  { id: 'save', title: 'Remember the attempt', icon: 'file', step: 3, steps: [3], paths: ['apps/cli/src/task-stop.ts'], summary: 'Read the request and task files, call the decision code, then safely save the attempt identity and progress. The lock, bounded reads and replacement checks support that same operation.' },
  { id: 'compatibility', title: 'Support local setup', icon: 'settings', step: 5, steps: [5], paths: ['apps/cli/src/providers/codex-engine.ts','package.json','docs/contracts.json'], summary: 'Expose the command in help, accept empty hook trust metadata, and update the release and generated contract. Installation still does not automatically enable continuation.' },
  { id: 'tests', title: 'Check the behavior', icon: 'check', step: 6, steps: [6], paths: ['bin/test-workflow.ts','bin/test.ts'], summary: 'Add decision-level and packaged-command tests for progress, replay, cancellation and file handling. These are test definitions in the PR, not test results from this viewer.' },
  { id: 'docs', title: 'Explain use & limits', icon: 'info', step: 7, steps: [7], paths: ['README.md','docs/build.md','docs/experiments/014-local-continuation.md','docs/install.md','docs/plugin-api.md','references/understanding-plan.md'], summary: 'Document explicit opt-in, observed experiments and remaining limits. Some green lines reproduce implementation source in documentation; they do not add another runtime path.' }
];
export function groupChanges(files, curated, modelDefinitions) {
  const definitions = curated ? (modelDefinitions ?? behaviorDefinitions) : [{ id: 'files', title: 'Changed files', icon: 'files', paths: files.map(f => f.path), summary: 'File changes are available. Behavioral relationships have not been established for this PR head.' }];
  const groups = definitions.map(g => ({ ...g, files: files.filter(f => g.paths.includes(f.path)) }));
  const assigned = new Set(groups.flatMap(g => g.files.map(f => f.path)));
  const remaining = files.filter(f => !assigned.has(f.path));
  if (remaining.length) groups.push({ id: 'unmapped', title: 'Other changes', icon: 'files', summary: 'These files are not covered by the curated explanation yet.', files: remaining });
  return groups.filter(g => g.files.length).map(g => ({ ...g, additions: g.files.reduce((n,f) => n+f.additions,0), deletions: g.files.reduce((n,f) => n+f.deletions,0) }));
}
