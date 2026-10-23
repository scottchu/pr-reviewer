# Product vision

**Status:** Initial draft for discussion

## Why this product exists

A pull request presents changes as files and lines. Understanding it requires reconstructing something larger: the problem being solved, how the affected behavior works, what changes for the people or systems relying on it, and whether the evidence supports the intended result.

That reconstruction often happens in the reviewer’s head. They move between a description, unfamiliar code, callers, tests and conversations, trying to assemble a coherent picture. A short diff can hide a consequential behavior change. A large diff can bury one important decision among setup, repeated patterns and supporting work. Reading every line does not necessarily produce understanding.

PR Reviewer exists to help people build that picture and use it to make a reasoned review decision. The central question is: **“What will happen differently because of this change, and how do we know?”**

## What understanding should feel like

A reviewer should feel oriented. They can explain the purpose of the change in their own words, see how the important parts fit together, and recognize what deserves closer attention.

The experience should make it natural to say:

- “I understand the problem this change is trying to solve.”
- “I can follow what happens today and what will happen differently.”
- “I can see who depends on this behavior and what remains unchanged.”
- “I understand how the supporting changes and tests relate to it.”
- “I know what the evidence establishes, what is inferred, and what still needs checking.”

Understanding can begin with a high-level behavior or a small detail that raises a question. A reviewer should be able to follow either path, explore a relationship and return without losing their place. They should not have to follow an author’s presentation order to make sense of the change.

## Make the relationships understandable

The change should read as a connected account of behavior. An entry point, a decision, its callers, its dependencies and the tests around it help explain one another. Unchanged code can be essential context: it may be where a changed result is consumed or an existing assumption is exercised.

The whole PR deserves an account. Supporting configuration, documentation and tests should have a clear place alongside the central behavior change. This does not require narrating every line; it requires making the scope visible and giving the reviewer a way to investigate every part.

Explanations should use plain language and concrete examples. They should tell the reviewer what a change means, with the relevant evidence already clear. More narration is useful only when it improves understanding.

## Confidence should have a basis

A convincing explanation should invite inspection. Reviewers should be able to trace a claim back to the change, its surrounding context or relevant evidence, and challenge it when the connection is weak.

A test being present, still relevant, or passing are different claims. A successful check answers a bounded question. Missing context, unresolved relationships and uncertain interpretations should remain visible so the reviewer can decide what to investigate next.

The intended feeling is confidence with reasons: the reviewer can explain both their judgment and its limits.

## Understanding grows through conversation

Review is a conversation between people and, when involved, agents. A question should stay connected to the behavior or evidence that prompted it. An answer should help the reviewer examine that question, refine the shared understanding and identify what would resolve remaining uncertainty.

Corrections and useful explanations should remain available as the review continues. The reviewer’s judgment stays central; the product helps them form and communicate it.

## What success means

The vision succeeds when a reviewer can describe the changed behavior, trace its consequences, account for the broader change, and explain what supports their decision. It should also help someone unfamiliar with the code ask better questions and become oriented without repeatedly rebuilding the same context.

A clear-looking presentation, a long explanation or a completed checklist is insufficient evidence of that outcome. We will need to learn from people reviewing real changes whether the product actually helps them understand.
