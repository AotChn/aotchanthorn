import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../js/vercel-speed-insights.js", import.meta.url), "utf8");
function page(hostname) {
  const scripts = [];
  const window = { location: { hostname } };
  const document = {
    querySelector: () => scripts.find(script => script.src === "/_vercel/speed-insights/script.js"),
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) }
  };
  return { window, scripts, load: () => runInNewContext(source, { window, document }) };
}

test("production pages load Speed Insights once and preserve queued calls", () => {
  for (const host of ["aotchn.com", "www.aotchn.com"]) {
    const context = page(host);
    context.load();
    context.window.si("beforeSend", "queued-example");
    context.load();
    assert.equal(context.scripts.length, 1);
    assert.equal(context.scripts[0].src, "/_vercel/speed-insights/script.js");
    assert.equal(context.scripts[0].defer, true);
    assert.equal(context.window.siq.length, 1);
    assert.equal(context.window.siq[0][1], "queued-example");
  }
});

test("local and deployment previews do not send Speed Insights", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]", "192.168.1.5", "", "example-preview.vercel.app"]) {
    const context = page(host);
    context.load();
    assert.equal(context.scripts.length, 0, host);
    assert.equal(context.window.si, undefined, host);
  }
});
