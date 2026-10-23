# Independent manual-source delta review

**Date:** 2026-10-23

**Reviewer:** Independent Astra medium agent assigned by root; read-only

**Candidate:** `98e00325e5fd55f3d6c146c76cfc1055fb63cb73`

**Diff base:** `4dae178a4302bfdd161fca5be78144c63f562c30`

**Disposition:** Changes requested for source/data boundaries; focused repair requires final review

The reviewer independently ran strict checks, all 17 then-current tests and both controlled-host Chrome journeys. Database-only target-input recovery was independently exercised successfully. Two concrete P2 boundaries required correction: a directory path was accepted through Git's synthesized tree listing instead of an immutable source blob; a data root inside another Git checkout was not rejected because validation compared only the current app checkout. The directory case was independently reproduced by the reviewer and the foreign-checkout case by root. Strict UTF-8 preservation was also identified as a source-integrity concern.

The implementer specified the corrections in durable product contracts before changing code. New regressions reproduced tree acceptance and the foreign-Git data-root violation before the fix. The focused repair checks commit/path object type, reads only blob bytes, rejects malformed UTF-8 and checks nearest real ancestors against any Git repository before creating the runtime directory. A negative isolated-Git fixture verifies invalid bytes are rejected without source persistence. It also preserves the previously tested PR 14 and explicit PR 19 browser journeys.

The implementer's repaired tree passed strict checks, all 19 domain/interface/process tests and both Chrome journeys. This records implementer verification, not independent final acceptance; root supplies the exact repair candidate and reviewer disposition. All native-host, Claude, real-host own-PR and unfamiliar-reviewer gates remain separate. No additional product scope is introduced by these boundary repairs.
