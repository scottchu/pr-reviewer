/** Owned files are transport, never authorization or acquisition/admission witnesses. */
export type ArtifactReference=Readonly<{artifactId:string;jobId:string;invocationId:string;digest:string;bytes:number;schema:"import-result-v1"}>;
export type ArtifactErrorCode="invalid_input"|"invalid_reference"|"invalid_json"|"too_large"|"unsafe_root"|"unsafe_parent"|"unsafe_file"|"binding_mismatch"|"missing"|"integrity_mismatch"|"replaced"|"conflict"|"publication_unknown"|"io";
export type ImportArtifactError=Error & Readonly<{code:ArtifactErrorCode}>;
export type ImportArtifacts=Readonly<{
  write:(input:Readonly<{jobId:string;invocationId:string;value:unknown}>)=>Promise<ArtifactReference>;
  read:(input:Readonly<{reference:unknown;expectedJobId:string;expectedInvocationId:string}>)=>Promise<unknown>;
}>;
export {createImportArtifacts,isImportArtifactError,MAX_IMPORT_ARTIFACT_BYTES} from "./storage.ts";
