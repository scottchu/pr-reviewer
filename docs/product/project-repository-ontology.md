# Project and repository ontology: TBox and ABox

Date: 2026-10-24. Status: accepted core distinctions with detailed conceptual vocabulary proposed. The user requested the TBox/ABox distinction and explicit project/repository representation. This is durable product knowledge, not a deployed formal schema. No RDF/OWL store, reasoner, dependency, migration or implementation is proposed.

**TBox describes the kinds of things, typed relationships and constraints. ABox records particular things and supported statements about them.** “Repository contains revision-specific source” is vocabulary; “scottchu/pr-reviewer at e3b270e contains this accessHeaders occurrence” is an instance claim requiring evidence.

## TBox: connected knowledge, distinct responsibilities

| Concepts | Meaning and useful typed relations |
|---|---|
| Project, Repository, Worktree | Project is the product/work scope and its goals/knowledge. Repository is a Git history/source boundary. Project **usesRepository** Repository; Repository **hasRevision** Revision; Worktree **checksOut** a revision and **locates** a working copy. A filesystem path is a locator, not project/repository/source identity. Do not assume one project equals one repository. |
| Requirement, UserStory, DesignDecision | Normative desired behavior; user goal/scenario; chosen design with rationale/status. A Specification **specifies** a Requirement; a UserStory **motivates** it; a Decision **addresses** a Requirement and **constrains** design. Later accepted corrections can **supersede** earlier decisions without rewriting their historical evidence. |
| Specification, Subsystem, Interface | Durable product knowledge and bounded responsibilities/public interactions. Specification **describes** Subsystem; Subsystem **exposes** Interface and **dependsOn** another public Interface. An implementation artifact **implements** a Requirement/Interface and **isDerivedFrom** Specification. Documentation does not by itself establish implementation conformance. |
| Rule, Plan, Slice | Rule is normative development/workflow policy, owned in docs/rules (and repository instructions). Plan/Slice coordinate delivery and **targets** requirements; they record assignments/status/evidence but are not the sole durable specification. A coding rule is project knowledge, not a code-call fact. |
| Review, Comparison, Revision, FileOccurrence, Change | A Review **examines** a Comparison with exact base/head revisions in its repository context. FileOccurrence **occursIn** a revision and has exact path/content identity. Change **compares** before/after occurrences or supported absence. A hunk is one representation of changed ranges, not a timeless function or a UI card. |
| Symbol, SymbolOccurrence, FunctionOccurrence, Callsite | A logical Symbol can be represented by revision-specific occurrences; a function is a callable occurrence with exact declaration/body anchors. Pairing occurrences across revisions requires comparison/identity evidence, not equal names. Callsite **calls** a resolved target occurrence when supported; an import site **imports** a module binding/identity. Imports are not calls; HTTP associations and injected/unknown dispatch are not fabricated direct calls. |
| TestDefinition, TestRelevance, TestRun | TestDefinition is a source-backed test/callable and its assertions. TestRelevance **relatesTo** a changed function with supporting source evidence and an assertion summary; relevant tests may be unchanged. TestRun is an actual execution, distinct from discovery/mapping. A configured target, job, external invocation, result and artifact retain their existing separate identities; a test definition need not be independently runnable. |
| Claim, Explanation, Evidence, Unknown | Claim is an assertion with subject, basis and status. Explanation organizes source observations and attributed interpretation. Evidence **supports** a particular Claim or **verifies** a specified criterion at exact source/environment scope. Unknown identifies a frontier or unavailable basis, not falsehood or confirmed absence. Test source does not support PASS; interpretation does not become runtime evidence by being displayed. |
| SourceAnchor, ContentAnchor, Comment, Participant | SourceAnchor identifies immutable side/path/hash/range in its owning coordinate system. ContentAnchor identifies exact prose content/version/hash/selection. Comment **anchorsTo** one supported target and **authoredBy** an authorized participant; a reply belongs to its thread. Equal text/screen proximity cannot re-anchor it. General prose commenting remains future/preview where the public persistence contract does not support it. |
| Projection / Lens | A projection **presents** selected domain facts at a particular level of detail. A file box, panel, dot or row is not itself proof of a function/call/test or its identity. Change-only scope starts at changed functions/callsites and includes necessary supported direct neighbors; it does not redefine repository membership or assert omitted neighbors do not exist. |

### Constraints that preserve meaning

