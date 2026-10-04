import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent, renderContent, validateContent, escapeHTML } from "../scripts/render-content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const original = loadContent(root);
function fixture() {
  return { ...original, projects: structuredClone(original.projects), memos: structuredClone(original.memos), graph: structuredClone(original.graph) };
}
function render(t, content = fixture()) {
  const output = mkdtempSync(join(tmpdir(), "aot-static-content-"));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  renderContent(root, output, content);
  return { output, read: path => readFileSync(join(output, path), "utf8") };
}

test("initial HTML contains every project, first-page memo, pinned memo, and graph connection", t => {
  const { read } = render(t);
  const work = read("html/work.html"), memos = read("html/writing.html"), home = read("html/portfolio.html");
  for (const project of original.projects) {
    assert(work.includes(escapeHTML(project.title.trim())));
    assert(work.includes(`href="${original.urls.project(project)}"`));
    const entry = read("html/" + original.urls.project(project));
    assert(entry.includes(escapeHTML(project.summary || project.description || "")));
    assert(entry.includes(escapeHTML(project.details || "")));
  }
  for (const memo of original.memos.slice(0, original.pageSize)) assert(memos.includes(escapeHTML(memo.summary)));
  for (const memo of original.memos.filter(memo => memo.pinned)) assert(home.includes(escapeHTML(memo.title)));
  for (const node of original.graph.nodes) {
    if (!node.label) continue;
    assert(home.includes(`<title>${escapeHTML(node.label)}</title>`));
    assert(home.includes(`<desc>${escapeHTML(node.note)}</desc>`));
  }
  assert.equal((home.match(/class="system-edge-idle"/g) || []).length, original.graph.edges.length);
  assert.equal((home.match(/class="system-node-body"/g) || []).length, original.graph.nodes.length);
  assert(!home.includes("Enable JavaScript to explore"));
  assert(!work.includes("No projects match this type."));
});

test("older memos have crawlable archive pages and full standalone content", t => {
  const content = fixture();
  content.pageSize = 2;
  content.memos.push({ slug: "new-memo", title: "A new memo", summary: "Short version", details: "Full memo detail without a click." });
  const { read } = render(t, content);
  for (let page = 0; page < 3; page++) {
    const html = read("html/" + content.urls.memoPage(page));
    assert(html.includes(`data-page="${page}"`));
    assert.equal((html.match(/class="update-card"/g) || []).length, 2);
    if (page < 2) assert(html.includes(`href="${content.urls.memoPage(page + 1)}" data-updates-older rel="next"`));
    if (page > 0) assert(html.includes(`href="${content.urls.memoPage(page - 1)}" data-updates-newer rel="prev"`));
  }
  assert(read("html/memos/new-memo.html").includes("Full memo detail without a click."));
  assert(read("sitemap.xml").includes("https://aotchn.com/html/memos/new-memo.html"));
  assert(read("sitemap.xml").includes("https://aotchn.com/html/writing-page-3.html"));
});

test("all generated same-site entry/archive links and canonical pages resolve", t => {
  const { read, output } = render(t);
  const pages = readdirSync(join(output, "html"), { recursive: true }).filter(file => file.endsWith(".html"));
  for (const page of pages) {
    const html = read("html/" + page);
    assert(html.includes('class="volume-toggle"'), `${page} needs the sound toggle`);
    assert(html.includes('js/audio-preferences.js'), `${page} needs sound preferences`);
    assert(html.indexOf('js/audio-preferences.js') < html.indexOf('js/nav.js'), `${page} must load sound preferences before navigation`);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href.replaceAll("&amp;", "&"), "https://aotchn.com/html/" + page);
      if (url.origin !== "https://aotchn.com" || !url.pathname.endsWith(".html")) continue;
      assert(existsSync(join(output, url.pathname)), `${page} links to missing ${url.pathname}`);
    }
  }
  assert(read("robots.txt").includes("Sitemap: https://aotchn.com/sitemap.xml"));
});

test("owner text is escaped, local media works on nested pages, dates stay truthful", t => {
  const content = fixture();
  content.projects = [{ slug: "safe-project", title: 'A <robot> & "tools"', function: "A > B", summary: '</script><script>alert("oops")</script>',
    details: "First line\nSecond line", type: "personal", lastUpdated: "2026-02-30", chips: ["C++", "A&B"],
    media: [{ type: "image", src: "../assets/test.jpg", alt: 'A "robot"' }, { type: "video", src: "../assets/demo.mp4", mimeType: "video/mp4" }] }];
  const { read } = render(t, content);
  const page = read("html/projects/safe-project.html");
  assert(page.includes("A &lt;robot&gt; &amp; &quot;tools&quot;"));
  assert(page.includes("&lt;/script&gt;&lt;script&gt;alert(&quot;oops&quot;)&lt;/script&gt;"));
  assert(!page.includes('<script>alert("oops")'));
  assert(page.includes('src="/assets/test.jpg"'));
  assert(page.includes('src="/assets/demo.mp4"'));
  assert(page.includes('alt="A &quot;robot&quot;"'));
  assert(!page.includes('datetime="2026-02-30"'));
  assert(page.includes("C++ · A&amp;B"));
});

test("bad or duplicate entry URLs fail the build instead of overwriting pages", () => {
  for (const slug of ["../escape", "UPPER", "has spaces", 123]) {
    const content = fixture(); content.memos[0].slug = slug;
    assert.throws(() => validateContent(content), /Invalid memo slug/);
  }
  const content = fixture(); content.projects.push({ ...content.projects[0] });
  assert.throws(() => validateContent(content), /Duplicate project slug/);
  content.projects.pop(); content.memos.push({ ...content.memos[0] });
  assert.throws(() => validateContent(content), /Duplicate memo slug/);
});

test("empty content still yields readable list pages and disabled pagination", t => {
  const content = fixture(); content.projects = []; content.memos = [];
  const { read } = render(t, content);
  assert(read("html/work.html").includes("0 projects"));
  assert(read("html/writing.html").includes("Total Memos: 0"));
  assert.equal((read("html/writing.html").match(/data-updates-(?:newer|older) aria-disabled="true"/g) || []).length, 2);
});
