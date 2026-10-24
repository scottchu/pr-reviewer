import {readFileSync} from 'node:fs';
import {buildSnapshot} from './prepare.ts';
import {dataRoot,files} from './local.ts';
import type {Runtime} from './local.ts';
// Owner-operated local admission; acquisition and hashing finish before ingress.
const root=dataRoot(),paths=files(root),runtime=JSON.parse(readFileSync(paths.runtime,'utf8')) as Runtime;
const spec=process.env.REVIEW_SOURCE_SPEC,expectedCurrentSnapshotId=process.env.REVIEW_EXPECTED_SNAPSHOT_ID,commandId=process.env.REVIEW_COMMAND_ID;
if(!spec||!expectedCurrentSnapshotId||!commandId)throw new Error('Explicit REVIEW_SOURCE_SPEC, REVIEW_EXPECTED_SNAPSHOT_ID and stable REVIEW_COMMAND_ID required');
const snapshot=buildSnapshot(JSON.parse(readFileSync(spec,'utf8')));
const payload=JSON.stringify({type:'AddSnapshot',identityScheme:'manual_git_v1',reviewId:runtime.reviewId,commandId,expectedCurrentSnapshotId,snapshot});
if(Buffer.byteLength(payload,'utf8')>8*1024*1024)throw new Error('invalid_request: encoded manifest exceeds 8 MiB');
const token=(JSON.parse(readFileSync(paths.user,'utf8')) as {token:string}).token;
const response=await fetch(`${runtime.gatewayUrl}/api/commands`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:payload});
const receipt=await response.json() as {state?:string};
console.log(JSON.stringify(receipt,null,2));
if(!response.ok||receipt.state!=='applied')process.exitCode=1;
