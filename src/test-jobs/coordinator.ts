import type {Store,HeadTestGrant} from '../storage/public.ts';
import {createRegistry} from '../integration/registry.ts';
import {prepareHeadTestInputs,executePreparedHeadTest} from './preparation.ts';
import {observeHeadTestOutcome} from './outcome.ts';
import {observeHeadTestQuiescence} from './evidence.ts';
export type HeadTestRunnerOptions=Readonly<{executionRoot:string;artifactRoot:string;fixtureInputs?:Readonly<{repository:string;donor:string}>}>;
export const createTestRunner=(store:Store,options:HeadTestRunnerOptions)=>{
 const tests=store.tests,owner=tests.beginOwner(),registry=createRegistry();let active=false,stopped=false,fenced=false,current:Promise<void>|null=null,grant:HeadTestGrant|null=null,failure:string|null=null;
 const note=(error:unknown)=>{const raw=error instanceof Error?error.message:'test_owner_failed';failure=/^[a-z][a-z0-9_]{0,63}$/.test(raw)?raw:'test_owner_failed';if(raw==='stale_execution_owner'||raw==='stale_test_owner')fenced=true;};
 const pending:(()=>void)[]=[];
 const admission=registry.register('verified-head-test-result-to-admission','test-owner',()=>!fenced,()=>{while(pending.length)pending.shift()!();});
 const tick=async()=>{
  if(active||stopped||fenced)return;active=true;
  try{
   for(const journal of tests.unknown(owner)){const witness=observeHeadTestQuiescence(journal);if(witness)tests.reconcileQuiescence(owner,witness);}
   while(!stopped&&!fenced){
    const claim=tests.claim(owner);if(!claim)break;grant=claim.grant;
    try{
     try{const witness=await prepareHeadTestInputs({store,grant,executionRoot:options.executionRoot,...(options.fixtureInputs?{fixtureInputs:options.fixtureInputs}:{})});tests.prepared(grant,witness);await executePreparedHeadTest({store,grant,witness});}catch(error){note(error);}
     if(fenced)break;
     const ownedGrant=grant;let settled=false;
     for(let observation=0;observation<2&&!settled;observation++){
      try{const observed=await observeHeadTestOutcome({store,grant:ownedGrant,artifactRoot:options.artifactRoot});
       if(!observed){tests.markUnknown(ownedGrant,'test_effect_unresolved');settled=true;break;}
       pending.push(()=>{tests.complete(ownedGrant,observed);});admission.emit();settled=true;
      }catch(error){const reason=error instanceof Error?error.message:'';if(observation===1||!['test_outcome_changed','invalid_test_witness'].includes(reason))throw error;}
     }
    }catch(error){note(error);try{tests.markUnknown(grant,'test_outcome_unavailable');}catch{/* A committed receipt or replacement epoch remains authoritative. */}}
    finally{grant=null;}
   }
  }finally{active=false;}
 };
 const requests=registry.register('head-test-request-committed-to-owner','test-owner',()=>!stopped&&!fenced,()=>{if(active||stopped||fenced)return;current=tick();void current.catch(note);});
 const timer=setInterval(()=>requests.emit(),200);requests.emit();
 return {
  wake:()=>requests.emit(),idle:async()=>{await current;},
  diagnostics:()=>{let jobs:ReturnType<typeof tests.diagnostics>=[];if(!fenced)try{jobs=tests.diagnostics(owner);}catch(error){note(error);}return registry.diagnostics().map(route=>({...route,disposition:fenced?'fenced':stopped?'stopped':'active',failure,jobs}));},
  stop:async()=>{if(stopped){await current;return;}stopped=true;clearInterval(timer);if(grant)try{tests.recordStop(grant,'test_owner_stopped');}catch(error){note(error);}await current?.catch(note);pending.length=0;registry.dispose();},
 };
};
