import type { FileDiff } from './file-diff.tsx';
export type PreparedSummary = {
  what: string;
  why: string;
  identity: string;
};
const summaries: Readonly<Record<string, {
  header: string;
  what: string;
  why: string;
}>> = {
  'src/storage/public.ts:0': {
    header: '@@ -1,3 +1,5 @@',
    what: 'The store imports the shared local-owner access helpers. They support the authentication change further down this file.',
    why: 'Source fact: the added imports are used by the changed authenticate implementation and exposed localOwner capability. Their presence alone does not establish execution or security.'
  },
  'src/storage/public.ts:1': {
    header: '@@ -195,12 +197,13 @@',
    what: 'Local-owner access is recognized before credential lookup. Other credentials continue through the lookup path.',
    why: 'Source fact: authenticate derives an access reference, returns a matching local principal first, then queries credentials for other references. Inference: this lets trusted local-owner access share the existing store operations without issuing a browser credential. Runtime behavior is not established by this fixture.'
  },
  'src/storage/public.ts:2': {
    header: '@@ -279,13 +282,8 @@',
    what: 'The returned store reuses the shared authenticate implementation instead of a duplicate credential-only method. It also exposes the local-owner capability.',
    why: 'Source fact: the duplicate arrow is removed and replaced by authenticate and localOwner: localOwnerAccess. Inference: reuse keeps these entry points on the same owner-or-credential path. This is not a security guarantee.'
  },
  'src/storage/access.ts:0': {
    header: '@@ -0,0 +1,14 @@',
    what: 'A new helper distinguishes the exact in-process local-owner capability from credential strings. Credentials are hashed; the owner capability maps to the local-user principal.',
    why: 'Source fact: accessReference checks object identity for the owner capability, hashes strings, and rejects other objects; localPrincipal recognizes the owner reference. The capability is described by the source as in-process, not a serialized browser credential. Delivery and security properties are unverified here.'
  },
  'src/application/review.ts:2': {
    header: '@@ -26,7 +27,7 @@',
    what: 'Requests delegate their access headers instead of always adding Bearer. Local-owner requests omit Bearer; explicit credentials retain it.',
    why: 'Source fact: the request spreads accessHeaders(captured), whose pinned local-access.ts implementation makes that choice. The fetch body and cancellation context remain. Inference: delegation centralizes the access-header choice; no successful execution is claimed.'
  },
  'scripts/dev.ts:3': {
    header: '@@ -78,7 +65,7 @@',
    what: 'The startup message keeps the review URL and runtime manifest, and removes the local-login credential reference.',
    why: 'Inference: the message now agrees with the removed token-loading and issuing flow in this file. The diff does not prove author intent or a successful run.'
  }
};
export const summaryFor = (file: FileDiff, index: number): PreparedSummary | null => {
  const prepared = summaries[`${file.path}:${index}`];
  const hunk = file.hunks[index];
  if (!prepared || !hunk?.header.startsWith(prepared.header))
    return null;
  return {
    what: prepared.what,
    why: prepared.why,
    identity: `${file.path}:${file.before.hash ?? 'absent'}:${file.after.hash ?? 'absent'}:${hunk.header}`
  };
};
