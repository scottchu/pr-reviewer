import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
type Occupant = {
    kind: "import" | "analysis";
    jobId: string;
    invocationId: string;
    phase: string;
};
/** Private store-owned exclusion seam. Every operation runs in the caller's transaction. */
export const createExecutionLease = (db: DatabaseSync) => {
    db.exec("CREATE TABLE IF NOT EXISTS execution_owner(id INTEGER PRIMARY KEY CHECK(id=1),epoch TEXT NOT NULL); CREATE TABLE IF NOT EXISTS execution_lease(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);");
    const epoch = randomUUID();
    db.prepare("INSERT OR REPLACE INTO execution_owner VALUES (1,?)").run(epoch);
    const check = () => { if ((db.prepare("SELECT epoch FROM execution_owner WHERE id=1").get() as {
        epoch: string;
    }).epoch !== epoch)
        throw new Error("stale_execution_owner"); };
    const occupant = () => { const row = db.prepare("SELECT body FROM execution_lease WHERE id=1").get() as {
        body: string;
    } | undefined; return row ? JSON.parse(row.body) as Occupant : null; };
    const unresolved = () => {
        for (const table of ["import_jobs", "analysis_jobs"]) {
            if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table))
                continue;
            const rows = db.prepare(`SELECT body FROM ${table}`).all() as {
                body: string;
            }[];
            if (rows.some(row => { const job = JSON.parse(row.body) as {
                state: string;
                invocations: {
                    state: string;
                }[];
            }; return job.state === "unknown" || job.invocations.at(-1)?.state === "running"; }))
                return true;
        }
        return false;
    };
    return {
        acquire: (next: Occupant) => { check(); if (occupant() || unresolved())
            return false; db.prepare("INSERT INTO execution_lease VALUES (1,?)").run(JSON.stringify(next)); return true; },
        retain: (next: Occupant) => { check(); if (!occupant())
            db.prepare("INSERT INTO execution_lease VALUES (1,?)").run(JSON.stringify(next)); },
        release: (expected: Occupant) => { check(); const current = occupant(); if (!current || JSON.stringify(current) !== JSON.stringify(expected))
            throw new Error("execution_lease_conflict"); db.prepare("DELETE FROM execution_lease WHERE id=1").run(); },
        clearQuiescent: (kind: Occupant["kind"], jobId: string, invocationId: string) => { check(); const current = occupant(); if (current?.kind === kind && current.jobId === jobId && current.invocationId === invocationId)
            db.prepare("DELETE FROM execution_lease WHERE id=1").run(); },
    };
};
export type ExecutionLease = ReturnType<typeof createExecutionLease>;
