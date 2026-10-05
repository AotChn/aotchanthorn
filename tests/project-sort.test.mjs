import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const window = {};
runInNewContext(readFileSync(new URL("../js/project-sort.js", import.meta.url), "utf8"), { window });
const sort = window.AOT_SORT_PROJECTS;
const projects = ["", "2023", "July 2026", "2026-07-15", "2026-09", "2026", "Jul. 2026", "2026-02-30", "In progress"]
  .map((lastUpdated, index) => Object.freeze({ title: `Project ${index}`, lastUpdated }));
Object.freeze(projects);

test("both date orders support mixed precision, stable ties, and unknown dates last", () => {
  assert.deepEqual(sort(projects).map(item => item.index), [4, 3, 2, 6, 5, 1, 0, 7, 8]);
  assert.deepEqual(sort(projects, "oldest").map(item => item.index), [1, 5, 2, 6, 3, 4, 0, 7, 8]);
});

test("sorting preserves original project identities and their displayed dates", () => {
  for (const { project, index } of sort(projects)) assert.equal(project, projects[index]);
  assert.equal(projects[2].lastUpdated, "July 2026");
  assert.equal(projects[5].lastUpdated, "2026");
  assert.deepEqual(sort([]), []);
});

test("invalid calendar dates never roll into a different month during sorting", () => {
  const entries = ["2023-02-29", "2024-02-29", "September 2026", "2026-13", "Notamonth 2026"]
    .map(lastUpdated => ({ lastUpdated }));
  assert.deepEqual(sort(entries).map(item => item.index), [2, 1, 0, 3, 4]);
});
