import clients from './calls-clients.json' with { type: 'json' };
import storage from './calls-storage.json' with { type: 'json' };
import scope from './calls-scope.json' with { type: 'json' };
import tests from './declared-tests.json' with { type: 'json' };
import type { ChangeCenteredTestEvidence } from './declared-tests.types.ts';
export type CallAnchor = {
  snapshotId: string;
  side: 'base' | 'head';
  path: string;
  contentHash: string;
  start: number;
  end: number;
  startLine: number;
  endLine: number;
};
export type FunctionIdentity = {
  id: string;
  name: string;
  declaration: CallAnchor;
  body: CallAnchor;
  sourceUnchanged: boolean;
  seed: boolean;
};
export type CallLink = {
  id: string;
  caller: string;
  callee: string;
  target: CallAnchor;
  sites: readonly {
    anchor: CallAnchor;
    sourceText: string;
  }[];
  certainty: 'resolved_static' | 'source_observed_manual';
  method: string;
  analyzerReason: string | null;
};
type PacketNode = Omit<FunctionIdentity, 'sourceUnchanged' | 'seed'> & {
  exactBodySHA256?: string;
};
type Packet = {
  seeds: readonly PacketNode[];
  nodes: readonly PacketNode[];
  contextDeclarations: readonly PacketNode[];
  edges: readonly Omit<CallLink, 'analyzerReason'>[];
  sourceObservedCalls: readonly (Omit<CallLink, 'sites' | 'analyzerReason'> & {
    site?: {
      anchor: CallAnchor;
      sourceText: string;
    };
    sites?: readonly { anchor: CallAnchor; sourceText: string }[];
    analyzerDisposition: {
      reason: string;
    };
  })[];
};
const packets = [
  clients, storage, scope
] as unknown as readonly Packet[];
const declaredTests = tests as ChangeCenteredTestEvidence;
export const projectCalls = (path: string | null) => {
  const seeds = packets.flatMap(packet => packet.seeds).filter(node => node.declaration.path === path);
  const seedIds = new Set(seeds.map(node => node.id));
  const links: CallLink[] = packets.flatMap(packet => [
    ...packet.edges.map(edge => ({
      ...edge,
      analyzerReason: null
    })),
    ...packet.sourceObservedCalls.map(call => ({
      id: call.id,
      caller: call.caller,
      callee: call.callee,
      target: call.target,
      sites: call.sites ?? (call.site ? [call.site] : []),
      certainty: call.certainty,
      method: call.method,
      analyzerReason: call.analyzerDisposition.reason
    })),
  ]).filter(link => seedIds.has(link.caller) || seedIds.has(link.callee));
  const nodeIds = new Set([
    ...seedIds, ...links.flatMap(link => [
      link.caller, link.callee
    ])
  ]);
  const identities = new Map(packets.flatMap(packet => [
    ...packet.nodes, ...packet.contextDeclarations, ...packet.seeds,
  ]).map(node => [
    node.id, node
  ]));
  // Only exact refresh-body proof in the source packet establishes unchanged source.
  const unchanged = new Set(packets.flatMap(packet => packet.contextDeclarations)
    .filter(node => node.exactBodySHA256 && packets.flatMap(packet => packet.contextDeclarations).some(other =>
      other.declaration.side !== node.declaration.side && other.declaration.path === node.declaration.path
      && other.name === node.name && other.exactBodySHA256 === node.exactBodySHA256))
    .map(node => node.id));
  const nodes = [
    ...nodeIds
  ].map(id => {
    const node = identities.get(id);
    if (!node)
      throw new Error('prepared_call_identity_missing');
    return {
      ...node,
      sourceUnchanged: unchanged.has(id),
      seed: seedIds.has(id)
    };
  });
  return {
    prepared: seeds.length > 0,
    seeds: nodes.filter(node => node.seed),
    nodes,
    links,
    frontier: seeds.length
      ? 'Prepared one-hop source context only; other callers, dispatch and runtime behavior remain unknown.'
      : 'Call context is not prepared for this file. This does not mean no calls.'
  };
};
export const projectBehaviorCalls = () => {
  const projections = [...new Set(packets.flatMap(packet => packet.seeds.map(node => node.declaration.path)))].map(projectCalls);
  const seedIds = new Set(packets.flatMap(packet => packet.seeds.map(node => node.id)));
  const nodes = [...new Map(projections.flatMap(projection => projection.nodes).map(node => [node.id, node])).values()]
    .map(node => ({ ...node, seed: seedIds.has(node.id) }));
  const links = [...new Map(projections.flatMap(projection => projection.links).map(link => [link.id, link])).values()];
  return { prepared: true, nodes, links, seeds: nodes.filter(node => node.seed),
    frontier: 'Prepared direct source neighborhoods only. Other callers, dispatch and unprepared source scopes remain unknown.' };
};
export const relevantTests = (functionId: string) => declaredTests.cases.filter(record => record.functionMappings.some(mapping => mapping.targetId === functionId));
export const callCitation = (link: CallLink) => [
  link.certainty === 'resolved_static' ? 'Statically resolved call' : 'Source-observed call',
  ...link.sites.map(site => `${site.anchor.side} ${site.anchor.path}:${site.anchor.startLine} · SHA256 ${site.anchor.contentHash} · UTF-16 ${site.anchor.start}–${site.anchor.end}\n${site.sourceText}`),
  `Target ${link.target.side} ${link.target.path}:${link.target.startLine} · SHA256 ${link.target.contentHash} · UTF-16 ${link.target.start}–${link.target.end}`,
  ...(link.analyzerReason ? [
    `Analyzer frontier retained: ${link.analyzerReason}`
  ] : []),
].join('\n');
export const layoutCalls = (projection: ReturnType<typeof projectCalls>, origin: {
  x: number;
  y: number;
}, width = 200) => {
  const positioned: {
    identity: FunctionIdentity;
    x: number;
    y: number;
  }[] = [];
  let top = origin.y;
  for (const side of [
    'base', 'head'
  ] as const) {
    const sideNodes = projection.nodes.filter(node => node.declaration.side === side);
    if (!sideNodes.length)
      continue;
    const columns = [
      sideNodes.filter(node => !node.seed && projection.links.some(link => link.caller === node.id && projection.seeds.some(seed => seed.id === link.callee))),
      sideNodes.filter(node => node.seed),
      sideNodes.filter(node => !node.seed && !projection.links.some(link => link.caller === node.id && projection.seeds.some(seed => seed.id === link.callee))),
    ];
    const rows = Math.max(...columns.map(column => column.length));
    columns.forEach((column, x) => column.forEach((identity, y) => {
      positioned.push({
        identity,
        x: origin.x + x * (width + 38),
        y: top + y * 70
      });
    }));
    top += rows * 70 + 65;
  }
  return positioned;
};
export const declaredTestSummary = (record: {
  id: string;
  summary: string;
}) => {
  const concise: Readonly<Record<string, string>> = {
    'review-owner-changed': 'Asserts owner opening without a token, question/reply recovery after restart, and no Authorization on API requests.',
    'gateway-retained': 'Asserts invalid/bootstrap credential rejection, attached-agent access, request bounds and managed shutdown.',
    'gateway-owner-added': 'Asserts header-free owner reads/writes and replay, while explicit invalid credentials are rejected.',
    'imports-owner-added': 'Asserts owner import/cancel/restart recovery, retained credential access and the claimed owner reference.'
  };
  return concise[record.id] ?? record.summary;
};
