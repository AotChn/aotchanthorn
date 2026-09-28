import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import { loadContent, renderContent } from "./render-content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
// Validate owner data before replacing the previous build.
const content = loadContent(root);

// Package only the public site, for both GitHub-triggered and CLI deployments.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of ["index.html", "html", "css", "js", "assets"]) {
  cpSync(join(root, entry), join(output, entry), {
    recursive: true,
    filter: source => basename(source) !== ".DS_Store"
  });
}
const counts = renderContent(root, output, content);
console.log(`Static site ready in dist/: ${counts.projects} projects, ${counts.memos} memos, ${counts.pages} pages.`);
