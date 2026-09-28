(function () {
  "use strict";

  const history = document.querySelector("[data-project-history]");
  const graph = document.querySelector("[data-project-history-graph]");
  const settings = window.AOT_SYSTEM_GRAPH?.pageTransition || {};
  if (!history || !graph || settings.enabled === false) return;

  // Work-only timing, in milliseconds. Wave colors, volume, and sound settings
  // use pageTransition in system-graph-config.js, just like the home graph.
  const textDuration = 900;
  const rowStagger = 35;
  const leadDuration = 760;
  const followerDuration = 980;
  const followerDelay = 180;
  const followerStagger = 65;
  const duration = (value, fallback) => Number.isFinite(value) ? Math.max(100, Math.min(6000, value)) : fallback;
  const settleDuration = duration(settings.settleDuration, 180);
  const waveDuration = duration(settings.waveDuration, 900);
  const waveColor = settings.waveColor || "#c8b89a";
  const waveFill = settings.waveFillColor || "#181713";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sound = window.createSystemGraphTransitionSound?.(settings);
  const destinations = [
    ["portfolio.html", "Home"], ["about.html", "About"],
    ["writing.html", "Memos"], ["contact.html", "Contact"]
  ].map(([href, label]) => ({ url: new URL(href, document.baseURI), label }));
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  function curvePoint(start, first, second, end, progress) {
    const remaining = 1 - progress;
    const coordinate = axis => remaining ** 3 * start[axis]
      + 3 * remaining ** 2 * progress * first[axis]
      + 3 * remaining * progress ** 2 * second[axis] + progress ** 3 * end[axis];
    return { x: coordinate("x"), y: coordinate("y") };
  }
  const svgNS = "http://www.w3.org/2000/svg";
  let destination = null, navigating = false, overlay = null;
  let frame = null, watchdog = null, inertStates = [];
  let playingMedia = [];

  function svgElement(tag, attributes) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function stop() {
    cancelAnimationFrame(frame);
    clearTimeout(watchdog);
    frame = watchdog = null;
    sound?.stop();
  }

  function restore() {
    if (!destination) return;
    stop();
    overlay?.remove();
    overlay = null;
    document.body.classList.remove("work-transitioning");
    history.removeAttribute("aria-busy");
    inertStates.forEach(([element, value]) => { element.inert = value; });
    inertStates = [];
    playingMedia.forEach(media => { media.play()?.catch(() => {}); });
    playingMedia = [];
    destination = null;
    navigating = false;
  }

  function navigate() {
    if (!destination || navigating) return;
    navigating = true;
    stop();
    try { window.location.assign(destination.href); }
    catch { restore(); }
  }

  function start(url, label) {
    history.projectEntrance?.finish();
    destination = url;
    const width = window.innerWidth, height = window.innerHeight;
    const sink = { x: width * .5, y: height * .48 };
    const rows = [...history.querySelectorAll(".project-row")];
    const dots = [...graph.querySelectorAll(".project-history-dot")];
    const nodes = rows.map((row, index) => {
      const dot = dots[index];
      if (!dot) return null;
      const bounds = dot.getBoundingClientRect();
      const style = getComputedStyle(dot);
      return { row, x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2,
        radius: Math.max(2, bounds.width / 2), color: style.stroke, fill: style.fill,
        strokeWidth: style.strokeWidth, glow: style.filter };
    }).filter(Boolean);
    // With an empty filter there is no real node to lead the transition.
    if (!nodes.length) { navigate(); return; }
    const lead = nodes[0];
    nodes.forEach((node, index) => {
      node.delay = index ? followerDelay + Math.min(index - 1, 8) * followerStagger : 0;
      node.duration = index ? followerDuration : leadDuration;
      node.first = index
        ? { x: Math.max(12, node.x - width * .12), y: node.y - Math.max(height * .12, (node.y - sink.y) * .35) }
        : { x: lead.x + (sink.x - lead.x) * .4, y: Math.min(lead.y, sink.y) - height * .18 };
      // Every follower sweeps upward, then bends into the original leading dot.
      node.second = { x: sink.x - width * .14, y: sink.y - height * .2 };
    });

    overlay = document.createElement("div");
    overlay.className = "project-collapse-overlay";
    overlay.style.setProperty("--collapse-wave", waveColor);
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-label", "Opening " + label);
    const scene = svgElement("svg", { class: "project-collapse-scene", viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none", "aria-hidden": "true" });
    const lines = svgElement("g", {});
    const lineSnapshot = svgElement("g", {});
    const matrix = graph.getScreenCTM();
    if (matrix) {
      lineSnapshot.setAttribute("transform", `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`);
      graph.querySelectorAll("path").forEach(path => {
        const style = getComputedStyle(path);
        lineSnapshot.append(svgElement("path", { d: path.getAttribute("d"), fill: "none",
          stroke: style.stroke, "stroke-width": style.strokeWidth, opacity: style.opacity, "stroke-linecap": "round" }));
      });
    }
    lines.append(lineSnapshot);
    scene.append(lines);
    const textLayer = document.createElement("div");
    textLayer.className = "project-collapse-text-layer";
    textLayer.style.width = width + "px";
    textLayer.style.height = height + "px";
    textLayer.setAttribute("aria-hidden", "true");
    const textViews = [];
    const textProperties = ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing",
      "text-transform", "text-align", "white-space", "overflow-wrap", "color", "padding-top", "padding-right", "padding-bottom", "padding-left"];
    nodes.forEach((node, index) => {
      node.row.querySelectorAll(".project-title-button, .project-function-copy, .project-type-badge, .project-unset, .project-updated, .project-mobile-label").forEach(element => {
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const style = getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") return;
        const copy = document.createElement("div");
        copy.className = "project-collapse-text";
        copy.textContent = element.textContent;
        textProperties.forEach(property => copy.style.setProperty(property, style.getPropertyValue(property)));
        Object.assign(copy.style, { left: bounds.left + "px", top: bounds.top + "px", width: bounds.width + "px", height: bounds.height + "px" });
        textLayer.append(copy);
        textViews.push({ element: copy, delay: Math.min(index, 8) * rowStagger,
          dx: node.x - bounds.left - bounds.width / 2, dy: node.y - bounds.top - bounds.height / 2 });
      });
      node.circle = svgElement("circle", { cx: node.x, cy: node.y, r: node.radius, fill: node.fill, stroke: node.color, "stroke-width": node.strokeWidth });
      node.circle.style.filter = node.glow;
      node.center = svgElement("circle", { cx: node.x, cy: node.y, r: "1.3", fill: "#eeeeee", "fill-opacity": ".7" });
      scene.append(node.circle, node.center);
    });
    // Keep the first row's actual dot visible throughout; it becomes the core.
    const core = lead.circle;
    core.setAttribute("class", "project-collapse-core");
    const ring = svgElement("circle", { class: "project-collapse-ring", cx: lead.x, cy: lead.y, r: "18", opacity: "0" });
    scene.append(ring, core, lead.center);
    overlay.append(scene, textLayer);

    // Snapshot before hiding the original rows. Off-screen rows participate too;
    // the fixed overlay clips them until their dots converge into view.
    inertStates = [...document.body.children].map(element => [element, element.inert]);
    inertStates.forEach(([element]) => { element.inert = true; });
    playingMedia = [...document.querySelectorAll("video, audio")].filter(media => !media.paused && !media.ended);
    playingMedia.forEach(media => media.pause());
    document.documentElement.classList.remove("page-wave-reveal");
    document.body.classList.add("work-transitioning");
    history.setAttribute("aria-busy", "true");
    document.body.append(overlay);

    const textEnd = textDuration + Math.min(nodes.length - 1, 8) * rowStagger;
    const convergence = Math.max(...nodes.map(node => node.delay + node.duration));
    const collapseEnd = textEnd + convergence;
    const handoffAt = collapseEnd + settleDuration;
    const started = performance.now();
    let releaseAt = null, releaseDuration = 0, handoffAttempted = false;
    sound?.start(handoffAt);

    function render(now) {
      const elapsed = now - started;
      // Keep the snapshot coherent even if a phone rotates mid-animation.
      textLayer.style.transform = `scale(${window.innerWidth / width},${window.innerHeight / height})`;
      textViews.forEach(view => {
        const progress = ease(clamp((elapsed - view.delay) / textDuration));
        view.element.style.transform = `translate(${view.dx * progress}px,${view.dy * progress}px) scale(${1 - progress})`;
        view.element.style.opacity = String(1 - clamp((progress - .65) / .35));
      });
      const departure = elapsed - textEnd;
      lines.setAttribute("opacity", String(1 - ease(clamp(departure / leadDuration))));
      let absorbed = 0;
      let leadPosition = lead;
      nodes.forEach((node, index) => {
        const progress = ease(clamp((departure - node.delay) / node.duration));
        const { x, y } = curvePoint(node, node.first, node.second, sink, progress);
        if (index === 0) leadPosition = { x, y };
        else absorbed += clamp((progress - .9) / .1);
        const absorb = clamp((elapsed - Math.min(index, 8) * rowStagger) / textDuration);
        const pulse = elapsed < textEnd ? Math.sin(absorb * Math.PI) * 2 : 0;
        [node.circle, node.center].forEach(shape => {
          shape.setAttribute("cx", x);
          shape.setAttribute("cy", y);
          // Followers disappear only after reaching the leading dot, never en route.
          shape.setAttribute("opacity", index && progress === 1 ? "0" : "1");
        });
        node.circle.setAttribute("r", String(node.radius + pulse));
      });
      const charge = clamp((elapsed - collapseEnd) / settleDuration);
      const merged = nodes.length > 1 ? absorbed / (nodes.length - 1) : clamp(departure / leadDuration);
      const intakePulse = elapsed < textEnd ? Math.sin(clamp(elapsed / textDuration) * Math.PI) * 2 : 0;
      core.setAttribute("r", String(lead.radius + intakePulse + 7 * merged + 3 * Math.sin(charge * Math.PI)));
      core.style.filter = `drop-shadow(0 0 ${4 + merged * 10}px ${lead.color})`;
      lead.center.setAttribute("r", String(1.3 + merged * 2.5));
      ring.setAttribute("cx", leadPosition.x);
      ring.setAttribute("cy", leadPosition.y);
      ring.setAttribute("r", String(18 + charge * 18));
      ring.setAttribute("opacity", String(charge * .7));

      if (elapsed >= handoffAt) {
        if (releaseAt === null) { releaseAt = elapsed; releaseDuration = sound?.pop() || 0; }
        const release = clamp((elapsed - releaseAt) / Math.max(1, releaseDuration));
        ring.setAttribute("r", String(36 + release * 28));
        if (elapsed - releaseAt >= releaseDuration) {
          if (!handoffAttempted) {
            handoffAttempted = true;
            try {
              sessionStorage.setItem("aot:page-wave", JSON.stringify({ path: url.pathname, at: Date.now(),
                x: sink.x / width, y: sink.y / height, duration: waveDuration, color: waveColor, fillColor: waveFill }));
              navigate();
              return;
            } catch { /* If storage is blocked, finish the wave on this page. */ }
          }
          const wave = ease(clamp((elapsed - releaseAt - releaseDuration) / waveDuration));
          const radius = Math.hypot(Math.max(sink.x, width - sink.x), Math.max(sink.y, height - sink.y));
          ring.setAttribute("r", String(64 + wave * radius));
          ring.style.fill = waveFill;
          ring.setAttribute("opacity", String(1 - wave * .6));
          core.setAttribute("opacity", String(1 - wave));
          lead.center.setAttribute("opacity", String(1 - wave));
          if (wave >= 1) { navigate(); return; }
        }
      }
      frame = requestAnimationFrame(step);
    }
    function step(now) {
      try { render(now); } catch { navigate(); }
    }
    watchdog = setTimeout(navigate, handoffAt + waveDuration + 1500);
    step(started);
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    if (destination) { event.preventDefault(); return; }
    const url = new URL(link.href, document.baseURI);
    const page = destinations.find(page => page.url.origin === url.origin && page.url.pathname === url.pathname);
    if (!page || reducedMotion.matches) return;
    event.preventDefault();
    try { start(url, page.label); }
    catch { destination = url; navigate(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) navigate(); });
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) navigate(); });
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", restore);
})();
