import { surfaceExample } from "./surface-example";
import { groupChanges } from "./behavior-groups";
import { Icon, IconButton } from "./Icon";
import { useEffect, useRef, useState, useReducer, lazy, Suspense } from "react";
import { darkColors } from "./design-system/semanticColors";
import { initialStory, storyReducer, sceneLabels, storyStepCount, storySceneCount } from "./story-player";
import { storyCopy } from "./story-copy";
const ThreeGraph = lazy(() => import("./ThreeGraph"));
const flowSample = "https://github.com/decompozr/flow/pull/32";
const sample = surfaceExample.url;
const pinned = "4e1e59bf0a0808d10a56817d2021703aadd4d266";
const labels = { added: "+ Added", removed: "− Removed", modified: "~ Modified", renamed: "~ Renamed", context: "Context" };
const flowLessons = [
  { id: "dispatch", title: "How requests are handled", question: "What happens to each request?", text: "The CLI entry point used to route every task command into verification. The diff replaces that condition with a dedicated task stop branch, followed by the existing verification branch.", nodes: ["run"], file: "apps/cli/src/main.ts", match: "if(args[0]", why: "Continuation checks and verification now have separate routes.", challenge: "Does task verify still reach its previous branch?" },
  { id: "caller", title: "Follow the new call", question: "Who calls this method now?", text: "run() now calls the newly added runTaskStop() for task stop commands. Follow the highlighted call to understand the new path. Other task commands still reach verification.", nodes: ["run", "stop"], edge: 0, file: "apps/cli/src/main.ts", match: "console.log(JSON.stringify(runTaskStop", why: "Modified dispatch + added caller", challenge: "Which arguments reach runTaskStop(), and what is printed to its caller?" },
  { id: "decision", title: "Inspect decision checks", question: "What decides whether work may continue?", text: "The new adapter calls decideTaskStop(). It calls the existing verifyTask(), then checks runtime identity, replay state, progress and the continuation bound. verifyTask() is context, rather than a modified method.", nodes: ["stop", "decide", "verify"], edge: 1, file: "apps/cli/src/plugin-api.ts", match: "const decision=verifyTask", why: "Separate the existing decision from the new guard.", challenge: "What happens when the record decision is complete, stale, or blocked?" },
  { id: "guard", title: "Trace the guard write", question: "How is continuation state preserved?", text: "runTaskStop() owns a guard lock, computes a decision, writes a temporary guard and checks that the task record has not changed before renaming it. The record stays separate from the guard.", nodes: ["stop", "decide"], edge: 1, file: "apps/cli/src/task-stop.ts", match: "fs.renameSync(temp,guard)", why: "Follow the side effect after the decision.", challenge: "Readback cannot make future cancellation atomic. What remains uncertain?" },
  { id: "failure", title: "Challenge failure paths", question: "What stops repeated continuation?", text: "The new decision function stops at four continuations and rejects missing progress or invalidated prior evidence. Read the actual conditions, then inspect the tests and their limits.", nodes: ["decide"], file: "apps/cli/src/plugin-api.ts", match: "previous.count>=4", why: "Green means added code, rather than correct behavior.", challenge: "Do tests cover replay, cancellation, no progress and the continuation bound?" },
  { id: "compatibility", title: "Support local setup", question: "What else changes around the new command?", nodes: [], file: "apps/cli/src/providers/codex-engine.ts", match: "Object.keys(v).length>0", why: "Help text, trust metadata and release information support the new local command.", challenge: "Does installing the release enable continuation automatically?" },
  { id: "tests", title: "Check the behavior", question: "How does this PR check its new behavior?", nodes: [], file: "bin/test-workflow.ts", match: "unchanged re-entry stops honestly", why: "Decision tests and packaged-command tests cover different boundaries.", challenge: "Which claims still need native runtime evidence?" },
  { id: "docs", title: "Explain use and limits", question: "How will someone use this safely?", nodes: [], file: "README.md", match: "explicit local-only", why: "Document opt-in and limitations alongside the code.", challenge: "Which green lines are documentation rather than executable behavior?" }

];
const flowMethods = [{ id: "run", name: "run()", status: "modified", file: "apps/cli/src/main.ts" }, { id: "stop", name: "runTaskStop()", status: "added", file: "apps/cli/src/task-stop.ts" }, { id: "decide", name: "decideTaskStop()", status: "added", file: "apps/cli/src/plugin-api.ts" }, { id: "verify", name: "verifyTask()", status: "context", file: "apps/cli/src/plugin-api.ts" }];
function patchLines(patch) {
  let old = 0, next = 0;
  return (patch ?? "").split("\n").map((text, index) => {
    const h = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text);
    if (h) {
      old = +h[1];
      next = +h[2];
      return { text, index, kind: "hunk" };
    }
    const kind = text.startsWith("+") ? "added" : text.startsWith("-") ? "removed" : "context";
    if (text.startsWith("\\")) return { text, index, kind };
    return { text, index, kind, old: kind === "added" ? "" : old++, next: kind === "removed" ? "" : next++ };
  });
}
function TeachingText({ text, onFocus }) {
  return text.split(/(\{\{(?:added|removed|modified|context)\|[^}]+\}\})/g).map((part, index) => {
    const token = /^\{\{(added|removed|modified|context)\|([^}]+)\}\}$/.exec(part);
    return token ? <button key={index} className={`semantic-reference ${token[1]}`} onClick={() => onFocus(token[1], token[2])} aria-label={`${labels[token[1]]}: ${token[2]}. Focus source evidence`}>{token[2]}</button> : part;
  });
}
export function App() {
  const [pr, setPR] = useState(null), [url, setURL] = useState(sample), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [selected, setSelected] = useState("stop"), [exploring, setExploring] = useState(false), [path, setPath] = useState(""), [follow, setFollow] = useState(true), [replay, setReplay] = useState(0), [override, setOverride] = useState(null), [showImport, setShowImport] = useState(false), [showFiles, setShowFiles] = useState(false);
  const [story, storyDispatch] = useReducer(storyReducer, initialStory);
  const step = story.step;
  const setStep = (i) => storyDispatch({ type: "select", step: i });
  const [mobile, setMobile] = useState(() => matchMedia("(max-width: 760px)").matches);
  const [view, setView] = useState("flow"), [chapters, setChapters] = useState(false);
  const groupNavRef = useRef(null), codeRef = useRef(null), explanationRef = useRef(null), playerRef = useRef(null), playerDrag = useRef(null);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  function dragPlayerStart(event) {
    if (event.button !== 0) return;
    storyDispatch({ type: "pause" });
    playerDrag.current = { x: event.clientX, y: event.clientY, offset: playerPosition, rect: playerRef.current.getBoundingClientRect(), bottom: parseFloat(getComputedStyle(playerRef.current).bottom) || 12 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function dragPlayerMove(event) {
    const drag = playerDrag.current;
    if (!drag) return;
    const dx = Math.max(12 - drag.rect.left, Math.min(innerWidth - 12 - drag.rect.right, event.clientX - drag.x));
    const dy = Math.max(8 - drag.rect.top, Math.min(innerHeight - drag.bottom - drag.rect.bottom, event.clientY - drag.y));
    setPlayerPosition({ x: drag.offset.x + dx, y: drag.offset.y + dy });
  }
  function movePlayerKey(event) {
    const moves = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (event.key === "Home") {
      event.preventDefault();
      setPlayerPosition({ x: 0, y: 0 });
      return;
    }
    if (moves[event.key]) {
      event.preventDefault();
      const rect = playerRef.current.getBoundingClientRect(), [dx, dy] = moves[event.key];
      setPlayerPosition((p) => ({ x: p.x + Math.max(12 - rect.left, Math.min(innerWidth - 12 - rect.right, dx)), y: p.y + Math.max(8 - rect.top, Math.min(innerHeight - (parseFloat(getComputedStyle(playerRef.current).bottom) || 12) - rect.bottom, dy)) }));
    }
  }
  useEffect(() => {
    const reset = () => setPlayerPosition({ x: 0, y: 0 });
    addEventListener("resize", reset);
    return () => removeEventListener("resize", reset);
  }, []);
  useEffect(() => {
    const mq = matchMedia("(max-width: 760px)");
    const change = () => {
      setMobile(mq.matches);
      storyDispatch({ type: "pause" });
    };
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!story.playing) return;
    const timer = setTimeout(() => storyDispatch({ type: "beat" }), 650);
    return () => clearTimeout(timer);
  }, [story.playing, story.beat]);
  useEffect(() => {
    if (story.playing && story.beat === 2) setView("diff");
  }, [story.playing, story.beat]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) storyDispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  const surface = pr?.head === surfaceExample.head && pr?.repository === surfaceExample.repository && pr?.number === surfaceExample.number;
  const flow = pr?.head === pinned && pr?.repository === "decompozr/flow" && pr?.number === 32;
  const curated = surface || flow;
  const lessons = surface ? surfaceExample.lessons : flowLessons;
  const methods = surface ? surfaceExample.methods : flowMethods;
  const copy = surface ? surfaceExample.stories : storyCopy;
  const nodes = curated ? methods : (pr?.files ?? []).map((f, i) => ({ id: String(i), name: f.path.split("/").pop(), file: f.path, status: f.status }));
  const groups = groupChanges(pr?.files ?? [], curated, surface ? surfaceExample.groups : undefined);
  const activeGroup = groups.find(g => (exploring || override || path) ? g.files.some(f => f.path === path) : g.steps?.includes(step)) ?? groups[0];
  const file = pr?.files.find((f) => f.path === (path || (curated ? lessons[step].file : pr?.files[0]?.path)));
  const lesson = curated ? lessons[step] : { id: "file", title: "Inspect a changed file", question: "What changed in this PR?", text: "Select a file to read its actual unified diff. This import establishes file changes, not method callers or behavioral intent. A repository-grounded teaching model can add those relationships.", nodes: [selected], match: "", why: "File status comes from GitHub. Method relationships remain unknown.", challenge: "Which behavior, callers and tests should be examined next?" };
  const focus = override ?? { nodeIds: exploring ? [selected] : story.playing && story.beat === 0 ? lesson.nodes.slice(0, 1) : lesson.nodes, edgeId: exploring || story.playing && story.beat === 0 ? null : lesson.edge, match: exploring || story.playing && story.beat < 2 ? "" : lesson.match };
  const storyText = curated ? copy[lesson.id][story.scene] : lesson.text;
  useEffect(() => {
    const nav = groupNavRef.current, selectedGroup = nav?.querySelector('[aria-pressed="true"]');
    if (mobile && selectedGroup) nav.scrollTo({left: Math.max(0, selectedGroup.offsetLeft - nav.offsetLeft - (nav.clientWidth - selectedGroup.clientWidth) / 2), behavior: "instant"});
  }, [activeGroup?.id, mobile]);
  function focusText(tone, text) {
    storyDispatch({ type: "pause" });
    if (surface) {
      let target = {path: lesson.file, nodes: lesson.nodes, match: tone === "removed" ? 'navigationMode="responsive"' : lesson.match};
      if (text === 'navigationMode="responsive"' || text === 'responsive') target.match = 'navigationMode="responsive"';
      if (text === 'navigationMode="push"' || text === 'push') target.match = 'navigationMode="push"';
      if (text === 'The regression tests' || text === 'The next group of green lines') target = {path: 'tests/e2e/surface/verify-navigation-width.ts', nodes: [], match: 'pane width remains fixed throughout opening/closing'};
      if (text === 'The source-mount test') target = {path: 'tests/e2e/surface/verify-design-source.ts', nodes: [], match: 'await regression.exited'};
      if (text === 'The archive is binary') target = {path: 'design/vendor/design-system.tgz', nodes: [], match: ''};
      setOverride({ nodeIds: target.nodes, edgeId: null, match: target.match }); setPath(target.path); setView("diff"); setReplay(v => v+1); return;
    }
    const matches = { dispatch: { removed: "- if(args[0]", added: "+ if(args[0]", modified: "if(args[0]" }, caller: { added: "runTaskStop(args)", modified: "runTaskStop(args)" }, decision: { context: "const decision=verifyTask", added: "const decision=verifyTask" }, guard: { added: "fs.renameSync(temp,guard)" }, failure: { added: "previous.count>=4" } };
    let target = { nodes: lesson.nodes, edge: lesson.edge, path: lesson.file, match: matches[lesson.id]?.[tone] ?? lesson.match };
    if (["a route for verification", "the verification route"].includes(text)) target.match = "+ }else if(args[0]";
    if (["all task requests went straight to verification", "the one rule for every task request"].includes(text)) target.match = "- if(args[0]";
    if (text === "the new request handler") target = { nodes: ["stop"], path: "apps/cli/src/task-stop.ts", match: "export function runTaskStop" };
    if (text === "the code that makes the continuation decision") target = { nodes: ["decide"], path: "apps/cli/src/plugin-api.ts", match: "export function decideTaskStop" };
    if (text === "the existing task check") target = { nodes: ["decide", "verify"], edge: 2, path: "apps/cli/src/plugin-api.ts", match: "const decision=verifyTask" };
    if (["the rule that checks for new progress", "another requires new progress", "a requirement for new verified progress"].includes(text)) target.match = "previous.progress.some";
    if (text === "else-if task branch") target.match = "+ }else if(args[0]";
    if (text === "runTaskStop()") target = { nodes: ["stop"], path: "apps/cli/src/task-stop.ts", match: "export function runTaskStop" };
    if (text === "decideTaskStop()") target = { nodes: ["decide"], path: "apps/cli/src/plugin-api.ts", match: "export function decideTaskStop" };
    if (text === "verifyTask()") target = { nodes: ["decide", "verify"], edge: 2, path: "apps/cli/src/plugin-api.ts", match: "const decision=verifyTask" };
    if (text === "progress comparison") target.match = "previous.progress.some";
    if (text.includes("Release metadata")) target = { nodes: [], path: "package.json", match: '"version": "0.3.17"' };
    if (text.includes("copies of source code")) target = { nodes: [], path: "docs/plugin-api.md", match: "// Mechanical per-turn guard" };
    if (text.includes("guidance now distinguishes")) target = { nodes: [], path: "references/understanding-plan.md", match: "No continuation is registered by installation" };
    setOverride({ nodeIds: target.nodes, edgeId: target.edge, match: target.match });
    setPath(target.path);
    setView("diff");
    setReplay((v) => v + 1);
  }
  function moveScene(type) {
    if (mobile) window.scrollTo({ top: 0, behavior: "instant" });
    storyDispatch({ type });
    setExploring(false);
    setOverride(null);
    setPath("");
    setView("flow");
    setReplay((v) => v + 1);
  }
  function startPlayback() {
    if (story.playing) {
      storyDispatch({ type: "pause" });
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView("diff");
      storyDispatch({ type: "pause" });
      return;
    }
    setOverride(null);
    setView("flow");
    storyDispatch({ type: "play" });
  }
  const teaching = curated && !exploring ? copy[lesson.id] : null;
  async function loadPR(next = url) {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: next }) });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setPR(data);
      setStep(0);
      setSelected(data.head === pinned ? "run" : data.head === surfaceExample.head ? "shell" : "0");
      setPath("");
      setExploring(false);
      setOverride(null);
      setShowImport(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadPR(sample);
  }, []);
  function teach(i) {
    storyDispatch({ type: "select", step: i });
    if (mobile) window.scrollTo({ top: 0, behavior: "instant" });
    setChapters(false);
    setView("flow");
    setExploring(false);
    setOverride(null);
    setPath("");
    setSelected(lessons[i].nodes.at(-1));
    setReplay((v) => v + 1);
  }
  function explore(n) {
    storyDispatch({ type: "pause" });
    setSelected(n.id);
    setPath(n.file);
    setExploring(true);
    const methodAnchor = n.match ?? { run: "export async function run", stop: "export function runTaskStop", decide: "export function decideTaskStop", verify: "export function verifyTask" }[n.id];
    setOverride(methodAnchor ? { nodeIds: [n.id], edgeId: null, match: methodAnchor } : null);
    if (mobile) setView("diff");
  }
  useEffect(() => {
    const handle = (e) => {
      const c = e.detail;
      if (!c || typeof c !== "object" || c.head !== pr?.head) return;
      if (c.lessonId && curated) {
        const i = lessons.findIndex((l) => l.id === c.lessonId);
        if (i >= 0) {
          teach(i);
          storyDispatch({ type: "select", step: i, scene: c.scene });
        }
        return;
      }
      if (c.path && pr?.files.some((f) => f.path === c.path)) {
        storyDispatch({ type: "pause" });
        setPath(c.path);
        setExploring(true);
        setOverride({ nodeIds: Array.isArray(c.nodeIds) ? c.nodeIds.filter((id) => nodes.some((n) => n.id === id)) : [], edgeId: Number.isInteger(c.edgeId) && c.edgeId >= 0 && c.edgeId < 3 ? c.edgeId : null, match: typeof c.match === "string" ? c.match : "" });
        setReplay((v) => v + 1);
      }
    };
    window.addEventListener("pr-teacher:focus", handle);
    return () => window.removeEventListener("pr-teacher:focus", handle);
  }, [pr, curated]);
  useEffect(() => {
    if (!follow) return;
    const target = codeRef.current?.querySelector(".code-focus");
    if (target && codeRef.current.getClientRects().length) {
      const token = target.querySelector(".focus-token"), container = codeRef.current.getBoundingClientRect();
      codeRef.current.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top - container.top + codeRef.current.scrollTop - (mobile ? 70 : 20)), left: token ? Math.max(0, token.getBoundingClientRect().left - container.left + codeRef.current.scrollLeft - 70) : 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      if (mobile && view === "diff") {
        const section = codeRef.current.closest(".diff-section");
        window.scrollTo({ top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - 120), behavior: "instant" });
      }
    }
    if (!mobile && follow && explanationRef.current) {
      const paragraph = explanationRef.current.querySelector(".current-scene");
      if (paragraph) {
        const container = explanationRef.current;
        container.scrollTo({ top: Math.max(0, paragraph.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 45), behavior: "instant" });
      }
    }
  }, [step, story.scene, story.beat, view, mobile, path, replay, follow, pr, override]);
  useEffect(() => {
    const stream = new EventSource("/api/focus/stream");
    stream.onmessage = (e) => {
      try {
        window.dispatchEvent(new CustomEvent("pr-teacher:focus", { detail: JSON.parse(e.data) }));
      } catch {
      }
    };
    return () => stream.close();
  }, []);
  const tokens = Object.fromEntries(Object.entries(darkColors).map(([k, v]) => ["--" + k, v]));
  return <div className={`app view-${view}`} style={tokens} onPointerDown={(e) => {
    if (story.playing && !e.target.closest(".mobile-player")) storyDispatch({ type: "pause" });
  }} onWheel={() => {
    if (story.playing) storyDispatch({ type: "pause" });
  }} onTouchMove={() => {
    if (story.playing) storyDispatch({ type: "pause" });
  }}><header><strong>DecompozR</strong><span className="header-separator" /><span>{pr ? `${pr.repository} / PR #${pr.number}` : "PR teaching"}</span><span className="header-title">{pr?.title ?? "Importing repository evidence…"}</span><IconButton icon="download" label="Import PR" aria-expanded={showImport} onClick={() => setShowImport(!showImport)} /><IconButton icon="files" label={showFiles ? "Hide files" : "All files"} aria-expanded={showFiles} onClick={() => setShowFiles(!showFiles)} />{pr && <a className="icon-button" aria-label="Open PR on GitHub" title="Open PR on GitHub" href={pr.url} target="_blank" rel="noreferrer"><Icon name="external-link" /></a>}</header>
{(showImport || error) && <form className="import-bar" onSubmit={(e) => {
    e.preventDefault();
    loadPR();
  }}><label htmlFor="example-source" className="sr-only">Example change</label><select id="example-source" value={url === sample || url === flowSample ? url : ""} onChange={e => {setURL(e.target.value);loadPR(e.target.value);}}><option value="" disabled>Custom PR</option><option value={sample}>Surface · Navigation repair · 61d6352</option><option value={flowSample}>Flow · Bounded continuation · 4e1e59b</option></select><label htmlFor="pr-url">GitHub PR URL</label><input id="pr-url" value={url} onChange={(e) => setURL(e.target.value)} required /><IconButton icon="download" label={loading ? "Importing PR" : "Import"} disabled={loading} type="submit" />{error && <span role="alert">{error}</span>}</form>}
{!pr ? <main className="empty" role="status">{loading ? "Reading PR metadata and diff through your existing GitHub CLI…" : "Import a PR to begin."}</main> : <><section className="behavior-map" aria-label="Whole PR grouped by behavior"><div className="behavior-heading"><strong>Whole PR</strong><small>{pr.files.length} files · {groups.reduce((n,g) => n+g.additions,0)} added · {groups.reduce((n,g) => n+g.deletions,0)} removed</small></div><nav ref={groupNavRef} aria-label="Behavior groups">{groups.map(g => <button key={g.id} aria-pressed={activeGroup?.id === g.id} onClick={() => g.step !== undefined ? teach(g.step) : explore({id: "file", file:g.files[0].path})}><Icon name={g.icon} /><span>{g.title}</span><small><span className="added">+{g.additions}</span> <span className="removed">−{g.deletions}</span></small></button>)}</nav><div className="behavior-context"><span className="behavior-current">{activeGroup?.title}</span><p>{activeGroup?.summary}</p><details key={activeGroup?.id}><summary>{activeGroup?.files.length} {activeGroup?.files.length === 1 ? "file" : "files"}</summary><div>{activeGroup?.files.map(f => <button key={f.path} onClick={() => explore(nodes.find(n => n.file === f.path) ?? {id: "file", file:f.path})}><span>{f.path}</span><small className="added">+{f.additions}</small><small className="removed">−{f.deletions}</small></button>)}</div></details></div></section><main className="workspace">
{mobile && <section className="mobile-story" aria-label="Current story explanation">
<div className="mobile-story-heading"><span className="story-badge">{step + 1}</span><div><div className="eyebrow">{exploring ? "Exploring · position saved" : curated ? `Step ${step + 1} of ${storyStepCount} · Scene ${story.scene + 1} of 4` : "File diff exploration"}</div><h1>{exploring ? "Inspect this change" : lesson.question}</h1></div></div>
<div className="view-switch" role="group" aria-label="Evidence view"><button aria-pressed={view === "flow"} onClick={() => {
    setView("flow");
    storyDispatch({ type: "pause" });
  }} aria-label="Flow" title="Flow"><Icon name="git-branch" /></button><button aria-pressed={view === "diff"} onClick={() => {
    setView("diff");
    storyDispatch({ type: "pause" });
  }} aria-label="Diff" title="Diff"><Icon name="file-code" /></button></div>
{exploring ? <p>{file?.path}. Your story position is saved. Resume below to return.</p> : <div className="scene-explanation" aria-live="polite"><h2>{curated ? sceneLabels[story.scene] : "Source overview"}</h2><p><TeachingText text={storyText} onFocus={focusText} /></p><small className="sr-only">Red − removed · Green + added · Yellow ~ modified. Tap a colored reference to focus its evidence.</small></div>}
</section>}
<aside className="lesson" aria-label="Guided lesson"><div className="eyebrow">{exploring ? "Exploring · lesson position preserved" : `Lesson ${curated ? step + 1 : 1} of ${curated ? storyStepCount : 1}`}</div><h1>{exploring ? "Inspect this change" : lesson.question}</h1><div className="instruction"><strong>{lesson.why}</strong><p>{lesson.challenge}</p></div><IconButton icon="circle-dot" label="Focus follows lesson" aria-pressed={follow} onClick={() => setFollow(!follow)} /><div className="exploration"><IconButton icon="files" label="Explore callers & files" onClick={() => { setShowFiles(true); setExploring(true); }} />{curated && <IconButton icon="play" label={`Resume step ${step + 1}`} onClick={() => teach(step)} />}</div><div className="provenance">Head {pr.head.slice(0, 12)}<br />Base {pr.base.slice(0, 12)}<br />{pr.completeFileList ? "File list complete" : "File list incomplete — inspect GitHub"}<br />{surface ? "Source-backed component configuration" : "Source-backed calls"} · self-checked model<br />Tests are evidence locations, not rerun results.</div></aside>
<section className="review" aria-label="System graph and evidence"><section className="graph-section" aria-label="Change graph"><div className="section-heading"><h2>How the change fits together</h2><div className="legend"><span className="added">+ Added</span><span className="removed">− Removed</span><span className="modified">~ Modified</span><span>Context</span></div></div><p className={curated ? "sr-only" : "muted"}>{curated ? "The same focus appears in the lesson and source diff. Supporting groups do not introduce new call edges." : "File changes from GitHub. This view does not infer call relationships."}</p><Suspense fallback={<p className="notice">Loading call graph…</p>}><ThreeGraph nodes={nodes} directed={curated} mobile={mobile} focus={focus} step={step} follow={follow} replay={replay} onNode={explore} relation={surface ? surfaceExample.relation : "calls"} onEdge={(i) => teach(surface ? 2 : i === 0 ? 1 : 2)} /></Suspense><div ref={explanationRef} className="graph-caption" aria-live="polite" tabIndex="0" aria-label="Scrollable step explanation"><h3>{!exploring && <span className="story-badge">{step + 1}</span>}{exploring ? file?.path : `Step ${step + 1} · ${lesson.title}`}</h3>{teaching ? <div className="teaching-note" aria-label={`Explanation for step ${step + 1}`}>
<p className="current-scene" aria-current="step"><strong>{story.scene + 1} · {sceneLabels[story.scene]}. </strong><TeachingText text={storyText} onFocus={focusText} /></p>
</div> : <p>{curated ? surface ? "The graph shows component configuration. Provider internals and binary contents are not inferred from this patch." : "Calls are visible in the source. Diff status, review risk and uncertainty are separate." : "No semantic model inferred. Rename metadata and unavailable patches are retained."}</p>}</div></section>
<section className="diff-section" aria-label="Source diff"><div className="diff-heading"><h2>{file?.path ?? "Select evidence"}</h2><span className="evidence-label">{activeGroup?.title} · Step {step + 1} · Source diff · PR #{pr.number}</span><span>{file && `${labels[file.status]} · +${file.additions} −${file.deletions}`}</span></div>{file?.previousPath && <p>Renamed from {file.previousPath}</p>}<div className="code" ref={codeRef} tabIndex="0" aria-label="Scrollable unified diff">{file?.patch ? patchLines(file.patch).map((l) => {
    const active = Boolean(focus.match && l.text.includes(focus.match));
    return <div key={l.index} className={`code-line ${l.kind} ${active ? "code-focus" : ""} ${l.kind !== "context" && l.kind !== "hunk" && activeGroup?.files.some(f => f.path === file.path) ? "behavior-evidence" : ""}`}><span className="line-number">{l.old}</span><span className="line-number">{l.next}</span><code>{active ? <>{l.text.slice(0, l.text.indexOf(focus.match))}<mark className="focus-token">{focus.match}</mark>{l.text.slice(l.text.indexOf(focus.match) + focus.match.length)}</> : l.text}</code>{active && <span className="focus-marker">{step + 1}</span>}</div>;
  }) : <p className="notice">Patch unavailable (binary, large file, or API omission). No completeness claim. <a href={pr.url + "/files"} target="_blank" rel="noreferrer">Inspect GitHub</a>.</p>}</div></section></section>
{showFiles && <aside className="files" aria-label="All changed files"><div className="section-heading"><h2>All {pr.files.length} files</h2><IconButton icon="close" label="Close files" onClick={() => setShowFiles(false)} /></div>{pr.files.map((f, i) => <button className={`file-row ${f.status}`} key={f.path} onClick={() => {
    explore(nodes.find((n) => n.file === f.path) ?? { id: String(i), file: f.path });
    setShowFiles(false);
  }}><span>{labels[f.status]}</span><strong>{f.path}</strong><small>+{f.additions} −{f.deletions}{!f.patch ? " · patch unavailable" : ""}</small></button>)}</aside>}</main>
{curated && <section ref={playerRef} className="mobile-player" style={{ transform: `translate(calc(-50% + ${playerPosition.x}px), ${playerPosition.y}px)` }} aria-label="Story player">
<div className="player-row"><button className="player-drag" aria-label="Move story player. Drag, use arrow keys, or Home to reset." onPointerDown={dragPlayerStart} onPointerMove={dragPlayerMove} onPointerUp={() => {
    playerDrag.current = null;
  }} onPointerCancel={() => {
    playerDrag.current = null;
  }} onKeyDown={movePlayerKey} title="Move story player"><Icon name="grip-horizontal" /></button><div className="player-controls">{exploring ? <button className="primary" onClick={() => {
    storyDispatch({ type: "select", step, scene: story.scene });
    setExploring(false);
    setPath("");
    setOverride(null);
    setView("flow");
  }} aria-label={`Resume step ${step + 1}`} title={`Resume step ${step + 1}`}><Icon name="play" /></button> : <><IconButton icon="arrow-right" className="previous" label="Previous" disabled={step === 0 && story.scene === 0} onClick={() => moveScene("previous")} /><IconButton icon={story.playing ? "pause" : "refresh"} className="primary" label={story.playing ? "Pause" : "Replay"} aria-pressed={story.playing} onClick={startPlayback} /><IconButton icon="arrow-right" label="Next" disabled={step === storyStepCount - 1 && story.scene === 3} onClick={() => moveScene("next")} /></>}</div>
<button className="player-count" onClick={() => { setChapters(!chapters); storyDispatch({ type: "pause" }); }} aria-expanded={chapters} aria-controls="story-chapters" aria-label={`Choose teaching step. Step ${step + 1} of ${storyStepCount}, scene ${story.scene + 1} of 4`} title={`Step ${step + 1} of ${storyStepCount} · Scene ${story.scene + 1} of 4 · Choose chapter`}>{step * 4 + story.scene + 1}/{storySceneCount}</button></div>{chapters && <nav id="story-chapters" className="chapter-list" aria-label="Choose teaching step">{lessons.map((l, i) => <button key={l.id} onClick={() => teach(i)} aria-current={i === step ? "step" : void 0}>{i + 1} · {l.title}</button>)}</nav>}
<div className="sr-only player-status" aria-live="polite">{exploring ? "Exploring · playback paused" : story.playing ? surface ? "Demonstrating component → configuration → diff" : "Demonstrating method → call → diff" : story.scene === 3 ? "Checkpoint · take your time, then Next" : "Paused for reading · Next continues the story"}</div>
</section>}
<div className="sr-only" aria-live="polite">{exploring ? "Exploring " + file?.path : `Step ${step + 1}: ${lesson.title}`}</div></>}
</div>;
}
