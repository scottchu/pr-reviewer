import { test, expect } from 'bun:test';
import { surfaceExample as model } from '../src/surface-example';
import { groupChanges } from '../src/behavior-groups';
test('Surface example accounts for each file and reading step without Flow caller semantics',()=>{
 const paths=model.groups.flatMap(g=>g.paths); expect(paths).toHaveLength(9); expect(new Set(paths).size).toBe(9);
 expect(model.lessons).toHaveLength(8); expect(model.relation).toBe('configures');
 for(let step=0;step<8;step++) {
  expect(model.groups.filter(g=>g.steps.includes(step))).toHaveLength(1);
  const l=model.lessons[step]; expect(paths).toContain(l.file); expect(model.stories[l.id]).toHaveLength(4);
  for(const scene of model.stories[l.id]) expect(scene).toMatch(/\{\{(?:added|removed|modified|context)\|[^}]+\}\}/);
 }
 const groups=groupChanges(paths.map(path=>({path,additions:1,deletions:0})),true,model.groups);
 expect(groups.map(g=>g.id)).toEqual(['navigation','package','tests','evidence']);
 expect(groups.reduce((n,g)=>n+g.files.length,0)).toBe(9);
 expect(model.methods.map(n=>n.name)).toEqual(['SurfaceShell','AppShell']);
});
