# Working in PR Reviewer

- Keep repository content in English.
- Name new branches descriptively without a `codex/` prefix. Do not rename existing branches solely for this preference.
- Build the project from the top down: vision, product goals and user experience, requirements, system design, then implementation. Develop and commit each meaningful step as it is discussed; do not generate the whole documentation hierarchy in advance.
- Start with README.md and AGENTS.md. Add documents under docs/ gradually, beginning with the vision. Keep README user-facing and put agent workflow rules here.
- Separate dates, statuses, and technology layers into clearly labeled entries. Do not compress them into one sentence.
- Carry prior user decisions as context, while distinguishing accepted direction, proposals, observed evidence, and unknowns. Later user corrections take precedence.
- Do not restore the previous application or introduce dependencies, build output, or a technical scaffold before its implementation scope is established.
- The earlier prototype is available at /Users/scottchu/.codex-workspaces/worktrees/ios-e7be5006-595e-43b0-8489-86257dc88f00/playground/experiments/pr-diff-teacher, pinned at Playground commit 223073c353e45969e189504648d522f2f096147b. Consult it when useful; preserve that source and its runtime artifacts.
- Private context and handoff evidence remain under ignored .decompozr/flow/run/transfer/. They are historical references, not an active implementation plan or current runtime acceptance.
- Preserve unrelated work and credentials. Keep generated files, secrets and local runtime state out of Git.
