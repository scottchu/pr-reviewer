import {mockArtifact} from './mock-artifact.ts';
export const readMockArtifact=async(pageCount:number):Promise<{text:string;offset:number;complete:boolean;hash:string|null}>=>{
 const decoder=new TextDecoder('utf-8'),chunks:Uint8Array[]=[];let text='',offset=0;
 for(const page of mockArtifact.pages.slice(0,pageCount)){
  if(page.offset!==offset)throw new Error('mock_artifact_offset_mismatch');
  const bytes=Uint8Array.from(atob(page.base64),char=>char.charCodeAt(0));
  if(bytes.length+offset!==page.nextOffset||page.nextOffset>1048576)throw new Error('mock_artifact_byte_limit');
  chunks.push(bytes);offset=page.nextOffset;text+=decoder.decode(bytes,{stream:true});
 }
 const complete=offset===mockArtifact.byteLength;let hash:string|null=null;
 if(complete){text+=decoder.decode();const bytes=new Uint8Array(offset);let cursor=0;for(const chunk of chunks){bytes.set(chunk,cursor);cursor+=chunk.length;}hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');if(hash!==mockArtifact.sha256)throw new Error('mock_artifact_hash_mismatch');}
 return {text,offset,complete,hash};
};
