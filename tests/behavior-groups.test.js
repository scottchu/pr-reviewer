import { test, expect } from 'bun:test';
import { behaviorDefinitions, groupChanges } from '../src/behavior-groups';
const paths = ['README.md','apps/cli/src/main.ts','apps/cli/src/plugin-api.ts','apps/cli/src/providers/codex-engine.ts','apps/cli/src/task-stop.ts','bin/test-workflow.ts','bin/test.ts','docs/build.md','docs/contracts.json','docs/experiments/014-local-continuation.md','docs/install.md','docs/plugin-api.md','package.json','references/understanding-plan.md'];
const files = paths.map((path,i) => ({path,additions:i+1,deletions:i%3}));
test('every pinned PR file belongs to exactly one behavior group, with conserved totals', () => {
 const groups=groupChanges(files,true), mapped=groups.flatMap(g=>g.files.map(f=>f.path));
 expect(groups).toHaveLength(6); expect(mapped.length).toBe(files.length); expect(new Set(mapped).size).toBe(files.length);
 expect(groups.reduce((n,g)=>n+g.additions,0)).toBe(files.reduce((n,f)=>n+f.additions,0));
 expect(groups.reduce((n,g)=>n+g.deletions,0)).toBe(files.reduce((n,f)=>n+f.deletions,0));
 for(let step=0;step<8;step++) expect(behaviorDefinitions.filter(g=>g.steps.includes(step))).toHaveLength(1);
});
test('unmodeled changed files are visible rather than silently omitted',()=>{
 const groups=groupChanges([...files,{path:'unknown.ts',additions:2,deletions:1}],true);
 expect(groups.at(-1).id).toBe('unmapped'); expect(groups.at(-1).files[0].path).toBe('unknown.ts');
});
test('another PR does not inherit curated behavioral intent or lesson links',()=>{
 const groups=groupChanges(files,false); expect(groups).toHaveLength(1); expect(groups[0].id).toBe('files'); expect(groups[0].steps).toBeUndefined(); expect(groups[0].files).toHaveLength(14);
});
