export function layoutGraph(nodes, directed, vertical) {
  const width = vertical ? 250 : 190, height = 110;
  const columns = directed ? vertical ? 1 : nodes.length : Math.max(1, Math.min(vertical ? 1 : 3, nodes.length));
  const positioned = nodes.map((node, index) => ({ ...node, x: index % columns * (width + 100), y: -Math.floor(index / columns) * (height + 80), width, height }));
  const edges = directed ? positioned.slice(0, -1).map((node, index) => {
    const target = positioned[index + 1];
    return { id: index, source: node.id, target: target.id, start: vertical ? { x: node.x, y: node.y - height / 2 } : { x: node.x + width / 2, y: node.y }, end: vertical ? { x: target.x, y: target.y + height / 2 } : { x: target.x - width / 2, y: target.y }, vertical };
  }) : [];
  return { nodes: positioned, edges };
}
export function graphBounds(nodes) {
  if (!nodes.length) return { left: -150, right: 150, top: 90, bottom: -90 };
  return { left: Math.min(...nodes.map((n) => n.x - n.width / 2)), right: Math.max(...nodes.map((n) => n.x + n.width / 2)), top: Math.max(...nodes.map((n) => n.y + n.height / 2)), bottom: Math.min(...nodes.map((n) => n.y - n.height / 2)) };
}
