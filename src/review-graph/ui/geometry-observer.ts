export type FrameClock = Readonly<{
    request: (callback: () => void) => number;
    cancel: (id: number) => void;
}>;

export const createMeasurementScheduler = (measure: () => void, clock: FrameClock = {
    request: callback => requestAnimationFrame(callback),
    cancel: id => cancelAnimationFrame(id),
}) => {
    let pending: number | undefined;
    let disposed = false;
    return {
        schedule: () => {
            if (disposed || pending !== undefined) return;
            pending = clock.request(() => {
                pending = undefined;
                if (!disposed) measure();
            });
        },
        dispose: () => {
            disposed = true;
            if (pending !== undefined) clock.cancel(pending);
            pending = undefined;
        },
    };
};

export const observeGeometry = (elements: readonly HTMLElement[], measure: () => void) => {
    const connected = () => { if (elements.every(element => element.isConnected)) measure(); };
    const scheduler = createMeasurementScheduler(connected);
    connected();
    const observer = new ResizeObserver(scheduler.schedule);
    elements.forEach(element => observer.observe(element));
    return () => { observer.disconnect(); scheduler.dispose(); };
};
