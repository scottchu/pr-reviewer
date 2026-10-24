import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fixture from '../fixture.json' with {type:'json'};
import {account,proseIdentity} from '../journey.ts';
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
test('every displayed source excerpt/hash/range and the complete ledger match immutable PR25 Git objects',()=>{
 for(const pair of Object.values(fixture.sources))for(const source of Object.values(pair)){
  if(!source)continue;const full=execFileSync('git',['show',`${source.commit}:${source.path}`],{encoding:'utf8'});const lines=full.split(/(?<=\n)/);const excerpt=lines.slice(source.startLine-1,source.endLine).join('');
  assert.equal(source.contentHash,hash(full));assert.equal(source.text,excerpt);assert.equal(source.excerptHash,hash(excerpt));assert.equal(source.startOffset,lines.slice(0,source.startLine-1).join('').length);assert.equal(source.endOffset,source.startOffset+excerpt.length);
 }
 const ledger=execFileSync('git',['diff','--numstat',fixture.base,fixture.head],{encoding:'utf8'}).trim().split('\n').map(row=>{const [added,removed,path]=row.split('\t');return {path,added,removed};});assert.deepEqual(fixture.ledger,ledger);assert.equal(hash(account),proseIdentity.contentHash);
 const before=fixture.sources.refresh.before.text,after=fixture.sources.refresh.after.text;assert.equal(before,after);
});
