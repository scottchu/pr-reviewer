import {createHash} from 'node:crypto';
import {z} from 'zod';
import {headTestScopeSchema,headTestCommandSchema,headTestQuerySchema,headTestArtifactQuerySchema,headTestCanonical} from '../src/domain/public.ts';
import {cliTargets,cliReceipt,cliView,cliArtifact} from './head-test-protocol.ts';
const fail=(code:string):never=>{throw new Error(code);};
const same=(condition:unknown)=>{if(!condition)fail('response_schema');};
const specifications:Record<string,readonly string[]>={targets:['review','snapshot'],request:['review','snapshot','command-id','target','target-revision'],status:['review','snapshot','job','minimum-revision?'],result:['review','snapshot','job','minimum-revision?'],artifact:['review','snapshot','job','artifact','offset?','length?','text?'],cancel:['job','command-id','job-revision']};
const parse=(argv:readonly string[])=>{
 const command=argv[0]??'',spec=Object.hasOwn(specifications,command)?specifications[command]:undefined;if(!spec||(argv.length-1)%2!==0)fail('invalid_arguments');const args:Record<string,string>={};const allowed=new Set(['gateway',...spec!.map(key=>key.replace(/\?$/,''))]);
 for(let i=1;i<argv.length;i+=2){const key=argv[i]!,value=argv[i+1]!;if(!key.startsWith('--')||!allowed.has(key.slice(2))||Object.hasOwn(args,key.slice(2))||!value||value.length>1024||value.startsWith('--'))fail('invalid_arguments');args[key.slice(2)]=value;}
 for(const key of ['gateway',...spec!.filter(key=>!key.endsWith('?'))])if(!args[key])fail('invalid_arguments');
 const decimal=(key:string)=>{const value=args[key];if(value===undefined)return undefined;if(!/^(?:0|[1-9][0-9]*)$/.test(value)||!Number.isSafeInteger(Number(value)))fail('invalid_arguments');return Number(value);};
 let gateway:URL;try{gateway=new URL(args.gateway!);}catch{fail('invalid_gateway');}
 if(gateway!.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(gateway!.hostname)||gateway!.username||gateway!.password||gateway!.pathname!=='/'||gateway!.search||gateway!.hash||![gateway!.origin,gateway!.origin+'/'].includes(args.gateway!))fail('invalid_gateway');
 const scope={reviewId:args.review,snapshotId:args.snapshot};let path:string,body:Record<string,unknown>;
 if(command==='request'||command==='cancel'){path='/api/commands';body=headTestCommandSchema.parse(command==='request'?{type:'RequestTest',...scope,commandId:args['command-id'],targetId:args.target,expectedTargetRevision:decimal('target-revision')}:{type:'CancelTest',commandId:args['command-id'],jobId:args.job,expectedJobRevision:decimal('job-revision')});}
 else if(command==='targets'){path='/api/tests/targets';body=headTestScopeSchema.parse(scope);}
 else if(command==='artifact'){if(args.text!==undefined&&(args.text!=='true'||args.offset!==undefined||args.length!==undefined))fail('invalid_arguments');path='/api/tests/artifact';body=headTestArtifactQuerySchema.parse({...scope,jobId:args.job,artifactId:args.artifact,...(args.offset!==undefined?{offset:decimal('offset')}:{}),...(args.length!==undefined?{length:decimal('length')}: {})});}
 else{path='/api/tests/jobs';body=headTestQuerySchema.parse({...scope,jobId:args.job,...(args['minimum-revision']!==undefined?{minimumJobRevision:decimal('minimum-revision')}: {})});}
 return {command,gateway:gateway!.origin,path,body,text:args.text==='true',mutation:command==='request'||command==='cancel'};
};
const remoteErrors=new Set(['test_artifact_unavailable','artifact_integrity_error','invalid_artifact_offset','qualification_required','test_job_unavailable','test_target_unavailable','test_target_conflict','repository_not_configured','execution_not_configured','test_queue_full','test_history_limit','test_storage_limit','test_job_conflict','stale_execution_owner','command_conflict','revision_unavailable','unauthorized','stale_attachment','invalid_request','source_unavailable']);
const run=async()=>{
 let operation:ReturnType<typeof parse>|undefined,sent=false;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  operation=parse(process.argv.slice(2));const op=operation;
  const request=async(body:Record<string,unknown>)=>{
   let response:Response;try{sent=true;response=await fetch(op.gateway+op.path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'manual',signal:controller.signal});}catch{fail(controller.signal.aborted?'deadline_exceeded':'transport_error');}
   if(response!.status>=300&&response!.status<400){await response!.body?.cancel();fail('http_error');}
   const reader=response!.body?.getReader();if(!reader)fail('response_schema');const chunks:Uint8Array[]=[];let size=0;const maximum=op.command==='artifact'?128*1024:4*1024*1024;
   try{while(true){const {done,value}=await reader!.read();if(done)break;size+=value.length;if(size>maximum){await reader!.cancel();fail('response_limit');}chunks.push(value);}}catch(error){if(error instanceof Error&&error.message==='response_limit')throw error;fail(controller.signal.aborted?'deadline_exceeded':'transport_error');}finally{reader!.releaseLock();}
   let value:unknown;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('response_schema');}
   if(!response!.ok){const parsed=z.object({error:z.string()}).strict().safeParse(value);fail(parsed.success&&remoteErrors.has(parsed.data.error)?parsed.data.error:'http_error');}
   if(!/^application\/json(?:\s*;|$)/i.test(response!.headers.get('content-type')??''))fail('response_schema');return value;
  };
  let output:unknown;
  if(op.mutation){const value=cliReceipt.parse(await request(op.body));same(value.commandId===op.body.commandId);if(op.command==='request')same(value.reviewId===op.body.reviewId&&value.snapshotId===op.body.snapshotId&&value.result.disposition==='queued');else same(value.jobId===op.body.jobId&&value.result.disposition!=='queued');output=value;}
  else if(op.command==='targets'){const value=cliTargets.parse(await request(op.body));same(value.reviewId===op.body.reviewId&&value.snapshotId===op.body.snapshotId);output=value;}
  else if(op.command==='artifact'){
   const page=async(body:Record<string,unknown>)=>{const value=cliArtifact.parse(await request(body)),offset=Number(body.offset??0),expectedEnd=Math.min(value.totalBytes,offset+Number(body.length??65536)),bytes=Buffer.from(value.data,'base64');same(value.jobId===body.jobId&&value.artifactId===body.artifactId&&value.offset===offset&&value.nextOffset===expectedEnd&&value.bytes===expectedEnd-offset&&value.complete===(expectedEnd===value.totalBytes)&&bytes.length===value.bytes&&bytes.toString('base64')===value.data);return {value,bytes};};
   if(!op.text)output=(await page(op.body)).value;
   else{let offset=0,identity:{sha256:string;totalBytes:number}|undefined,text='';const digest=createHash('sha256'),decoder=new TextDecoder('utf-8');
    for(let count=0;count<33;count++){const {value,bytes}=await page({...op.body,offset,length:65536});if(!identity)identity={sha256:value.sha256,totalBytes:value.totalBytes};same(value.sha256===identity.sha256&&value.totalBytes===identity.totalBytes);digest.update(bytes);text+=decoder.decode(bytes,{stream:true});offset=value.nextOffset;
     if(value.complete){text+=decoder.decode();if(digest.digest('hex')!==identity.sha256)fail('artifact_integrity_error');output={jobId:value.jobId,artifactId:value.artifactId,sha256:value.sha256,totalBytes:value.totalBytes,text};break;}if(count===32)fail('response_limit');
    }
   }
  }else{const value=cliView.parse(await request(op.body)),job=value.selectedJob;same(value.reviewId===op.body.reviewId&&value.snapshotId===op.body.snapshotId&&job&&job.jobId===op.body.jobId&&job.reviewId===op.body.reviewId&&job.snapshotId===op.body.snapshotId&&job.jobRevision>=Number(op.body.minimumJobRevision??0)&&value.nextCursor===null&&value.jobs.length===1&&headTestCanonical(value.jobs[0])===headTestCanonical(job));
   if(job!.result){const {resultId,...resultBody}=job!.result,intent=resultBody.intent;same(resultBody.jobId===job!.jobId&&resultBody.invocationId===job!.invocations.at(-1)?.invocationId&&resultBody.state===job!.state&&intent.reviewId===job!.reviewId&&intent.snapshotId===job!.snapshotId&&intent.actorId===job!.actorId&&intent.repository===job!.repository&&intent.baseSha===job!.baseSha&&intent.headSha===job!.headSha&&intent.targetDigest===job!.target.digest&&intent.qualificationId===(job!.qualificationId??null)&&createHash('sha256').update(headTestCanonical(resultBody)).digest('hex')===resultId);}
   output=op.command==='status'?value:{reviewId:job!.reviewId,snapshotId:job!.snapshotId,jobId:job!.jobId,jobRevision:job!.jobRevision,state:job!.state,result:job!.result??null};
  }
  const encoded=JSON.stringify(output)+'\n';if(Buffer.byteLength(encoded)>16*1024*1024)fail('output_limit');process.stdout.write(encoded);
 }catch(error){const code=error instanceof z.ZodError?(sent?'response_schema':'invalid_arguments'):error instanceof Error&&/^[a-z][a-z0-9_]{0,63}$/.test(error.message)?error.message:'client_error';process.exitCode=1;process.stdout.write(JSON.stringify({ok:false,error:{code,outcome:!sent?'not_sent':operation?.mutation?'unknown':'unavailable',...(operation?.mutation?{commandId:operation.body.commandId}:{})}})+'\n');}
 finally{clearTimeout(timer);}
};
await run();
