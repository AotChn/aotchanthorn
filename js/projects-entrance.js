(function () {
  "use strict";

  const page = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Set before first paint, including when Work arrives through a page wave.
  if (!reducedMotion.matches) page.classList.add("projects-entering");
  const bootstrapFallback = setTimeout(() => page.classList.remove("projects-entering"), 8000);

  window.createProjectsEntrance = function (root, history) {
    clearTimeout(bootstrapFallback);
    const graph = history.querySelector("[data-project-history-graph]");
    const settings = window.AOT_SYSTEM_GRAPH?.entrance || {};
    const setting = (key, fallback, minimum = 0, maximum = 6000) => Number.isFinite(settings[key])
      ? Math.max(minimum, Math.min(maximum, settings[key])) : fallback;
    const blankDuration = setting("blankDuration", 180);
    const nodeDuration = setting("nodeDropDuration", 620, 100);
    const nodeStagger = setting("nodeStagger", 35, 0, 200);
    const dropDistance = setting("dropDistance", 160, 0, 1000);
    const lineDuration = setting("edgeBuildDuration", 900, 100);
    const lineStagger = setting("edgeStagger", 20, 0, 200);
    const revealDuration = setting("titleFadeDuration", 1800, 100);
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => value * value * (3 - 2 * value);
    let nodes = [], lines = [];
    let active = false, originalInert = false;
    let elapsed = 0, lastTime = null, frame = null, watchdog = null;

    function stopClock() {
      cancelAnimationFrame(frame);
      clearTimeout(watchdog);
      frame = watchdog = lastTime = null;
    }

    function finish() {
      const wasActive = active;
      active = false;
      stopClock();
      nodes.forEach(({ element, x, y }) => {
        element.setAttribute("transform", `translate(${x} ${y})`);
        element.style.removeProperty("opacity");
      });
      lines.forEach(line => {
        line.style.removeProperty("opacity");
        line.removeAttribute("pathLength");
        line.removeAttribute("stroke-dasharray");
        line.removeAttribute("stroke-dashoffset");
      });
      page.classList.remove("projects-entering", "projects-revealing");
      page.style.removeProperty("--projects-reveal");
      if (wasActive) {
        root.inert = originalInert;
        root.removeAttribute("aria-busy");
      }
    }

    function timing() {
      const linesStart = blankDuration + Math.max(0, nodes.length - 1) * nodeStagger + nodeDuration;
      return { linesStart, end: linesStart + Math.max(revealDuration, Math.max(0, lines.length - 1) * lineStagger + lineDuration) };
    }

    function paint() {
      const { linesStart, end } = timing();
      nodes.forEach(({ element, x, y }, index) => {
        const progress = clamp((elapsed - blankDuration - index * nodeStagger) / nodeDuration);
        const drop = 1 + 2.3 * (progress - 1) ** 3 + 1.3 * (progress - 1) ** 2;
        element.setAttribute("transform", `translate(${x} ${y - dropDistance * (1 - drop)})`);
        element.style.opacity = String(clamp(progress * 5));
      });
      lines.forEach((line, index) => {
        const progress = clamp((elapsed - linesStart - index * lineStagger) / lineDuration);
        line.setAttribute("pathLength", "1000");
        line.setAttribute("stroke-dasharray", "1000");
        line.setAttribute("stroke-dashoffset", String(1000 * (1 - ease(progress))));
        line.style.opacity = progress > 0 ? "1" : "0";
      });
      if (elapsed >= linesStart) {
        page.classList.add("projects-revealing");
        page.style.setProperty("--projects-reveal", String(ease(clamp((elapsed - linesStart) / revealDuration))));
      }
      if (elapsed >= end) finish();
    }

    function refresh() {
      // Graph redraws on font loading, resizing, and filtering. Use fresh geometry
      // without restarting an in-progress entrance or leaving new paths exposed.
      nodes = [...graph.querySelectorAll(".project-history-node")].map(element => ({
        element, x: Number(element.getAttribute("data-node-x")), y: Number(element.getAttribute("data-node-y"))
      }));
      lines = [...graph.querySelectorAll("path")];
      if (active) {
        if (!nodes.length) finish();
        else paint();
      }
    }

    function tick(now) {
      frame = null;
      if (!active || document.hidden) return;
      if (lastTime !== null) elapsed += Math.min(100, now - lastTime);
      lastTime = now;
      paint();
      if (active) frame = requestAnimationFrame(tick);
    }

    function start() {
      finish();
      refresh();
      if (settings.enabled === false || reducedMotion.matches || !nodes.length) return;
      active = true;
      elapsed = 0;
      originalInert = root.inert;
      root.inert = true;
      root.setAttribute("aria-busy", "true");
      page.classList.add("projects-entering");
      paint();
      watchdog = setTimeout(finish, timing().end + 2500);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    function visibilityChanged() {
      history.classList.toggle("project-glow-paused", document.hidden);
      if (!active) return;
      cancelAnimationFrame(frame);
      frame = lastTime = null;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    document.addEventListener("visibilitychange", visibilityChanged);
    reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) finish(); });
    window.addEventListener("pagehide", finish);
    window.addEventListener("pageshow", event => {
      if (!event.persisted) return;
      // Let the outgoing transition restore its inert state before replaying.
      if (settings.enabled !== false && !reducedMotion.matches) page.classList.add("projects-entering");
      frame = requestAnimationFrame(start);
    });
    visibilityChanged();
    start();
    return { finish, refresh };
  };
})();
