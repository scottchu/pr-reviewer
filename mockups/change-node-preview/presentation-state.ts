import type {DiffMode, SourceRelation} from '../pr-file-tree/file-diff.tsx';
import type {FileReading} from '../pr-file-tree/reading.ts';
export type ReaderProjectionState = Readonly<{mode: DiffMode; reading?: FileReading; inspected: SourceRelation | null}>;
export type TestProjectionState = Readonly<{open: boolean; selectedId: string | null}>;
/** Owned by one preview comparison mount; no DOM or cross-comparison global state. */
export const createComposedPresentationState = () => {
    const readers = new Map<string, ReaderProjectionState>();
    const tests = new Map<string, TestProjectionState>();
    const reader = (id: string): ReaderProjectionState => readers.get(id) ?? {mode: 'unified', inspected: null};
    const test = (id: string): TestProjectionState => tests.get(id) ?? {open: false, selectedId: null};
    return {
        reader, test,
        saveReader: (id: string, value: Partial<ReaderProjectionState>) => readers.set(id, {...reader(id), ...value}),
        saveTest: (id: string, value: Partial<TestProjectionState>) => tests.set(id, {...test(id), ...value}),
    };
};
export type ComposedPresentationState = ReturnType<typeof createComposedPresentationState>;
