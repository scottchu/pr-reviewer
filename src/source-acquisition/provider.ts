import type { AcquisitionEffects, Candidate, ChangeReference, Discovery, Issue, LookupResult, Provider } from "./public.ts";
const hostPattern = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::[1-9][0-9]{0,4})?$/;
const projectPattern = /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+$/;
const projectValid = (value: string) => projectPattern.test(value) && !value.split("/").some(p => p === "." || p === ".." || p.startsWith("-"));
const sha = (value: unknown): value is string => typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const string = (value: unknown): string => typeof value === "string" ? value : "";
const project = (value: unknown) => { const result = string(value); if (!projectValid(result)) throw new Error("invalid metadata"); return result; };
const safeHost = (value: string) => hostPattern.test(value) && !value.includes("..") && !value.startsWith("-");
const decode = (bytes: Buffer) => new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);

export const parseRemote = (remote: string): Readonly<{ host: string; project: string }> | null => {
  // Parse the raw path before URL normalization so ../ cannot disappear.
  const url = /^(?:https?|ssh|git):\/\/(?:[^/@\s]+@)?([^/\s]+)\/(.+)$/.exec(remote);
  const scp = /^(?:[^@\s]+@)?([^/:\s]+):(.+)$/.exec(remote);
  const match = url ?? scp;
  if (!match?.[1] || !match[2]) return null;
  const host = match[1].toLowerCase();
  let path: string;
  try { path = decodeURIComponent(match[2]).replace(/\.git$/, ""); } catch { return null; }
  return safeHost(host) && projectValid(path) ? { host, project: path } : null;
};

const api = async (provider: Provider, host: string, endpoint: string, cwd: string, effects: AcquisitionEffects): Promise<unknown> => {
  const result = await effects.run({ executable: provider === "github" ? "gh" : "glab", args: ["api", "--hostname", host, endpoint], cwd, maxBytes: 2_000_000, timeoutMs: 15_000 });
  if (result.kind !== "ok") throw { reason: result.reason, provider, host } satisfies Issue;
  try { return JSON.parse(decode(result.stdout)) as unknown; } catch { throw { reason: "invalid_metadata", provider, host } satisfies Issue; }
};
const issue = (error: unknown, provider?: Provider, host?: string): Issue => {
  const candidate = record(error);
  return { reason: ["tool_missing", "authentication", "command_failed", "output_limit", "timeout", "inventory_limit"].includes(string(candidate.reason)) ? candidate.reason as Issue["reason"] : "invalid_metadata", ...(provider ? {provider} : {}), ...(host ? {host} : {}) };
};
const validateURL = (value: unknown, ref: ChangeReference): string => {
  const expected = `https://${ref.host}/${ref.targetProject}/${ref.provider === "github" ? "pull" : "-/merge_requests"}/${ref.number}`;
  if (value !== expected) throw new Error("invalid provider URL");
  return expected;
};
const validRef = (ref: ChangeReference) => !!ref && typeof ref.host === "string" && typeof ref.targetProject === "string" && (ref.provider === "github" || ref.provider === "gitlab") && safeHost(ref.host) && projectValid(ref.targetProject) && Number.isSafeInteger(ref.number) && ref.number > 0;

