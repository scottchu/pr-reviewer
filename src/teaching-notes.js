// Teaching notes are curated against the pinned Flow #32 source diff.
// Rationale from the PR description is distinguished from source behavior.
export const teachingNotes = {
  dispatch: {
    look: "Look at the red task condition and the two green replacement lines in main.ts.",
    explain: "The removed condition matched every command whose first argument was task. The added condition first checks both task and stop. That sends task stop into its own branch; the new else-if retains the existing task verification path. This is where the execution path changes, before any continuation decision is made.",
    reason: "The PR's stated intent is to let explicitly enabled local tasks continue bounded work. A separate dispatch branch gives that new operation an entry point.",
    result: "Trace task stop into the first branch, and task verify into the following branch. Next, follow the new function call inside the stop branch."
  },
  caller: {
    look: "Follow the highlighted run() → runTaskStop() edge, then read the green call in main.ts.",
    explain: "run() is the caller; runTaskStop() is the new method it calls. The caller passes the command arguments as args. runTaskStop() reads the Stop event from stdin and returns a decision object. The caller serializes that object with JSON.stringify and prints it. The new call connects CLI dispatch to the adapter; it does not itself decide whether continuation is allowed.",
    reason: "The PR separates the filesystem and event adapter from the decision function. That separation is visible in the added source; its intended purpose is described by the PR's bounded-continuation goal.",
    result: "You have now traced who calls the new method and what crosses that boundary. Next, follow the adapter's call to decideTaskStop() to learn where the decision is made."
  },
  decision: {
    look: "Read const decision=verifyTask(record,revision) in the highlighted added function in plugin-api.ts.",
    explain: "decideTaskStop() is new, but verifyTask() is an existing method. The new caller reuses its declared task decision. If that outcome is not continue, decideTaskStop() immediately returns a stop result with no guard. A continue outcome then reaches additional identity, replay, progress and continuation-limit checks. Calling verifyTask() does not prove that the artifacts satisfy the user's intent.",
    reason: "The PR keeps the coordinator record as the task plan and adds a mechanical continuation guard. Reusing the existing decision preserves that boundary instead of creating a second task planner.",
    result: "Distinguish the existing task decision from the new guard checks. Next, follow what the adapter writes when a guard is returned."
  },
  guard: {
    look: "Find fs.renameSync(temp,guard) in task-stop.ts, and read the record comparison immediately above it.",
    explain: "The adapter writes the new guard into a temporary file and flushes it. It then rereads the task record and compares its bytes and file identity with the earlier snapshot. A mismatch throws rather than proceeding. Only after that comparison does it rename the temporary file to the guard destination. The guard file and coordinator record are explicitly required to be separate.",
    reason: "This implements the PR's separate bounded-progress guard while detecting a record change during the decision. The source explicitly states that readback reduces a race window but cannot make future conversation cancellation atomic.",
    result: "The guard write is a side effect after a checked decision, not a second task plan. Next, inspect how the next Stop event is prevented from continuing indefinitely."
  },
  failure: {
    look: "Read the highlighted previous.count>=4 condition, then the progress comparison just below it in plugin-api.ts.",
    explain: "For a re-entry event, a matching prior turn guard is required. A count of four returns a stop result before another continuation is requested. The next condition also stops if previous verified-progress hashes disappear or if no new progress hash appears. Cosmetic prose changes do not count as progress because the signatures are built from declared verified evidence.",
    reason: "The PR's stated goal is bounded continuation that stops honestly at the cap or when progress fails. These added conditions implement mechanical bounds; they do not establish that the work is correct.",
    result: "You can now explain the changed dispatch, its new call chain, the guard side effect and the stopping conditions. Use All files to inspect the test changes and challenge coverage; those tests have not been rerun by this prototype."
  }
};
