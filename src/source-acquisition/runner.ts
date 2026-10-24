import { execFile } from "node:child_process";
import type { AcquisitionEffects, CommandResult } from "./public.ts";

/** Fixed executables; no shell, target environment programs, credential logging or writes. */
export const createNodeEffects = (): AcquisitionEffects => ({
  run: ({ executable, args, cwd, maxBytes, timeoutMs }) => new Promise<CommandResult>((resolve) => {
    const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));
    execFile(executable, [...args], {
      cwd, encoding: "buffer", maxBuffer: maxBytes, timeout: timeoutMs,
      env: { ...environment, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0", GH_PROMPT_DISABLED: "1", GLAB_CHECK_UPDATE: "false", GIT_NO_REPLACE_OBJECTS: "1", GIT_PAGER: "cat", PAGER: "cat" },
    }, (error, stdout, stderr) => {
      if (!error) return resolve({ kind: "ok", stdout });
      const code = (error as NodeJS.ErrnoException).code;
      const reason = code === "ENOENT" ? "tool_missing" : code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" ? "output_limit" : error.killed ? "timeout" : /authentication|not logged|login|HTTP 401|HTTP 403/i.test(stderr.toString()) ? "authentication" : "command_failed";
      // Deliberately return neither stderr nor command arguments: remote URLs may contain secrets.
      resolve({ kind: "unavailable", reason });
    });
  }),
});
