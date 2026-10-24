import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const allowed: Record<string, string[]> = {
  domain: ["source-acquisition","source-analysis"],
  storage: ["domain","source-preparation"],
  "source-preparation":["domain","source-acquisition","source-analysis"],
  "source-acquisition":[],
  "source-analysis":[],
  "import-artifacts":[],
  "import-jobs":["domain","storage","source-acquisition","source-preparation","import-artifacts","integration"],
  delivery: ["domain", "storage"],
  server: ["domain", "storage", "delivery", "integration", "source-preparation","import-jobs","import-artifacts"],
  mcp: ["domain"],
  integration: [],
  application: ["domain", "integration"],
  ui: ["application", "domain"],
};
const failures: string[] = [];
for (const [subsystem, dependencies] of Object.entries(allowed)) {
  for (const file of await readdir(join("src", subsystem))) {
    if (!/\.tsx?$/.test(file)) continue;
    const text = await readFile(join("src", subsystem, file), "utf8");
    for (const match of text.matchAll(
      /(?:from\s*|import\s*)['"]\.\.\/([^/]+)\/([^'"]+)['"]/g,
    )) {
      const target = match[1] ?? "",
        name = match[2] ?? "";
      if (
        !dependencies.includes(target) ||
        (target !== "integration" && !name.startsWith("public."))
      )
        failures.push(
          `${subsystem}/${file} imports internal/unapproved ${target}/${name}`,
        );
    }
  }
}
if (failures.length) throw new Error(failures.join("\n"));
console.log("Subsystem import boundaries passed.");
