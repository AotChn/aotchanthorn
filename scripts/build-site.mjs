import { cpSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import { loadContent, renderContent } from "./render-content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const publicEntries = ["index.html", "html", "css", "js", "assets"];

function build() {
  // Validate owner data before replacing the previous build.
  const content = loadContent(root);

  // Package only the public site, for both GitHub-triggered and CLI deployments.
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  for (const entry of publicEntries) {
    cpSync(join(root, entry), join(output, entry), {
      recursive: true,
      filter: source => basename(source) !== ".DS_Store"
    });
  }
  const counts = renderContent(root, output, content);
  console.log(`Static site ready in dist/: ${counts.projects} projects, ${counts.memos} memos, ${counts.pages} pages.`);
}

build();
if (process.argv.includes("--watch")) {
  // Poll only public source files, never dist/ or .git/. This also works when
  // native filesystem watchers are unavailable or exceed the OS watch limit.
  function fingerprint(path) {
    if (basename(path) === ".DS_Store") return "";
    const info = statSync(path);
    if (info.isDirectory()) return readdirSync(path).sort().map(name => fingerprint(join(path, name))).join("|");
    return `${path}:${info.mtimeMs}:${info.size}:${info.ino}`;
  }
  const snapshot = () => publicEntries.map(entry => fingerprint(join(root, entry))).join("|");
  let previous = snapshot(), reportedError;
  setInterval(() => {
    try {
      const current = snapshot();
      if (current === previous) return;
      previous = current;
      build();
      reportedError = null;
    } catch (error) {
      if (reportedError !== error.message) console.error("Preview rebuild failed:", error.message);
      reportedError = error.message;
    }
  }, 750);
  console.log("Watching source files. Save changes, then refresh the local preview. Ctrl+C stops watching.");
}