export const lookupChange = async (ref: ChangeReference, effects: AcquisitionEffects, cwd: string): Promise<LookupResult> => {
  if (!validRef(ref)) return {kind:"unavailable",issues:[{reason:"invalid_input"}]};
  const identity: ChangeReference = {provider:ref.provider,host:ref.host,targetProject:ref.targetProject,number:ref.number};
  try {
    if (ref.provider === "github") {
      const data = record(await api("github", ref.host, `repos/${ref.targetProject}/pulls/${ref.number}`, cwd, effects));
      const head = record(data.head), base = record(data.base);
      if (data.number !== ref.number || project(record(base.repo).full_name) !== ref.targetProject || !sha(head.sha) || !sha(base.sha)) throw new Error("invalid identity");
      const comparison = record(await api("github", ref.host, `repos/${ref.targetProject}/compare/${base.sha}...${head.sha}`, cwd, effects));
      const baseSha = record(comparison.merge_base_commit).sha;
      if (!sha(baseSha) || !string(head.ref) || !string(base.ref)) throw new Error("missing baseline");
      return {kind:"resolved",candidate:{...identity, sourceProject:project(record(head.repo).full_name), sourceBranch:string(head.ref), targetBranch:string(base.ref), url:validateURL(data.html_url,ref), title:string(data.title), state:string(data.state), baseSha, headSha:head.sha, targetTipSha:base.sha, baselineMethod:"github_compare_merge_base"}};
    }
    const data = record(await api("gitlab", ref.host, `projects/${encodeURIComponent(ref.targetProject)}/merge_requests/${ref.number}`, cwd, effects));
    const refs = record(data.diff_refs);
    if (data.iid !== ref.number || !Number.isSafeInteger(data.source_project_id) || !Number.isSafeInteger(data.target_project_id) || !sha(refs.base_sha) || !sha(refs.head_sha) || !sha(refs.start_sha)) throw new Error("missing diff refs");
    const source = record(await api("gitlab", ref.host, `projects/${data.source_project_id}`, cwd, effects));
    const target = record(await api("gitlab", ref.host, `projects/${data.target_project_id}`, cwd, effects));
    if (project(target.path_with_namespace) !== ref.targetProject || !string(data.source_branch) || !string(data.target_branch)) throw new Error("wrong target");
    return {kind:"resolved",candidate:{...identity,sourceProject:project(source.path_with_namespace),sourceBranch:string(data.source_branch),targetBranch:string(data.target_branch),url:validateURL(data.web_url,ref),title:string(data.title),state:string(data.state),baseSha:refs.base_sha,headSha:refs.head_sha,targetTipSha:refs.start_sha,baselineMethod:"gitlab_diff_refs"}};
  } catch (error) { return {kind:"unavailable",issues:[issue(error,ref.provider,ref.host)]}; }
};

