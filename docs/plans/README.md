# Plans and slices

Keep all project plans and individual slices here, tracked in Git. Plans connect the product intent to a bounded sequence of work. Individual slice documents link back to their plan and make each piece independently understandable and verifiable.

For each plan, record its goal, scope, decisions, sequence and current status. For each slice, record its intended outcome, dependencies, acceptance criteria, test approach, progress, verification evidence and remaining gaps. Update the existing documents as decisions and results change. Retain completed plans and slices as project history.

All code must be tested; prefer TDD. Include end-to-end coverage for implemented user journeys. UI work uses decompozr/design-system, and its actual integration belongs in that coverage. Distinguish planned tests from executed tests and record unresolved acceptance explicitly.

Create plans and slices as their scope is established, following the product vision. This directory is the durable planning location; .decompozr/ and chat are not substitutes.
