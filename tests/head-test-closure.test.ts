import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {copyHeadTestClosure,inventoryHeadFiles} from '../src/test-jobs/public.ts';
const create=async()=>{
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-closure-')),source=join(root,'source'),donor=join(root,'donor');
 await mkdir(source);await mkdir(donor);await mkdir(join(donor,'node_modules'));
 const manifest={name:'pr-reviewer',dependencies:{zod:'4.6.7','typescript-analysis':'npm:typescript@6.0.3'},scripts:{test:'bun test tests/domain.test.ts tests/registry.test.ts tests/graph.test.ts tests/source-analysis.test.ts && node old'}};
 await writeFile(join(source,'package.json'),JSON.stringify(manifest));await writeFile(join(donor,'package.json'),JSON.stringify({...manifest,scripts:{test:manifest.scripts.test+' extra'}}));
 for(const dir of [source,donor])await writeFile(join(dir,'bun.lock'),'fixed fixture lock');
 for(const [entry,name,version] of [['zod','zod','4.6.7'],['typescript-analysis','typescript','6.0.3']]){const path=join(donor,'node_modules',entry!);await mkdir(path);await writeFile(join(path,'package.json'),JSON.stringify({name,version}));await writeFile(join(path,'index.js'),'export const fixture = true;');}
 return {root,source,donor};
};
test('B02 copied closure validates entire non-script manifest and preserves measured private content',async()=>{
 const f=await create();try{const copied=await copyHeadTestClosure({source:f.source,donor:f.donor,check:()=>{}});assert.deepEqual(copied.metadata.changedScriptKeys,['test']);assert.equal(copied.manifest.packages.length,2);assert.equal(copied.closureManifestId.length,64);assert.equal((await inventoryHeadFiles(join(f.source,'node_modules/zod'),()=>{})).length,2);assert.equal(await readFile(join(f.source,'node_modules/zod/index.js'),'utf8'),'export const fixture = true;');}finally{await rm(f.root,{recursive:true,force:true});}
});
test('B02 non-script drift and dependency symlink are unavailable without following or modifying donor',async()=>{
 const f=await create();try{const manifest=JSON.parse(await readFile(join(f.donor,'package.json'),'utf8'));manifest.extra='closure relevant';await writeFile(join(f.donor,'package.json'),JSON.stringify(manifest));await assert.rejects(copyHeadTestClosure({source:f.source,donor:f.donor,check:()=>{}}),/environment_unavailable/);}finally{await rm(f.root,{recursive:true,force:true});}
 const g=await create();try{await symlink('/etc/hosts',join(g.donor,'node_modules/zod/link'));await assert.rejects(copyHeadTestClosure({source:g.source,donor:g.donor,check:()=>{}}),/environment_unavailable/);}finally{await rm(g.root,{recursive:true,force:true});}
});
