import {pr25Aliases} from './pr25-aliases.ts';
import {readSourceSnapshot} from '../read/git-snapshot.ts';
import type {AcquisitionEffects} from '../../source-acquisition/public.ts';
import {domainService} from '../domain/service.ts';
import {runSourcePipeline} from '../pipeline/run.ts';
import type {PipelineResult} from '../pipeline/run.ts';
import type {AttributedEnrichment} from '../enrich/attributed.ts';
import type {FactDocument,ParsedSnapshot,ExtractedComparison,SourceInput} from '../domain/types.ts';
import {prepareAppGraph,prepareAttribution} from './pr25.ts';
export const extractPreparedComparison=(parsed:ParsedSnapshot):ExtractedComparison=>{
 const facts=domainService.extractSnapshot(parsed);
 const comparison=domainService.compare(facts,pr25Aliases);
 const editCompositions=new Map(comparison.entities.filter(entity=>entity.data.comparisonStatus).map(entity=>[entity.id,domainService.classifyEdits(entity,facts,parsed.nativeDiffs)]));
 return {facts,comparison,nativeDiffs:parsed.nativeDiffs,editCompositions};
};
export const prepareFacts=async(repository:string,base:string,head:string,effects?:AcquisitionEffects):Promise<FactDocument>=>{
 const result=await runSourcePipeline({read:()=>readSourceSnapshot(repository,base,head,effects),parse:domainService.parseSnapshot,extract:extractPreparedComparison,enrich:()=>null});
 if(result.status==='failed')throw result.error;
 return result.facts;
};
export const prepareReviewComparison=async(repository:string,base:string,head:string,inputHash:(facts:FactDocument)=>string,effects?:AcquisitionEffects)=>{
 let sources:readonly SourceInput[]=[];
 const result=await runSourcePipeline({read:async()=>{const snapshot=await readSourceSnapshot(repository,base,head,effects);sources=snapshot.sources;return snapshot;},parse:domainService.parseSnapshot,extract:extractPreparedComparison,enrich:source=>prepareAttribution(source.facts,source.comparison,sources)});
 return assemblePreparedResult(result,inputHash);

};

export const assemblePreparedResult=(result:PipelineResult<AttributedEnrichment>,inputHash:(facts:FactDocument)=>string)=>{
 if(result.status==='failed'&&(!result.source||result.stage!=='enrich'))throw result.error;
 const source=result.status==='ready'?result.source:result.source!;
 const attribution=result.status==='ready'?result.enrichment:{nodes:[],edges:[]};
 return {facts:source.facts,graph:prepareAppGraph(source.facts,inputHash(source.facts),source.comparison,attribution,source.nativeDiffs,source.editCompositions),enrichmentStatus:result.status==='ready'?'ready' as const:'unavailable' as const};
};
