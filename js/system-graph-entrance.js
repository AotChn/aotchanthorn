(function () {
  "use strict";

  const page = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Run in the head so the complete graph/title never flash before the intro.
  if (!reducedMotion.matches && window.AOT_ANIMATIONS?.enabled !== false) page.classList.add("system-entering");
  const bootstrapFallback = setTimeout(() => page.classList.remove("system-entering"), 8000);

  window.createSystemGraphEntrance = function (root, config, callbacks) {
    clearTimeout(bootstrapFallback);
    const settings = config.entrance || {};
    const title = root.querySelector("[data-entrance-title]");
    if (!title || settings.enabled === false) {
      page.classList.remove("system-entering");
      return { finish() {} };
    }
    const setting = (name, fallback, min = 0, max = 6000) => Number.isFinite(settings[name])
      ? Math.max(min, Math.min(max, settings[name])) : fallback;
    const blankDuration = setting("blankDuration", 180);
    const dropDuration = setting("nodeDropDuration", 620, 100);
    const nodeStagger = setting("nodeStagger", 35, 0, 200);
    const dropDistance = setting("dropDistance", 160, 0, 1000);
    const edgeDuration = setting("edgeBuildDuration", 900, 100);
    const edgeStagger = setting("edgeStagger", 20, 0, 200);
    const titleFadeDuration = setting("titleFadeDuration", 1800, 100);
    const nodes = [...config.nodes].sort((a, b) => a.y - b.y || a.x - b.x).map(node => ({
      node, group: root.querySelector('[data-node-id="' + node.id + '"]')
    })).filter(node => node.group);
    const order = new Map(nodes.map(({ node }, index) => [node.id, index]));
    const edges = [...root.querySelectorAll(".system-edge")].sort((a, b) =>
      order.get(a.getAttribute("data-from")) - order.get(b.getAttribute("data-from"))
    ).map(group => ({ group, path: group.querySelector(".system-edge-idle") }));
    const edgesStart = blankDuration + Math.max(0, nodes.length - 1) * nodeStagger + dropDuration;
    const titleStart = edgesStart;
    const entranceEnd = edgesStart + Math.max(
      Math.max(0, edges.length - 1) * edgeStagger + edgeDuration, titleFadeDuration
    );
    const clamp = value => Math.max(0, Math.min(1, value));
    let active = false, originalInert = false;
    let frame = null, watchdog = null, lastTime = null, elapsed = 0;

    function stopClock() {
      cancelAnimationFrame(frame);
      clearTimeout(watchdog);
      frame = watchdog = lastTime = null;
    }

    function finish() {
      const wasActive = active;
      active = false;
      stopClock();
      title.style.removeProperty("opacity");
      nodes.forEach(({ node, group }) => {
        group.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
        group.style.removeProperty("opacity");
      });
      edges.forEach(({ group, path }) => {
        group.style.removeProperty("opacity");
        path.removeAttribute("pathLength");
        path.removeAttribute("stroke-dasharray");
        path.removeAttribute("stroke-dashoffset");
      });
      page.classList.remove("system-entering");
      root.classList.remove("is-title-revealing");
      if (wasActive) {
        root.inert = originalInert;
        root.removeAttribute("aria-busy");
        callbacks.onFinish();
      }
    }

    function tick(now) {
      frame = null;
      if (!active || document.hidden) return;
      if (lastTime !== null) elapsed += Math.min(100, now - lastTime);
      lastTime = now;
      nodes.forEach(({ node, group }, index) => {
        const t = clamp((elapsed - blankDuration - index * nodeStagger) / dropDuration);
        // A small overshoot gives the drops weight without moving their endpoints.
        const drop = 1 + 2.3 * Math.pow(t - 1, 3) + 1.3 * Math.pow(t - 1, 2);
        group.setAttribute("transform", "translate(" + node.x + " " + (node.y - dropDistance * (1 - drop)) + ")");
        group.style.opacity = String(clamp(t * 5));
      });
      edges.forEach(({ group, path }, index) => {
        const t = clamp((elapsed - edgesStart - index * edgeStagger) / edgeDuration);
        group.style.opacity = t > 0 ? "1" : "0";
        // Paths are ordered source → destination, including every configured bend.
        path.setAttribute("stroke-dashoffset", String(1000 * (1 - t * t * (3 - 2 * t))));
      });
      if (elapsed >= titleStart) {
        root.classList.add("is-title-revealing");
        const t = clamp((elapsed - titleStart) / titleFadeDuration);
        title.style.opacity = String(t * t * (3 - 2 * t));
        if (elapsed >= entranceEnd) { finish(); return; }
      }
      frame = requestAnimationFrame(tick);
    }

    function start() {
      finish();
      if (reducedMotion.matches || window.AOT_ANIMATIONS?.enabled === false) return;
      active = true;
      elapsed = 0;
      originalInert = root.inert;
      callbacks.onStart();
      root.inert = true;
      root.setAttribute("aria-busy", "true");
      page.classList.add("system-entering");
      title.style.opacity = "0";
      nodes.forEach(node => { node.group.style.opacity = "0"; });
      edges.forEach(({ group, path }) => {
        group.style.opacity = "0";
        path.setAttribute("pathLength", "1000");
        path.setAttribute("stroke-dasharray", "1000");
        path.setAttribute("stroke-dashoffset", "1000");
      });
      watchdog = setTimeout(finish, entranceEnd + 2500);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    document.addEventListener("visibilitychange", () => {
      if (!active) return;
      cancelAnimationFrame(frame);
      frame = lastTime = null;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    });
    reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) finish(); });
    window.AOT_ANIMATIONS?.subscribe(enabled => { if (!enabled) finish(); });
    window.addEventListener("pagehide", finish);
    window.addEventListener("pageshow", event => {
      if (!event.persisted) return;
      // A microtask can run between pageshow listeners. Wait until the next
      // frame so collapse cleanup has restored inert before we save its value.
      if (!reducedMotion.matches && window.AOT_ANIMATIONS?.enabled !== false) page.classList.add("system-entering");
      frame = requestAnimationFrame(start);
    });
    start();
    return { finish };
  };
})();