export const discoverChange = async (path: string, effects: AcquisitionEffects): Promise<Discovery> => {
  const state: {canonicalWorktree:string|null;branch:string|null;upstream:string|null;remotes:{host:string;project:string}[];candidates:Candidate[];issues:Issue[]} = {canonicalWorktree:null,branch:null,upstream:null,remotes:[],candidates:[],issues:[]};
  const finish = (reason: Discovery["reason"]): Discovery => ({...state,kind:state.issues.length ? "unavailable" : state.candidates.length > 1 ? "ambiguous" : state.candidates.length === 1 ? "unique" : "none",reason:state.issues.length ? "incomplete" : reason});
  const git = async (args: readonly string[], cwd: string) => effects.run({executable:"git",args:["--no-optional-locks","-c","core.fsmonitor=false",...args],cwd,maxBytes:128_000,timeoutMs:5_000});
  if (!path || path.includes("\0")) {state.issues.push({reason:"invalid_input"});return finish("incomplete");}
  const root = await git(["rev-parse","--show-toplevel"],path);
  if (root.kind !== "ok") {state.issues.push({reason:root.reason});return finish("incomplete");}
  try {state.canonicalWorktree = decode(root.stdout).replace(/\n$/,"");} catch {state.issues.push({reason:"invalid_input"});return finish("incomplete");}
  const cwd = state.canonicalWorktree;
  if (!cwd) {state.issues.push({reason:"invalid_input"});return finish("incomplete");}
  const branch = await git(["symbolic-ref","--quiet","--short","HEAD"],cwd);
  if (branch.kind !== "ok") {
    if (branch.reason !== "command_failed") state.issues.push({reason:branch.reason});
    return finish("detached");
  }
  state.branch = decode(branch.stdout).replace(/\n$/,"");
  const upstream = await git(["rev-parse","--symbolic-full-name","@{upstream}"],cwd);
  if (upstream.kind === "ok") state.upstream = decode(upstream.stdout).trim() || null;
  const rawRemotes = await git(["config","--null","--get-regexp","^remote\\..*\\.url$"],cwd);
  if (rawRemotes.kind !== "ok") { if (rawRemotes.reason !== "command_failed") state.issues.push({reason:rawRemotes.reason}); return finish("no_match"); }
  try {
    for (const row of decode(rawRemotes.stdout).split("\0").filter(Boolean)) {
      const remote = parseRemote(row.slice(row.indexOf("\n")+1));
      if (remote && !state.remotes.some(r => r.host === remote.host && r.project === remote.project)) state.remotes.push(remote);
    }
  } catch {state.issues.push({reason:"invalid_input"});return finish("incomplete");}
  if (state.remotes.length > 16) {state.issues.push({reason:"inventory_limit"});return finish("incomplete");}
  for (const host of [...new Set(state.remotes.map(r => r.host))]) {
    // Unknown/self-hosted services are probed through both existing authenticated clients.
    const providers: Provider[] = host === "github.com" ? ["github"] : host === "gitlab.com" ? ["gitlab"] : ["github","gitlab"];
    const routeIssues: Issue[] = [];
    let candidateReads = 0;
    const recognizedProviders = new Set<Provider>();
    for (const provider of providers) {
      const routeCandidates: Candidate[] = [];
      const lookupIssues: Issue[] = [];
      try {
        const sources = state.remotes.filter(r => r.host === host);
        const targets = new Set(sources.map(r => r.project));
        for (const source of sources) {
          const info = record(await api(provider,host,provider === "github" ? `repos/${source.project}` : `projects/${encodeURIComponent(source.project)}`,cwd,effects));
          if (provider === "github") {
            if (project(info.full_name) !== source.project) throw new Error("wrong source");
            if (record(info.parent).full_name) targets.add(project(record(info.parent).full_name));
          } else {
            if (project(info.path_with_namespace) !== source.project) throw new Error("wrong source");
            const fork = record(info.forked_from_project);
            if (fork.path_with_namespace) targets.add(project(fork.path_with_namespace));
          }
        }
        recognizedProviders.add(provider);
        for (const target of targets) for (const source of sources) {
          const endpoint = provider === "github" ? `repos/${target}/pulls?state=open&per_page=100&head=${encodeURIComponent(`${source.project.split("/")[0]}:${state.branch}`)}` : `projects/${encodeURIComponent(target)}/merge_requests?state=opened&scope=all&per_page=100&source_branch=${encodeURIComponent(state.branch ?? "")}`;
          const listed = await api(provider,host,endpoint,cwd,effects);
          if (!Array.isArray(listed)) throw new Error("invalid list");
          if (listed.length >= 100 || (candidateReads += listed.length) > 100) throw {reason:"inventory_limit"};
          for (const value of listed) {
            const number = provider === "github" ? record(value).number : record(value).iid;
            if (!Number.isSafeInteger(number)) throw new Error("bad number");
            const result = await lookupChange({provider,host,targetProject:target,number:number as number},effects,cwd);
            if (result.kind === "unavailable") {lookupIssues.push(...result.issues);continue;}
            const candidate = result.candidate;
            if (candidate.sourceProject === source.project && candidate.sourceBranch === state.branch && candidate.targetProject === target && ["open","opened"].includes(candidate.state)) routeCandidates.push(candidate);
          }
        }
        state.issues.push(...lookupIssues);
        state.candidates.push(...routeCandidates);
      } catch (error) {routeIssues.push(issue(error,provider,host));}
    }
    // A successful self-host service probe excludes irrelevant other-client failures.
    state.issues.push(...(recognizedProviders.size ? routeIssues.filter(i => i.provider && recognizedProviders.has(i.provider)) : routeIssues));
  }
  state.candidates = [...new Map(state.candidates.map(c => [`${c.provider}:${c.host}:${c.targetProject}:${c.number}`,c])).values()].sort((a,b) => a.url.localeCompare(b.url));
  return finish(state.candidates.length ? "resolved" : "no_match");
};
