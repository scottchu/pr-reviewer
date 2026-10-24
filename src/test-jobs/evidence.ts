import {createHash} from 'node:crypto';
import {headTestCanonical,processQuiescenceEligible} from '../domain/public.ts';
import {processQuiescent} from '../import-jobs/public.ts';
import type {HeadTestJournal} from '../storage/public.ts';
declare const quiescenceBrand: unique symbol;
export type HeadTestQuiescenceWitness = Readonly<{[quiescenceBrand]: true}>;
const observed = new WeakMap<object,{journal: HeadTestJournal; fingerprint: string; scope: 'all' | 'processes'}>();
const fingerprint = (journal: HeadTestJournal) => createHash('sha256').update(headTestCanonical(journal)).digest('hex');
/** Read-only OS observation. This never signals, launches or accepts caller-supplied proof. */
const observe = (input: HeadTestJournal,scope:'all'|'processes'): HeadTestQuiescenceWitness | null => {
 const journal = structuredClone(input), invocation = journal.invocation;
 if (invocation.processJournalVersion !== 1 || !Array.isArray(invocation.processes) || !Array.isArray(invocation.filesystemRoots) || scope === 'all' && invocation.filesystemRoots.length !== 0 ||
     !invocation.processes.every(process => processQuiescenceEligible(process) && processQuiescent(process))) return null;
 const witness = Object.freeze({}) as HeadTestQuiescenceWitness;
 observed.set(witness,{journal,fingerprint:fingerprint(journal),scope});return witness;
};
export const observeHeadTestQuiescence = (input:HeadTestJournal) => observe(input,'all');
export const observeHeadTestProcessQuiescence = (input:HeadTestJournal) => observe(input,'processes');
export const readHeadTestQuiescence = (witness: HeadTestQuiescenceWitness): HeadTestJournal | null => {
 const value=observed.get(witness);return value?.scope === 'all' ? structuredClone(value.journal) : null;
};
export const isHeadTestQuiescence = (witness: HeadTestQuiescenceWitness,journal: HeadTestJournal): boolean => observed.get(witness)?.scope === 'all' && observed.get(witness)?.fingerprint === fingerprint(journal);
export const isHeadTestProcessQuiescence = (witness:HeadTestQuiescenceWitness,journal:HeadTestJournal):boolean => observed.get(witness)?.fingerprint === fingerprint(journal);
