import prepared from './callback-display.json' with { type: 'json' };
import type { CallAnchor, FunctionIdentity } from './calls.ts';

export type CallbackDisplay = {
  id: string;
  canonicalName: string;
  displayName: string;
  propertyName: string;
  basis: 'static-object-property';
  declaration: CallAnchor;
};
export type DisplayTarget = Pick<FunctionIdentity, 'id' | 'name' | 'declaration'>;
const records = prepared.records as readonly CallbackDisplay[];
const coordinates = ['snapshotId', 'side', 'path', 'contentHash', 'start', 'end', 'startLine', 'endLine'] as const;

// An alias describes exact prepared source; it never changes canonical identity.
export const callDisplayName = (node: DisplayTarget, overlays: readonly CallbackDisplay[] = records): string => {
  if (!/^<callback@\d+>$/.test(node.name)) return node.name;
  const matches = overlays.filter(record => record.id === node.id && record.canonicalName === node.name
    && coordinates.every(key => record.declaration[key] === node.declaration[key]));
  return matches.length === 1 ? matches[0]!.displayName : node.name;
};
