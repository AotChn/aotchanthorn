import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");

// Package only the public site, for both GitHub-triggered and CLI deployments.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of ["index.html", "html", "css", "js", "assets"]) {
  cpSync(join(root, entry), join(output, entry), {
    recursive: true,
    filter: source => basename(source) !== ".DS_Store"
  });
}
console.log("Static site ready in dist/");
