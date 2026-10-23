import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dataRoot, files } from "./local.ts";
import type { Runtime } from "./local.ts";
const path = files(dataRoot()).runtime;
const runtime = JSON.parse(readFileSync(path, "utf8")) as Runtime;
if (runtime.status === "stopped") {
  console.log("Already stopped; accepted data preserved.");
  process.exit(0);
}
const start = execFileSync("ps", ["-p", String(runtime.pid), "-o", "lstart="], {
  encoding: "utf8",
}).trim();
const args = execFileSync("ps", ["-p", String(runtime.pid), "-o", "args="], {
  encoding: "utf8",
});
if (start !== runtime.processStart || !args.includes("scripts/dev.ts"))
  throw new Error("runtime PID ownership differs; no process signalled");
process.kill(runtime.pid, "SIGTERM");
console.log(
  "Sent graceful shutdown to verified task-owned runtime; data preserved.",
);
