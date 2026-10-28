// Own native page-scaling defaults, while leaving graph and reader handlers live.
export const installPageGestureBoundary = (root: HTMLElement): (() => void) => {
  const touch = (event: TouchEvent) => {
    if (event.touches.length > 1 && event.cancelable) event.preventDefault();
  };
  const gesture = (event: Event) => {
    if (event.cancelable) event.preventDefault();
  };
  const wheel = (event: WheelEvent) => {
    // Trackpad pinch is delivered as Control-wheel. Do not stop propagation:
    // React Flow still owns its canvas zoom; native page scaling is prevented.
    if (event.ctrlKey && event.cancelable) event.preventDefault();
  };
  const options: AddEventListenerOptions = { capture: true, passive: false };
  root.addEventListener('touchmove', touch, options);
  root.addEventListener('wheel', wheel, options);
  for (const type of ['gesturestart', 'gesturechange']) root.addEventListener(type, gesture, options);
  return () => {
    root.removeEventListener('touchmove', touch, options);
    root.removeEventListener('wheel', wheel, options);
    for (const type of ['gesturestart', 'gesturechange']) root.removeEventListener(type, gesture, options);
  };
};
