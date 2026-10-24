import {analyzeNeighborhood,listNeighborhoodDeclarations} from '../source-analysis/public.ts';
import {CEILINGS,digest,frame,parseFrame,validateRequest} from './protocol.ts';
import type {WorkerEnvelope} from './contract.ts';

// This entry is app code. The compiler's virtual host receives only framed source values.
const chunks:Buffer[]=[];let length=0,failed=false;
const fail=()=>{if(failed)return;failed=true;process.stdin.destroy();process.exitCode=1;};
process.stdin.on('data',(chunk:Buffer)=>{
 if(failed)return;length+=chunk.length;if(length>CEILINGS.inputBytes+4){fail();return;}chunks.push(chunk);
 if(length>=4){const prefix=Buffer.concat(chunks,Math.min(length,4));if(prefix.readUInt32BE(0)>CEILINGS.inputBytes)fail();}
});
process.stdin.once('error',fail);
process.stdin.once('end',()=>{
 if(failed)return;
 try{const request=validateRequest(parseFrame(Buffer.concat(chunks),CEILINGS.inputBytes));
  const common={protocol:request.protocol,invocationId:request.invocationId,inputFingerprint:digest(request.input)};
  const envelope:WorkerEnvelope=request.phase==='inventory'?{...common,phase:'inventory',result:listNeighborhoodDeclarations(request.input)}:{...common,phase:'compute',result:analyzeNeighborhood(request.input)};
  const output=frame(envelope,CEILINGS.outputBytes);process.stdout.write(output);
 }catch{fail();}
});
