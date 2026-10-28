# B2: exact-head test workspace consumer

Date: 2026-10-24
Status: application checkpoint in progress; standalone UI composition paused after unified-canvas correction
Packet revision: B2.2
Owner: implement_head_test_react
Parent: [slice06](plan.md), [execution](execution-06b.md), [public ports](consumer-ports-06b.md), [B4](integration-06b4.md)
Durable specification: [test workspace](../../../../product/review-loop/test-ui.md), [execution authority](../../../../product/review-loop/test-execution.md)

## Intent and current gap

The stable backend exposes exact-head catalog, durable command receipts, job/result history and byte artifacts. React currently exposes none. The user must be able to run the configured target and inspect its evidence while source navigation, story, drafts and anchored questions keep their independent owners. Default unavailable is truthful. Fixtures never qualify a production head.

## Wireflow and ownership

1. Workspace establishes the existing single local owner and exact displayed review/snapshot. A managed test bridge queries catalog and first history page. No credentials or login UI are added.
2. Catalog shows target name/revision, full head and availability/reason. Run captures the exact catalog scope/target revision. Persist its immutable command before HTTP; if persistence fails, dispatch nothing. A lost/invalid response retains that command and an explicit Retry unchanged request action. It does not unlock another mutation.
3. A validated applied receipt is persisted before the pending command can clear. Read the exact job at minimum receipt revision. The UI separates receipt, job progress, cancellation intent, observed quiescence, result and cleanup.
4. Poll bounded independent catalog/history and selected-job read slots. Explicit selection supersedes stale reads. History pagination appends only matching scope, deduplicates by job identity and retains captured source. A new snapshot resets visible catalog/history, never retargets a saved pending command/job.
5. Cancel captures selected job/revision in another durable immutable command. Cancel requested does not mean stopped. Unknown retains its reason/exclusion; no automatic new Run or process replay.
6. Artifact selection uses a separate bounded abortable read slot and one streaming UTF-8 decoder. Verify each response's immutable descriptor, byte offset/count/nextOffset and completeness. At most 1MiB plain output is assembled; explicit load-next-page preserves decoder state. Source evidence is also inert plain text. No terminal, HTML injection, ANSI processing or execution action.
7. Disconnect/scope replacement aborts all transport reads/mutation waiting, removes timers/routes and fences late values. Aborting a request does not prove its durable command uncommitted. Private recovery is test-specific and never clears question/story keys. Reload requires explicit retry for an uncertain command; receipt recovery reads the original scope/job.

Application owns HTTP, persistence, recovery, validation coordination and registry; UI renders state and delegates intent. Workspace alone connects review scope to the public test bridge. No UI/database/process imports. No participant wake.

## Accepted scope and constraints

New application/head-tests and separate test-intent persistence; narrow public/workspace wiring; React panel/styles/main composition; focused unit and actual React E2E fixtures through public backend ports. Backend, storage, domain, runner, CLI, MCP, dependencies, lock and package scripts belong to the backend owner. A missing shared response codec blocks affected HTTP consumption until a committed backend amendment; no CLI-private copy. Existing Node24/Bun1.4.2 and read-only package-entry links to the integration donor; generated caches remain task-local. No main/GitHub/deploy/native/global changes.

## Acceptance and TDD sequence

| ID | Required evidence |
|---|---|
| U1 | Catalog unavailable is actionable explanation, never green success or enabled Run; exact target/head retained. |
| U2 | Lost response/reload retries byte-equivalent command ID/payload; receipt read honors exact minimum revision; storage quota prevents unsafe dispatch/clear. |
| U3 | Scope replacement/disposal fences catalog/job/artifact/command completions; registry and active slots return to baseline; repeated mount creates no command. |
| U4 | Cancel intent distinct from observed stop; failed/unavailable/unknown/result counts/history and cleanup remain truthful. |
| U5 | Split CJK/emoji bytes and malformed UTF-8 stream decode without independent-page corruption; HTML-like text remains inert; offset/integrity failure retains result identity. |
| U6 | Actual React plus actual controlled gateway/runner: unavailable → fixture available → request → observed preparation/running → identical stored job/result/artifact. Fixture provenance visibly labeled; concurrent anchored question/draft/navigation retained. |
| U7 | Desktop and narrow screenshots separately critiqued for density, wrapping, focus, keyboard/status semantics using existing visual language and design-system principles. |

Write meaningful application RED tests before implementation; then direct focused Node tests, strict/boundaries, actual Chrome E2E. New normal-suite registration is requested from backend owner rather than editing package. Record precise failures and unrun gates. Full own-PR/CLI identity, fresh production qualification, independent B2 review, combined fault/rebuild/visual acceptance and deployment remain root-owned.

## Independent-review handoff

Fresh reviewer consumes the exact committed candidate, this packet and durable test-ui/test-execution knowledge. Adversarially exercise malformed/cross-scope responses, lost receipts and persistence failure, cancellation ordering, stale generations, teardown and artifact offsets/decoder boundaries. Inspect actual React journey and visual evidence separately. Return concrete findings and bounded engineering readiness; no own-PR comprehension or production pass can be inferred from fixtures.

## User direction correction and safe checkpoint

Date: 2026-10-24
Status: root instructed this executor to pause new UI composition/visual polish.

The final experience must keep everything in one canvas; zoom/focused lens reveals inline diff/code while graph context remains. A separate file inspector/standalone panel is not accepted final UX. Preserve the existing provisional HeadTests panel, actual fixture journey/screenshots and application bridge for reconciliation. Continue independent application/domain checks only; root owns revised mocks/spec and reauthorization of composition. This correction supersedes the section-based presentation above, without discarding durable command/recovery/byte-port work.

[Paused application checkpoint](checkpoint-ui-06b.md) pins delivered source, actual tests, superseded UI evidence, open gates and recovery.

## B2.3 same-canvas dependency reconciliation

Date: 2026-10-24
Status: docs-only reconciliation; no production composition resumed.

Root dispatched a separate isolated unified-canvas preview from committed c9230830fddbe0624132eee8423beb2c546d71c1. Its owning05 packet is canvas-reading-mockup.md plus canvas-preview-implementation.md. Future B2 presentation must place configured target/job/result/output context in that same graph-connected canvas, with inline diff/code and exact return; preserve current application/recovery ports as inputs. The retained standalone panel and5-case fixture browser receipt are superseded composition evidence, not user layout adoption. Wait for the inspectable preview and root/user feedback before deriving production UI. No test execution, backend, source or application files change in this reconciliation.

### Separate subsystem preview dependency

Date: 2026-10-24
Design packet: cc50132, 720p/05/subsystem-mockups.md group E and product/review-loop/canvas-reading.md. The owner has reconciled public target, receipt, job, result, artifact and cancel/unknown semantics in test-ui.md. A separately isolated same-canvas mock may now demonstrate labeled simulated outcomes; it does not qualify PR25, execute its relevant auth test or accept a production composition. Retained B2 engineering remains unchanged.
