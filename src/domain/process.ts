/** Minimum journal evidence for read-only quiescence reconciliation, never permission to signal. */
export type ProcessQuiescenceRecord = Readonly<{state: 'requested' | 'started' | 'exited'; pid?: number; startIdentity?: string; spawnDisposition?: 'not_spawned'}>;
export const processQuiescenceEligible = (observation: ProcessQuiescenceRecord): boolean => {
  if (observation.spawnDisposition !== undefined)
    return observation.spawnDisposition === 'not_spawned' && observation.state === 'exited' && observation.pid === undefined && observation.startIdentity === undefined;
  return (observation.state === 'started' || observation.state === 'exited') && Number.isSafeInteger(observation.pid) && observation.pid! > 0;
};
