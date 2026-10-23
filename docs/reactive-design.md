# Functional core and reactive coordination

**Direction:** Functional patterns plus reactive coordination

**Library status:** Not selected; RxJS and Effect Stream are candidates, not installed dependencies

**Implementation:** Not started

## Responsibility before library choice

Keep domain decisions in small deterministic functions over explicit immutable inputs. A transition produces the next state and declared event/job intent, or a typed rejection. The dispatcher performs fresh authorization/revision checks and commits the transition and receipts atomically. Time, identity, external observations and randomness are explicit inputs; pure functions do not read a database, launch a process or call a host.

A scoped application/adapter layer owns effects: transactions, streams, host delivery, process supervision and cleanup. Reactive coordination combines committed updates, manages subscriptions and connection lifecycle, and delivers view snapshots. UI subscribes to those snapshots and submits intent. It does not hide domain rules in stream operators or component hooks. Use explicit public subsystem interfaces; do not leak a particular reactive library through every domain type.

## Where reactive behavior belongs

- Present committed review updates and job progress without conflating receipt, delivery, start and completion.
- Observe attachment/connection lifecycle and reconnect through durable cursors.
- Coalesce wake scheduling while retaining every durable inbox item.
- Cancel superseded read-only requests or private visual work, with scoped teardown.
- Keep the graph, explanation and source selection synchronized from one explicit presentation state.

## Semantics that a library cannot replace

An in-memory stream or queue is not durable command ingress, an inbox, an outbox or a job journal. Dropping or sampling redraws may be acceptable; dropping accepted commands, addressed comments or execution evidence is not. Slow-consumer policy needs explicit bounds and recovery from durable cursors.

Unsubscribing stops observation or local work according to its teardown contract. It is not evidence that an external test process stopped or a host turn never started. Cancellation remains a domain command with confirmed outcome. Reconnection/retry may repeat a safe query; it must not blindly replay uncertain launches or create a new invocationId. Multiple subscriptions must not duplicate external effects. Release resources on teardown, preserve durable effects and reconcile unknowns.

Transactions never span stream waits or agent turns. A serialized conversation must still be able to submit its own MCP commands. Functional structure and reactive operators do not, by themselves, establish atomicity, correct authorization or exactly-once external execution.

## Candidate comparison

| Candidate | Potential fit | Decision cost / question |
|---|---|---|
| Native async iteration and explicit lifecycle interfaces | A small baseline for bounded read/event pipelines | How much custom composition, buffering and teardown code does the real flow require? |
| RxJS | Event composition and scoped subscriptions, while retaining a separate domain and effect boundary | Can we keep operator graphs understandable, teardown explicit and retries restricted to safe operations? Preferred candidate if stream composition is the main missing capability. |
| Effect Stream | A broader effect model alongside streams, resources, errors and concurrency | Is adopting that model across application services justified by the actual slice? Prefer only if its broader lifecycle model pays for the additional architectural commitment. |

This is a recommendation framework, not an adoption decision. “More modern” alone is insufficient. React can consume an external store through its supported subscription interface; local rendering state does not require moving durable business state into a reactive library.

## Bounded selection evidence

Before implementing the first substantial reactive coordinator, compare the native baseline and relevant candidate against the same small scenario: committed updates, a slow/disconnected reader, cursor reconnect, attachment replacement, repeated subscriptions and teardown while an external invocation is uncertain. Use TDD and deterministic scheduling where supported, then actual adapter tests for behavior outside a virtual scheduler. No synthetic scheduler result counts as real-host or process-termination evidence.

Record the selected release, scope, rationale, observed complexity and test results in the relevant slice before adopting it. Do not introduce both libraries or an application scaffold to decide this. Any implementation experiment needs its own bounded task scope. The existing host probe remains host-only and does not depend on this library choice.

## Primary references

- [RxJS Observable contract and teardown](https://github.com/ReactiveX/rxjs/blob/master/apps/rxjs.dev/content/guide/observable.md).
- [RxJS virtual-time testing and limits](https://github.com/ReactiveX/rxjs/blob/master/apps/rxjs.dev/content/guide/testing/marble-testing.md).
- [Effect streams](https://effect.website/docs/v4/stream/creating) and [Effect service/resource/concurrency model](https://effect.website/docs/v4/getting-started).
- [React external-store subscription](https://react.dev/reference/react/useSyncExternalStore).

Sources inspected 2026-10-23. Library versions and local behavior remain unverified until the bounded implementation decision; no package is installed by this design.
