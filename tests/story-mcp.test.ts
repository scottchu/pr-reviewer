import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {createGateway} from '../src/server/public.ts';
import type {StoryReceipt,StoryView,StoryContextView} from '../src/domain/public.ts';
import {storyFixture} from './story-fixture.ts';
test('S01/S03-S05 controlled actual SDK story tools preserve same attached capability, author and no wake',{timeout:20000},async()=>{
 const f=storyFixture();let notifications=0;const gateway=createGateway(f.store,async()=>{notifications++;return {state:'unknown',reason:'controlled fixture'};});const client=new Client({name:'controlled-story-sdk',version:'1.0.0'});
 const call=(name:string,args:Record<string,unknown>={})=>client.callTool({name,arguments:args});
 const value=async<T>(name:string,args:Record<string,unknown>={}):Promise<T>=>{const result=await call(name,args);assert.notEqual(result.isError,true);return JSON.parse((result.content as {text:string}[])[0]!.text) as T;};
 try{
  const port=await gateway.listen(0),owner={kind:'user' as const,actorId:'local-user'};
  const connection=f.store.registerConnection(owner,{host:'codex',sessionId:'controlled-story-session',connectionId:'controlled-story-connection',corroborated:true});const challenge=f.store.challenge(owner,'r','codex','controlled-story-session','controlled-story-connection');
  const launchRef=join(f.root,'controlled-launch.json');writeFileSync(launchRef,JSON.stringify({gatewayUrl:`http://127.0.0.1:${port}`,bootstrapToken:connection.token,challengeId:challenge.challengeId,proof:challenge.proof,reviewId:'r',host:'codex',sessionId:'controlled-story-session',connectionId:'controlled-story-connection'}),{mode:0o600});
  await client.connect(new StdioClientTransport({command:process.execPath,args:['--experimental-strip-types',resolve('src/mcp/main.ts')],env:{PATH:process.env.PATH??'',REVIEW_MCP_LAUNCH_REF:launchRef}}));
  const names=(await client.listTools()).tools.map(tool=>tool.name);for(const name of ['story_get','story_context_get','story_publish'])assert.ok(names.includes(name));assert.equal(names.some(name=>/story_context_put/.test(name)),false);
  const scope={reviewId:'r',snapshotId:'snapshot'};assert.equal((await call('story_get',scope)).isError,true);
  const attached=await value<{attachment:{attachmentId:string}}>('session_attach');
  const {type:_type,reviewId:_review,...input}=f.publish();const receipt=await value<StoryReceipt>('story_publish',input);assert.equal(receipt.state,'applied');assert.deepEqual(await value<StoryReceipt>('story_publish',input),receipt);
  const view=await value<StoryView>('story_get',{...scope,minimumStoryRevision:receipt.storyRevision});assert.equal(view.version!.author.kind,'agent');assert.equal(view.version!.versionId,receipt.result.versionId);assert.equal(view.storyRevision,1);
  assert.deepEqual((await value<StoryContextView>('story_context_get',scope)).missingKinds,['Epic','Ticket','PR']);
  assert.equal((await call('story_get',{...scope,reviewId:'other'})).isError,true);
  f.store.command(owner,{type:'RevokeAttachment',commandId:'revoke-story-author',reviewId:'r',attachmentId:attached.attachment.attachmentId});
  assert.equal((await call('story_publish',input)).isError,true);assert.equal((await call('story_get',scope)).isError,true);assert.equal((await call('story_context_get',scope)).isError,true);assert.equal(notifications,0);
 }finally{await client.close();await gateway.close();f.cleanup();}
});
