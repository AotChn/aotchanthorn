import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { runInNewContext } from "node:vm";

const site = "https://aotchn.com";
export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,
  character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const text = escapeHTML;
const types = { work: "Professional", personal: "Personal", school: "School", competition: "Competition" };
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function loadContent(root) {
  // These are our own data files. Their build-only early return avoids DOM work;
  // browser rendering and generated HTML always consume the same owner entries.
  const window = {};
  for (const file of ["content-urls.js", "project-sort.js", "projects.js", "life-updates.js", "system-graph-config.js"]) {
    runInNewContext(readFileSync(join(root, "js", file), "utf8"), { window }, { filename: file, timeout: 2000 });
  }
  const content = { projects: window.AOT_PROJECTS, memos: window.AOT_LIFE_UPDATES,
    graph: window.AOT_SYSTEM_GRAPH, pageSize: window.AOT_MEMO_PAGE_SIZE, urls: window.AOT_CONTENT_URLS,
    sortProjects: window.AOT_SORT_PROJECTS, isProjectLocked: window.AOT_IS_PROJECT_LOCKED };
  validateContent(content);
  return content;
}

export function validateContent(content) {
  for (const [name, entries, slug] of [
    ["project", content.projects, entry => content.urls.projectSlug(entry)],
    ["memo", content.memos, entry => entry.slug]
  ]) {
    const seen = new Set();
    for (const entry of entries) {
      if (typeof entry.title !== "string" || !entry.title.trim()) throw new Error(`Every ${name} needs a title.`);
      const id = slug(entry);
      if (typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid ${name} slug: ${id}. Use lowercase words separated by hyphens.`);
      if (seen.has(id)) throw new Error(`Duplicate ${name} slug: ${id}. Give each entry a unique slug.`);
      seen.add(id);
    }
  }
  if (!Number.isInteger(content.pageSize) || content.pageSize < 1) throw new Error("Memo pageSize must be a positive integer.");
}

function region(html, name, value) {
  const pattern = new RegExp(`<!-- static:${name} -->[\\s\\S]*?<!-- /static:${name} -->`);
  if (!pattern.test(html)) throw new Error(`Missing static content region: ${name}`);
  return html.replace(pattern, () => `<!-- static:${name} -->\n${value}\n<!-- /static:${name} -->`);
}

function dateMarkup(value) {
  const dateText = String(value ?? "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? new Date(dateText + "T00:00:00Z") : null;
  return date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateText
    ? `<time class="project-updated" datetime="${text(dateText)}">${text(dateFormat.format(date))}</time>`
    : `<span class="project-updated">${text(dateText || "—")}</span>`;
}

export function renderProjectRow(project, index, urls) {
  const type = Object.hasOwn(types, project.type) ? project.type : "unset";
  return `<tr class="project-row" data-project-index="${index}" data-project-type="${type}">
    <td class="project-graph-cell"></td>
    <td class="project-type-cell"><span class="project-mobile-label">Type</span><span class="${type === "unset" ? "project-unset" : "project-type-badge"}">${types[type] || "—"}</span></td>
    <td class="project-name-cell"><a class="project-title-button" href="${text(urls.project(project))}" aria-label="Open project: ${text(project.title.trim())}">${text(project.title.trim())}</a></td>
    <td class="project-function-cell"><span class="project-mobile-label">Function</span><p class="project-function-copy">${text(project.function || project.description || "—")}</p></td>
    <td class="project-updated-cell"><span class="project-mobile-label">Last updated</span>${dateMarkup(project.lastUpdated)}</td>
  </tr>`;
}

function memoImage(item) {
  if (!item) return "";
  return `<figure class="memo-card-image${item.wordmark ? " memo-card-image-wordmark" : ""}">
    <img src="${text(assetURL(item.src))}" alt="${text(item.alt)}" loading="lazy" decoding="async">
    ${item.wordmark ? `<div class="memo-card-wordmark"><span class="memo-card-wordmark-name">${text(item.wordmark)}</span>${item.subtitle ? `<span class="memo-card-wordmark-subtitle">${text(item.subtitle)}</span>` : ""}</div>` : ""}
  </figure>`;
}

function memoCard(memo, urls) {
  const cardImage = memo.cardImage || memo.media?.find(item => item.type === "image" && item.cardPosition);
  return `<a class="update-card"${cardImage?.cardPosition === "right" ? ' data-image-position="right"' : ""} id="${text(memo.slug)}" data-update-slug="${text(memo.slug)}" href="${text(urls.memo(memo))}">
    <div class="update-card-meta">${text(memo.label)}</div>
    <h2 class="update-card-title">${text(memo.title)}</h2>
    ${memoImage(cardImage)}
    <p class="update-card-copy">${text(memo.summary)}</p>
  </a>`;
}

function homeMemo(memo) {
  return `<a class="feature-card feature-card-link" href="writing.html#${text(memo.slug)}">
    <div class="feature-label">★</div><h2 class="feature-title">${text(memo.title)}</h2>
    <p class="feature-copy">${text(memo.summary)}</p></a>`;
}

export function renderGraph(config) {
  const nodes = new Map(config.nodes.map(node => [node.id, node]));
  const edges = config.edges.map(edge => {
    const from = nodes.get(edge.from), to = nodes.get(edge.to);
    if (!from || !to) throw new Error(`Unknown graph connection: ${edge.from} → ${edge.to}`);
    const path = [[from.x, from.y], ...(edge.via || []), [to.x, to.y]]
      .map((point, index) => (index ? "L" : "M") + point.join(" ")).join(" ");
    return `<g class="system-edge"><title>${text(from.label)} → ${text(to.label)}</title><path class="system-edge-idle" d="${text(path)}" stroke="${text(edge.color)}"/></g>`;
  }).join("\n");
  const shapes = config.nodes.map(node => {
    const labelY = node.y < 45 ? 48 : -30;
    const anchor = node.x < 100 ? "start" : node.x > 1180 ? "end" : "middle";
    const shape = node.shape === "rhombus" ? '<polygon points="0,-17 13,0 0,17 -13,0"'
      : '<circle r="13"';
    return `<g class="system-node" transform="translate(${text(node.x)} ${text(node.y)})">
      ${node.label ? `<title>${text(node.label)}</title><desc>${text(node.note)}</desc>` : ""}
      ${shape} class="system-node-body" fill="${text(node.color)}"/>
      <text class="system-node-label" x="0" y="${labelY}" text-anchor="${anchor}">${text(node.label)}</text>
    </g>`;
  }).join("\n");
  return `<g data-static-graph style="--graph-label:${text(config.labelColor)};--graph-outline:${text(config.nodeOutline)}">${edges}\n${shapes}</g>`;
}

function assetURL(src) {
  const url = new URL(src, site + "/html/");
  if (!["https:", "http:"].includes(url.protocol)) throw new Error(`Unsupported media URL: ${src}`);
  return url.origin === site ? url.pathname + url.search + url.hash : url.href;
}

function mediaHTML(items = []) {
  return items.map(item => {
    const src = text(assetURL(item.src));
    const media = item.type === "video"
      ? `<video controls playsinline preload="metadata"${item.poster ? ` poster="${text(assetURL(item.poster))}"` : ""}><source src="${src}"${item.mimeType ? ` type="${text(item.mimeType)}"` : ""}></video>`
      : `<img src="${src}" alt="${text(item.alt)}" loading="lazy">`;
    return `<figure>${media}${item.caption ? `<figcaption>${text(item.caption)}</figcaption>` : ""}</figure>`;
  }).join("\n");
}

function metadata(title, description, path, image) {
  const url = site + path;
  return `<meta name="description" content="${text(description)}">
<link rel="canonical" href="${text(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${text(title)}">
<meta property="og:description" content="${text(description)}">
<meta property="og:url" content="${text(url)}">
${image ? `<meta property="og:image" content="${text(new URL(assetURL(image), site).href)}">` : ""}`;
}

function entryPage(entry, kind, path, template, locked = false) {
  const projects = kind === "project";
  const summary = entry.summary || entry.description || "";
  const stack = entry.stack && entry.stack !== "$%^" ? entry.stack : (entry.chips || []).join(" · ");
  const nav = template.match(/<nav>[\s\S]*?<\/nav>/)[0].replace(/href="(?!https?:)([^"]+)"/g, 'href="/html/$1"');
  const footer = template.match(/<footer[\s\S]*?<\/footer>/)[0];
  const fonts = template.match(/<link href="https:\/\/fonts\.googleapis[^>]+>/)[0];
  const paragraph = value => value ? `<p>${text(value)}</p>` : "";
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${text(entry.title)} — Aot Chanthorn</title>
${metadata(entry.title + " — Aot Chanthorn", locked ? "Project details are locked." : summary, path, locked ? undefined : entry.media?.find(item => item.type === "image")?.src)}
${fonts}
<link rel="stylesheet" href="/css/portfolio.css"><link rel="stylesheet" href="/css/content-pages.css">
<noscript><link rel="stylesheet" href="/css/no-script.css"></noscript>
<script src="/js/ga4.js"></script><script src="/js/animation-preferences.js"></script><script src="/js/audio-preferences.js"></script>
</head><body>
${nav}
<main class="page-shell page-main content-page"><article${locked ? ` aria-label="${text(entry.title.trim())} — details locked"` : ""}>
  ${locked ? `<div class="project-lock">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Details locked" focusable="false">
      <rect x="10" y="21" width="28" height="22" rx="4"/>
      <path d="M16 21v-8a8 8 0 0 1 16 0v8"/>
      <circle cx="24" cy="31" r="2"/><path d="M24 33v3"/>
    </svg>
    <label class="project-access-label" for="project-access-code">access code required</label>
    <input class="project-access-input" id="project-access-code" type="text" placeholder="Enter access code" autocomplete="off" autocapitalize="none" spellcheck="false">
  </div>` : `<p class="update-card-meta">${text(projects ? entry.tag : entry.label)}</p>
  <h1 class="page-title">${text(entry.title)}</h1>
  ${projects && entry.lastUpdated ? `<p class="content-date">Last updated: ${dateMarkup(entry.lastUpdated)}</p>` : ""}
  ${projects && types[entry.type] ? `<p class="content-date">${types[entry.type]} project</p>` : ""}
  <div class="content-copy">${projects && entry.function && entry.function !== summary ? paragraph(entry.function) : ""}${paragraph(summary)}${paragraph(entry.details)}</div>
  <div class="content-media">${projects ? "" : memoImage(entry.cardImage)}${mediaHTML(entry.media)}</div>
  ${projects && stack ? `<p class="content-stack">${text(stack)}</p>` : ""}`}
  <div class="page-tail"><a class="clink" href="/html/${projects ? "work.html" : "writing.html#" + text(entry.slug)}">Back to ${projects ? "Projects" : "Memos"}</a></div>
</article></main>
${footer}
<script src="/js/nav.js"></script>
</body></html>`;
}

export function renderContent(root, output, content = loadContent(root)) {
  validateContent(content);
  const { projects, memos, graph, urls, pageSize, sortProjects, isProjectLocked } = content;
  const paths = ["/html/portfolio.html", "/html/about.html", "/html/work.html", "/html/writing.html", "/html/contact.html"];
  const read = name => readFileSync(join(root, "html", name), "utf8");
  const write = (path, html) => {
    mkdirSync(dirname(join(output, path)), { recursive: true });
    writeFileSync(join(output, path), html);
  };
  const prepare = (html, title, description, path) => html.replace("</head>", () =>
    `${metadata(title, description, path)}\n<noscript><link rel="stylesheet" href="/css/no-script.css"></noscript>\n</head>`);
  let home = region(region(read("portfolio.html"), "graph", renderGraph(graph)), "home-memos", memos.filter(memo => memo.pinned).map(homeMemo).join("\n"));
  const names = new Map(graph.nodes.map(node => [node.id, node.label]));
  const graphNotes = `<noscript><details class="system-noscript"><summary>Architecture notes and connections</summary><dl>${graph.nodes.filter(node => node.label)
    .map(node => `<dt>${text(node.label)}</dt><dd>${text(node.note)}</dd>`).join("\n")}</dl><ul>${graph.edges
    .map(edge => `<li>${text(names.get(edge.from))} → ${text(names.get(edge.to))}</li>`).join("\n")}</ul></details></noscript>`;
  home = region(home, "graph-notes", graphNotes);
  write("html/portfolio.html", prepare(home, "Aot Chanthorn", "Aot Chanthorn's projects, memos, and interactive core architecture.", "/html/portfolio.html"));
  const workTemplate = read("work.html");
  const work = region(region(workTemplate, "projects", sortProjects(projects).map(({ project, index }) => renderProjectRow(project, index, urls)).join("\n")),
    "project-count", projects.length + (projects.length === 1 ? " project" : " projects"));
  write("html/work.html", prepare(work, "Projects — Aot Chanthorn", "Projects in robotics, machine learning, simulation, and software by Aot Chanthorn.", "/html/work.html"));
  const memoTemplate = read("writing.html");
  const pageCount = Math.max(1, Math.ceil(memos.length / pageSize));
  for (let page = 0; page < pageCount; page++) {
    let html = region(memoTemplate, "memos", memos.slice(page * pageSize, (page + 1) * pageSize).map(memo => memoCard(memo, urls)).join("\n"));
    html = region(html, "memo-count", "Total Memos: " + memos.length).replace('data-page="0"', `data-page="${page}"`);
    const link = (next, newer) => {
      const disabled = next < 0 || next >= pageCount;
      return `<a class="clink updates-button" href="${urls.memoPage(disabled ? page : next)}" data-updates-${newer ? "newer" : "older"}${disabled ? ' aria-disabled="true" tabindex="-1"' : ` rel="${newer ? "prev" : "next"}"`}>View ${newer ? "Newer" : "Older"}</a>`;
    };
    html = region(html, "memo-pagination", link(page - 1, true) + "\n" + link(page + 1, false));
    const path = "/html/" + urls.memoPage(page);
    if (page) paths.push(path);
    const title = "Thoughts — Aot Chanthorn" + (page ? ` — Page ${page + 1}` : "");
    html = html.replace("<title>Memos</title>", `<title>${title}</title>`);
    write(path, prepare(html, title, "Thoughts, milestones, and project updates from Aot Chanthorn.", path));
  }
  for (const [kind, entries, template] of [["project", projects, workTemplate], ["memo", memos, memoTemplate]]) {
    for (const entry of entries) {
      const path = "/html/" + urls[kind](entry);
      paths.push(path);
      write(path, entryPage(entry, kind, path, template, kind === "project" && isProjectLocked(entry)));
    }
  }
  for (const page of ["about.html", "contact.html"]) {
    write("html/" + page, read(page).replace("</head>", '<noscript><link rel="stylesheet" href="/css/no-script.css"></noscript>\n</head>'));
  }
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `<url><loc>${text(site + path)}</loc></url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
  return { projects: projects.length, memos: memos.length, pages: paths.length };
}
