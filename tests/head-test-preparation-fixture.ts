import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
export const headPreparationFixture=async()=>{
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-preparation-')),repository=join(root,'repository'),donor=join(root,'donor'),executionRoot=join(root,'jobs');
 await mkdir(join(repository,'.git/objects'),{recursive:true});await mkdir(join(repository,'.git/refs'));await writeFile(join(repository,'.git/HEAD'),'ref: refs/heads/fixture\n');await mkdir(join(donor,'node_modules'),{recursive:true});await mkdir(executionRoot);
 const object=async(kind:string,body:Buffer)=>{const raw=Buffer.concat([Buffer.from(`${kind} ${body.length}\0`),body]),id=createHash('sha1').update(raw).digest('hex'),directory=join(repository,'.git/objects',id.slice(0,2));await mkdir(directory,{recursive:true});await writeFile(join(directory,id.slice(2)),deflateSync(raw));return id;};
 const selectors=['domain','registry','graph','source-analysis'],tests:Buffer[]=[];
 for(const name of selectors){const id=await object('blob',Buffer.from("import {test,expect} from 'bun:test'; test('configured fixture',()=>expect(1).toBe(1));\n"));tests.push(Buffer.concat([Buffer.from(`100644 ${name}.test.ts\0`),Buffer.from(id,'hex')]));}
 const tree=await object('tree',Buffer.concat(tests.sort((a,b)=>a.compare(b))));
 const manifest={name:'pr-reviewer',dependencies:{zod:'4.6.7','typescript-analysis':'npm:typescript@6.0.3'},scripts:{test:'bun test tests/domain.test.ts tests/registry.test.ts tests/graph.test.ts tests/source-analysis.test.ts && node fixture'}};
 const packageBytes=Buffer.from(JSON.stringify(manifest)),lock=Buffer.from('fixture-existing-lock'),packageId=await object('blob',packageBytes),lockId=await object('blob',lock);
 await writeFile(join(donor,'package.json'),packageBytes);await writeFile(join(donor,'bun.lock'),lock);
 for(const [entry,name,version] of [['zod','zod','4.6.7'],['typescript-analysis','typescript','6.0.3']]){const path=join(donor,'node_modules',entry!);await mkdir(path);await writeFile(join(path,'package.json'),JSON.stringify({name,version}));await writeFile(join(path,'index.js'),'export const controlled = true;');}
 const rootTree=await object('tree',Buffer.concat([Buffer.concat([Buffer.from('100644 bun.lock\0'),Buffer.from(lockId,'hex')]),Buffer.concat([Buffer.from('100644 package.json\0'),Buffer.from(packageId,'hex')]),Buffer.concat([Buffer.from('40000 tests\0'),Buffer.from(tree,'hex')])]));
 const headSha=await object('commit',Buffer.from(`tree ${rootTree}\nauthor Fixture <fixture@example.invalid> 0 +0000\ncommitter Fixture <fixture@example.invalid> 0 +0000\n\nfixture\n`));
 return {root,repository,donor,executionRoot,headSha,cleanup:()=>rm(root,{recursive:true,force:true})};
};
