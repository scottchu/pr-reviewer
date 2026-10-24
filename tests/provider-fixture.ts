import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createNodeEffects} from '../src/source-acquisition/public.ts';
import type {Candidate,AcquisitionEffects} from '../src/source-acquisition/public.ts';
export const providerFixture=(options:{kind?:'unsupported'|'zero'}={})=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-provider-preparation-'));
 const env={...process.env,GIT_AUTHOR_NAME:'Compatibility',GIT_AUTHOR_EMAIL:'compatibility@example.invalid',GIT_COMMITTER_NAME:'Compatibility',GIT_COMMITTER_EMAIL:'compatibility@example.invalid',GIT_AUTHOR_DATE:'2020-01-01T00:00:00Z',GIT_COMMITTER_DATE:'2020-01-01T00:00:00Z'};
 const git=(...args:string[])=>execFileSync('git',['-C',root,'-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false',...args],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q');git('remote','add','origin','https://github.com/team/repo.git');git('checkout','-qb','feature');writeFileSync(join(root,'a'),options.kind==='unsupported'?Buffer.from([0,1]):'original\n'.repeat(10));git('add','.');git('commit','-qm','base');const baseSha=git('rev-parse','HEAD');
 if(options.kind==='unsupported')writeFileSync(join(root,'a'),Buffer.from([0,2]));else if(options.kind!=='zero'){writeFileSync(join(root,'a'),'changed\n'+'original\n'.repeat(9));writeFileSync(join(root,'b'),'original\n'.repeat(10));writeFileSync(join(root,'empty'),'');writeFileSync(join(root,'binary'),Buffer.from([0,1]));}git('add','.');git('commit','--allow-empty','-qm','head');const headSha=git('rev-parse','HEAD');
 const candidate:Candidate={provider:'github',host:'github.com',sourceProject:'team/repo',targetProject:'team/repo',number:1,url:'https://github.com/team/repo/pull/1',title:'Copy and edit',state:'open',sourceBranch:'feature',targetBranch:'main',baseSha,headSha,targetTipSha:baseSha,baselineMethod:'github_compare_merge_base'};
 const pull={number:1,html_url:candidate.url,title:candidate.title,state:'open',head:{ref:'feature',sha:headSha,repo:{full_name:'team/repo'}},base:{ref:'main',sha:baseSha,repo:{full_name:'team/repo'}}};
 const native=createNodeEffects();const effects:AcquisitionEffects={run:async command=>{if(command.executable==='git')return native.run(command);const endpoint=command.args.at(-1)??'';const value=endpoint.includes('/compare/')?{merge_base_commit:{sha:baseSha}}:endpoint.includes('/pulls?')?[pull]:endpoint==='repos/team/repo'?{full_name:'team/repo',default_branch:'main'}:pull;return {kind:'ok',stdout:Buffer.from(JSON.stringify(value))};}};
 return {root,candidate,effects};
};
