export type HeadOutputRole='git_prepare'|'runtime_version'|'test_root';
export type HeadOutputChunk=Readonly<{role:HeadOutputRole;channel:'stdout'|'stderr';data:Uint8Array}>;
/** One attempt shares this budget; snapshots cannot mutate retained bytes. */
export const createHeadOutputBudget=(maximum=1024*1024)=>{
 if(!Number.isSafeInteger(maximum)||maximum<1||maximum>1024*1024)throw new Error('invalid_output_budget');
 let observedBytes=0,retainedBytes=0,overflow=false;const chunks:HeadOutputChunk[]=[];
 return {
  append:(role:HeadOutputRole,channel:'stdout'|'stderr',data:Uint8Array):boolean=>{
   observedBytes=Math.min(maximum+1,observedBytes+data.byteLength);
   if(overflow||observedBytes>maximum||chunks.length>=4096){overflow=true;return false;}
   if(data.byteLength){chunks.push({role,channel,data:Uint8Array.from(data)});retainedBytes+=data.byteLength;}return true;
  },
  snapshot:()=>({observedBytes,retainedBytes,overflow,chunks:structuredClone(chunks)}),
 };
};
export type HeadOutputBudget=ReturnType<typeof createHeadOutputBudget>;