- Preserve repository, comparison, source revision, occurrence and anchor identities independently. A candidate build being reviewed is not the pinned PR source merely because both use the same repository.
- Provenance belongs to every supported relation/claim: exact source or artifact, revision, interpretation/observation class, and relevant uncertainty. A source-observed relation and an admitted static-analysis edge are different evidence classes.
- Before/after sides resolve independently. An added function has absent before occurrence; no invented empty function or same-name pairing. An unresolved target remains unresolved, not a leaf.
- Requirement acceptance, implementation, engineering verification, unfamiliar-reviewer comprehension and deployment are different predicates/statuses. `verifies` is scoped evidence, not a blanket logical truth or automatic acceptance rule.
- Test mappings/discovery never imply execution/PASS. A result belongs to its actual configured target, pinned head, invocation and environment. Unknown external outcome never becomes replay permission.
- Canvas zoom/pan and reader layout do not change facts. In the current bounded file mock, zoom is camera-only; explicit activation changes expansion. Larger semantic/panel composition remains separately specified.

## ABox: concrete PR Reviewer project, repository and review

The following are human-readable instance labels, not newly allocated persisted IDs or an invented storage format.

```text
Project: PR Reviewer
  goal: help reviewers understand change, rationale and evidence
  usesRepository → Repository: github.com/scottchu/pr-reviewer
  hasSpecification → docs/product/pr-file-tree-first.md
  hasRule → docs/rules/development.md (readable multi-line implementation)

Repository: github.com/scottchu/pr-reviewer
  hasReviewSubject → PR #25
  hasRevision → b096826e31c0927190806de91ed70b8b64aa93d8 (base)
  hasRevision → e3b270e5f49a9215452b0b86702946043e979059 (head)

Review subject: PR #25
  examinedAs → Comparison(base, head above)
  hasChange → src/application/local-access.ts added
  hasChange → src/application/review.ts request behavior modified
```

These explicit Project and Repository boxes can appear in a project-knowledge view. They represent distinct entities connected by `usesRepository`, not two decorative names for the same object. The same repository is both where PR Reviewer is developed and the subject of its own PR25 dogfood review. These are two roles of one repository; the product project, review session, candidate build and pinned comparison remain distinct. There is no circular “the UI verified itself” acceptance implication.

| Concrete instance account | Basis and limit |
|---|---|
| Requirement F06: even a one-line edit initially shows its entire responsible changed callable on each available side; unrelated intervals may fold | Current `pr-file-tree-first.md` F06. This is a normative requirement instance, not evidence the UI implements it. Appropriate inner callable and honest module/declaration fallback are part of it. |
| Requirement F16: selected changed function → relevant test assertion summaries → same-canvas full-test diff | Current F16. Source-backed mapping includes relevant unchanged tests. No concrete TestRun/PASS is invented for the mock. |
| Rule: readable multi-line function bodies, conditions, object literals, operations and SQL | `docs/rules/development.md:7`. A project policy instance; original reviewed fixtures keep their exact bytes. This rule is not a function relation, and it selects no formatter/dependency. |
| FileOccurrence: `src/application/local-access.ts` at PR25 head; added callable `accessHeaders` | Current F10/F13 and the retained whole-PR source account. Base has no corresponding file/helper; head request callsite in review.ts calls it. Exact hash/range must come from the retained source record before creating an executable anchor. |
| Unchanged `refresh` occurrences before/after the request change | F10 retains both exact source occurrences and identical-body evidence. Its source is unchanged; downstream behavior may differ. Do not merge occurrences solely by name or infer behavior equivalence. |
| Comparison membership:50 changed paths,4 added/46 modified, +492/−192 lines | F13 pins the source.126 native -U3 hunks and163 -U0 blocks are different diff representations of that comparison, not different PRs or contradictory ontology facts. |
| Explanation: local-owner access is recognized before credential lookup; explicit credentials continue through lookup | Prepared account in F09 with source citations required. This does not prove blanket security or execution. Evidence status remains visible separately from explanation text. |
| Worktree locator: `/tmp/pr-reviewer-pr-file-tree` | Observed author working-copy location. Its moving HEAD is not PR25 head and is not a durable identity for Project, Repository or Comparison. |

## Existing contracts and limits

Existing public snapshot/source/analysis/test contracts remain authoritative. This conceptual vocabulary does not rename their identifiers, introduce a persistence schema or authorize a generic abstraction layer. The [architecture](architecture.md), [file-workspace requirements](pr-file-tree-first.md), [configured test execution](review-loop/test-execution.md) and [development rules](../rules/development.md) retain their responsibilities. Exact source anchors use their existing coordinate and hash contracts.

Detailed vocabulary labels, global cardinalities and inference behavior remain proposals. No repository-wide extraction completeness, formal logic engine, ontology validation or automatic conformance proof is established. Source relationships and test mappings remain bounded by their evidence and explicit frontiers. Project and repository entities are meaningful conceptual distinctions; the current file mock does not yet render a complete project-knowledge ontology view.
