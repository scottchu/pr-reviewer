export type FileBounds = { x: number; y: number; width: number; height: number };
export type FileCallRoute = { path: string; label: { x: number; y: number }; start: { x: number; y: number }; end: { x: number; y: number } };

// Geometry only: no semantic ports, shared bus or new relationship facts.
export const directFileCallRoute = (source: FileBounds, target: FileBounds, lane: number, count: number, targetIndex: number, targetCount: number, narrow: boolean): FileCallRoute => {
  const end = { x: target.x + target.width * (targetIndex + 1) / (targetCount + 1), y: target.y > source.y + source.height ? target.y : target.y + target.height };
  if (count > 1) {
    const start = { x: source.x + source.width * (count - lane) / (count + 1), y: source.y + source.height };
    const step = narrow ? 100 : 86;
    const y = source.y + source.height + 90 + lane * step;
    const left = source.x + source.width + 24;
    const right = target.x - 24;
    return { start, end, path: `M${start.x},${start.y} C${start.x},${y + 24} ${left - 24},${y} ${left},${y} H${right} C${right + 24},${y} ${end.x},${end.y - 24} ${end.x},${end.y}`, label: { x: left + 8, y: y - (narrow ? 76 : 54) } };
  }

  const separated = source.x + source.width + 40 < target.x;
  if (narrow && separated && source.y > target.y + target.height + 80) {
    const start = { x: source.x + source.width, y: source.y + source.height / 2 };
    // The narrow review chip and its labels occupy the middle corridor.
    // Distinct right-hand curves stay outside those actual content bounds.
    const right = target.x + target.width + 8 + targetIndex * 6;
    const turn = target.y + target.height + 44;
    return { start, end, path: `M${start.x},${start.y} C${right},${start.y} ${right},${start.y} ${right},${start.y - 24} V${turn} C${right},${end.y + 20} ${end.x},${end.y + 20} ${end.x},${end.y}`, label: { x: source.x + 8, y: source.y + source.height + 48 } };
  }
  const start = separated ? { x: source.x + source.width, y: source.y + source.height / 2 } : { x: source.x + source.width / 2, y: source.y };
  if (separated && Math.abs(start.y - (target.y + target.height / 2)) < 160) {
    const finish = { x: target.x, y: target.y + target.height / 2 };
    const gap = Math.max(24, (finish.x - start.x) / 2);
    return { start, end: finish, path: `M${start.x},${start.y} C${start.x + gap},${start.y} ${finish.x - gap},${finish.y} ${finish.x},${finish.y}`, label: { x: start.x + 8, y: Math.max(start.y, finish.y) + 28 } };
  }
  return { start, end, path: narrow ? `M${start.x},${start.y} C${start.x},${start.y - 32} ${end.x},${end.y + 32} ${end.x},${end.y}` : `M${start.x},${start.y} C${end.x},${start.y} ${end.x},${end.y + 90} ${end.x},${end.y}`, label: { x: source.x + 8, y: source.y + source.height + 48 } };
};
