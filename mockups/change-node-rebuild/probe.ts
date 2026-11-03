export type BaselineSample = Readonly<{status: 'running' | 'elapsed' | 'error'; elapsed: number}>;
export type BaselineClock = Readonly<{
    now: () => number;
    schedule: (callback: () => void, delay: number) => number;
    cancel: (id: number) => void;
}>;

/** Diagnostic elapsed execution only; neither heartbeat nor completion establishes UI acceptance. */
export const startBaselineProbe = (clock: BaselineClock, publish: (sample: BaselineSample) => void) => {
    const started = clock.now();
    let active = true;
    let pending: number | undefined;
    const elapsed = () => Math.max(0, Math.round(clock.now() - started));
    const tick = () => {
        pending = undefined;
        if (!active) return;
        const duration = elapsed();
        if (duration >= 30000) active = false;
        publish({status: active ? 'running' : 'elapsed', elapsed: duration});
        if (active) pending = clock.schedule(tick, 2000);
    };
    tick();
    const dispose = () => {
        active = false;
        if (pending !== undefined) clock.cancel(pending);
        pending = undefined;
    };
    return {
        fail: () => {
            if (!active) return;
            dispose();
            publish({status: 'error', elapsed: elapsed()});
        },
        dispose,
    };
};
