export type FileReading = {
  active: number;
  top: number;
  horizontal: Readonly<Record<number, number>>;
  mode: 'unified' | 'split';
  folds?: readonly string[];
  focusId?: string;
};
export type FileReadings = Readonly<Record<string, FileReading>>;
export const rememberFile = (readings: FileReadings, path: string, value: FileReading): FileReadings => ({
  ...readings,
  [path]: {
    ...value,
    horizontal: {
      ...value.horizontal
    },
    ...(value.folds ? {
      folds: [
        ...value.folds
      ]
    } : {})
  }
});
export type ReadingFocus = {
  id: string;
  path: string;
  name: string;
  before: readonly {
    startLine: number;
    endLine: number;
  }[];
  after: readonly {
    startLine: number;
    endLine: number;
  }[];
  preferredSide: 'before' | 'after';
  revealSide?: boolean;
  scope?: 'test';
};
