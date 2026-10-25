export type AttentionRect = Readonly<{ left: number; top: number; right: number; bottom: number }>;
export type AttentionCamera = Readonly<{ x: number; y: number; zoom: number }>;

// Frame the readable leading portion of the same file header, without zooming.
export const storyAttentionCamera = (camera: AttentionCamera, target: AttentionRect, area: AttentionRect): AttentionCamera | null => {
  if (area.right <= area.left || area.bottom <= area.top) return null;
  const right = Math.min(target.right, target.left + area.right - area.left);
  const bottom = Math.min(target.bottom, target.top + area.bottom - area.top);
  const x = target.left < area.left ? area.left - target.left : right > area.right ? area.right - right : 0;
  const y = target.top < area.top ? area.top - target.top : bottom > area.bottom ? area.bottom - bottom : 0;
  return x || y ? { x: camera.x + x, y: camera.y + y, zoom: camera.zoom } : null;
};
