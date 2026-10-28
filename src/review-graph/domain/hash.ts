import { createHash } from 'node:crypto';
export const sourceHash = (value: string): string => createHash('sha256').update(value).digest('hex');
