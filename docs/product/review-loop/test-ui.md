# Exact-head tests in the review workspace

Status: application consumer contract retained; standalone panel superseded by the unified-canvas direction; revised UX and acceptance pending
Technology: React presentation over the managed application bridge
Authority: [test execution](test-execution.md) owns command/job/result/artifact semantics; [test compatibility](test-compatibility.md#separate-private-test-intent-protocol) defines the exact separate sessionStorage key, envelope, scope, absent/null and recovery rules.

## User experience

The accepted experience keeps all review work in one canvas. Zoom and a focused lens reveal inline diff/code while preserving graph context. A separate file inspector or standalone panel is not the accepted final UX. The current React test panel is retained engineering evidence only; canvas placement and interaction await the root-owned revised specification.

Within that experience a reviewer can see which fixed test target is configured for the displayed immutable snapshot, its full head, target revision and availability reason. An unavailable target remains unavailable until owner qualification; the panel cannot qualify source or accept executable inputs. Run captures the displayed scope and target revision. A durable receipt identifies one job and its minimum read revision, followed by progress and history. Fixture provenance is visibly labeled and never presented as a production pass.

Jobs preserve their original review, snapshot, base/head and target. History selection cannot relabel an old result with a new head. Cancellation is an intent: requested, observed stopped/quiescent and unknown are separate facts. Results show stored result identity, outcome/reason, collection counts when present, raw output accounting and cleanup state. Missing counts or cleanup evidence remain absent. Unknown effects are never retried automatically.

Saved questions, private drafts, story playback and navigation retain their existing owners and can proceed independently of test transport. No test action asks or wakes a participant. The retained provisional panel is an ordinary keyboard-operable section with visible focus, explicit button labels, polite progress and readable wrapping at narrow widths. Output uses a bounded scroll region and plain text; command-looking and HTML-like text cannot become controls.

## Application coordination and recovery

The application test bridge owns separate bounded catalog/history, selected-job, mutation and artifact slots. All have abort controllers and generation fences. The subscription registry declares polling and workspace scope routes; disconnect removes routes/timers and aborts transport. Observers and remounts cause reads only. Scope replacement resets visible reads and cannot mutate the captured identity of an existing intent. Safe read errors remain visible and retryable; failures do not erase question/story persistence.

Persist each exact command before sending. Retain uncertain commands across reload in a test-specific private record keyed by review and local-owner lifecycle scope. Persist a validated receipt before clearing its command; then read the original scope/job at or above the receipt revision. A storage failure fails closed before dispatch or retains recovery after dispatch. Only explicit retry resends an uncertain command, unchanged. No new command ID or revised expected revision is substituted. A pending command from another snapshot is labeled with its original source, and cannot be retargeted by navigation. A definitive rejection may clear the pending command only through successful persistence.

Shared public response codecs validate gateway values. Application additionally checks requested review/snapshot/job/target and minimum revision against captured intent before publication. Malformed or mismatched successful responses are uncertain for mutations; they never release an unsafely assumed command. No browser credential is created: use the existing local-owner gateway boundary.

## Artifact presentation

Artifact descriptor and response identities must agree. Offsets count bytes. Decode base64 into bytes and feed one streaming UTF-8 decoder per selected artifact; retain decoder state between pages so split CJK/emoji survive. Check offset, bytes, nextOffset, total size/hash and complete before appending. Display at most 1MiB, with explicit next-page intent and byte progress. A failed page preserves already read text and historical result identity; changing selection/disposal invalidates old reads. UTF-8 replacement for invalid byte sequences is presentation only; retained artifact hash always refers to original bytes. No HTML rendering, terminal escape interpretation, shell input or path access exists.

## Verification boundary

Focused lifecycle/recovery/byte tests and actual React fixture journeys establish engineering behavior only. Actual own-PR execution, exact-source production qualification, CLI same-job evidence, unfamiliar-reviewer comprehension, visual acceptance and deployment have separate receipts. The initial panel does not add generic terminal access, target configuration, scheduling, automatic test runs or automatic agent feedback.

## Direction correction checkpoint

Date: 2026-10-24
Status: UI composition and visual polish paused after the user required a unified canvas. Application/domain validation continues independently; no canvas redesign or production adoption is claimed. Existing standalone React fixture screenshots and tests preserve useful transport/recovery evidence, not acceptance of the superseded composition.

## Delivered application checkpoint (provisional UI)

The bridge uses the shared browser-safe response codecs from the domain public interface. It additionally verifies all canonical result identity fields and SHA256 over the canonical result body. Complete viewed artifacts receive a SHA256 check over the original assembled bytes before final text publication. The display cap is 1MiB, including source-evidence artifacts that may be larger; reaching the cap is explicit and does not claim complete artifact inspection.

Test-intent storage has its own origin/review/access-scope key and versioned record. The normal local owner uses a stable nonsecret scope; explicit existing legacy access uses its fingerprint and explicit Authorization, with no fallback to local-owner authority. Access fingerprinting cannot delay or reorder the existing review login request. Workspace review-scope-to-head-test-view and bridge head-test-committed-to-authorized-view routes own scope propagation/polling. The bridge uses separate request, selected-job and artifact abort slots with a 10-second default request bound; polling is 500ms by default and creates no mutation. Replacing scope preserves pending original intent while clearing visible history/artifacts.

## Same-canvas reconciliation before future composition

Date: 2026-10-24
Accepted correction source: c9230830fddbe0624132eee8423beb2c546d71c1, docs/product/review-loop/canvas-reading.md (retained accepted direction; this historical checkpoint is not a current branch-merge status).
Status: accepted direction; inspectable canvas preview and concrete layout adoption required before production composition.

Target availability, durable test job/result identity, output and question context must be graph-connected presentations inside the same canvas. Zoom/focused lenses reveal inline diff/code while preserving neighborhood and exact return. A separate test panel or file inspector cannot become the primary reading/evidence destination. Reuse the retained B2 application bridge and recovery boundaries only after that preview is reviewed; these engineering ports do not imply adoption of the standalone HeadTests component or its main.tsx placement. No live test result may be invented to fill the mockup.

## Separate tests/evidence preview reconciliation

Date: 2026-10-24
Design source: cc50132, docs/plans/720p/slices/05-explanation-exploration/subsystem-mockups.md, group E, in the root-owned canvas design packet.

The separately inspectable tests/evidence scenario consumes the target/job/result/cancellation vocabulary above and the same-canvas reading contract. It may show explicitly simulated fixture transitions, with qualification absent, while production source remains unavailable until qualified. A relevant test source is not evidence that a fixed target includes or ran it. Preserve exact source/environment/job/result identities across history and distinguish cancel intent, quiescence and unknown. This reconciliation authorizes a bounded mock only; application integration, real execution and layout adoption retain separate gates.
