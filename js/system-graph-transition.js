(function () {
  "use strict";

  const handoffKey = "aot:page-wave";
  const svgNS = "http://www.w3.org/2000/svg";
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);

  function svgElement(tag, attributes) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function route(points) {
    const distances = [0];
    points.slice(1).forEach((point, index) => {
      distances.push(distances[index] + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
    });
    return { points, distances, length: distances[distances.length - 1] };
  }

  function pointAt(path, distance) {
    for (let i = 1; i < path.points.length; i++) {
      const span = path.distances[i] - path.distances[i - 1];
      if (span > 0 && distance <= path.distances[i]) {
        const t = clamp((distance - path.distances[i - 1]) / span);
        return path.points[i - 1].map((value, axis) => value + (path.points[i][axis] - value) * t);
      }
    }
    return path.points[path.points.length - 1];
  }

  function pathBetween(path, start, end) {
    const points = [pointAt(path, start)];
    path.points.forEach((point, index) => {
      if (path.distances[index] > start && path.distances[index] < end) points.push(point);
    });
    points.push(pointAt(path, end));
    return points.map((point, index) => (index ? "L" : "M") + point.map(value => value.toFixed(2)).join(" ")).join(" ");
  }

  // Prefer directed routes. Nodes with no directed route can retrace existing
  // connections toward the selected destination; feedback loops stay bounded.
  function collapseRoutes(config, sink) {
    const nodes = new Map(config.nodes.map(node => [node.id, node]));
    const edges = config.edges.map(edge => {
      const source = nodes.get(edge.from), target = nodes.get(edge.to);
      return { ...edge, path: route([[source.x, source.y], ...edge.via, [target.x, target.y]]) };
    });
    function findRoutes(connections) {
      const remaining = new Set(nodes.keys());
      const distance = new Map(config.nodes.map(node => [node.id, node.id === sink.id ? 0 : Infinity]));
      const next = new Map();
      while (remaining.size) {
        const closest = [...remaining].reduce((best, id) => best === null || distance.get(id) < distance.get(best) ? id : best, null);
        if (!Number.isFinite(distance.get(closest))) break;
        remaining.delete(closest);
        connections.forEach(edge => {
          if (edge.to !== closest || !remaining.has(edge.from)) return;
          const candidate = distance.get(closest) + Math.max(0.001, edge.path.length);
          if (candidate < distance.get(edge.from)) {
            distance.set(edge.from, candidate);
            next.set(edge.from, edge);
          }
        });
      }
      return next;
    }
    const directed = findRoutes(edges);
    const reversible = findRoutes(edges.flatMap(edge => [edge, {
      from: edge.to, to: edge.from, path: route([...edge.path.points].reverse())
    }]));
    const paths = new Map(config.nodes.map(node => {
      const next = directed.has(node.id) ? directed : reversible;
      const points = [[node.x, node.y]];
      let id = node.id;
      while (id !== sink.id && next.has(id)) {
        const edge = next.get(id);
        points.push(...edge.path.points.slice(1));
        id = edge.to;
      }
      // Future disconnected nodes still collapse instead of blocking navigation.
      if (id !== sink.id) points.push([sink.x, sink.y]);
      return [node.id, route(points)];
    }));
    edges.forEach(edge => {
      edge.collapsePath = route([...edge.path.points, ...paths.get(edge.to).points.slice(1)]);
    });
    return { paths, edges };
  }

  window.createSystemGraphTransition = function (root, config, callbacks) {
    const svg = root.querySelector("[data-graph-svg]");
    const settings = config.pageTransition || {};
    if (!svg || settings.enabled === false) return;
    const destinations = (settings.destinations || []).map(page => ({
      ...page, url: new URL(page.href, document.baseURI),
      sink: config.nodes.find(node => node.id === page.node)
    })).filter(page => page.sink);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const duration = (value, fallback) => Number.isFinite(value) ? Math.max(100, Math.min(6000, value)) : fallback;
    const collapseDuration = duration(settings.collapseDuration, 1800);
    const settleDuration = duration(settings.settleDuration, 180);
    const waveDuration = duration(settings.waveDuration, 900);
    const waveColor = settings.waveColor || "#c8b89a";
    const waveFillColor = settings.waveFillColor || "#181713";
    const sound = window.createSystemGraphTransitionSound?.(settings);
    let active = false, navigating = false;
    let frame = null, watchdog = null, overlay = null, destination = null;
    let originalInert = false;

    function stopClock() {
      cancelAnimationFrame(frame);
      clearTimeout(watchdog);
      frame = watchdog = null;
    }

    function navigate() {
      if (navigating || !destination) return;
      navigating = true;
      stopClock();
      sound?.stop();
      window.location.assign(destination.href);
    }

    function restore() {
      if (!active) return;
      stopClock();
      sound?.stop();
      overlay?.remove();
      overlay = null;
      root.inert = originalInert;
      root.removeAttribute("aria-busy");
      document.body.classList.remove("system-transitioning");
      active = navigating = false;
      callbacks.onRestore();
    }

    function start(url, page) {
      // Freeze the outgoing layout so a phone rotation cannot move its sink
      // halfway through the collapse while the underlying graph reflows.
      const sink = { ...page.sink };
      const initial = svg.getScreenCTM();
      const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = svg.viewBox.baseVal;
      const viewBox = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
      if (!initial) { window.location.assign(url.href); return; }
      const geometry = collapseRoutes(config, sink);
      active = true;
      destination = url;
      callbacks.onStart();
      originalInert = root.inert;
      root.inert = true;
      root.setAttribute("aria-busy", "true");
      document.body.classList.add("system-transitioning");
      overlay = document.createElement("div");
      overlay.className = "system-collapse-overlay";
      overlay.style.setProperty("--collapse-background", config.background);
      overlay.style.setProperty("--collapse-wave", waveColor);
      overlay.setAttribute("role", "status");
      overlay.setAttribute("aria-label", "Opening " + page.label);
      const scene = svgElement("svg", { class: "system-collapse-scene", "aria-hidden": "true" });
      const group = svgElement("g", {});
      const edgeGroup = svgElement("g", {});
      const nodeGroup = svgElement("g", {});
      group.append(edgeGroup, nodeGroup);
      scene.append(group);
      overlay.append(scene);
      document.body.append(overlay);

      const edgeViews = geometry.edges.map(edge => {
        const line = svgElement("path", { class: "system-collapse-edge", stroke: edge.color });
        const flow = svgElement("path", {
          class: "system-collapse-flow", stroke: edge.activeColor || config.nodes.find(node => node.id === edge.from).outputColor
        });
        edgeGroup.append(line, flow);
        return { edge, line, flow };
      });
      const nodeViews = config.nodes.filter(node => node.id !== sink.id).map(node => {
        const circle = svgElement("circle", { r: "13", fill: node.color, stroke: config.nodeOutline, "stroke-width": "1.4" });
        nodeGroup.append(circle);
        return { circle, path: geometry.paths.get(node.id) };
      });
      const core = svgElement("circle", { class: "system-collapse-core", cx: sink.x, cy: sink.y, r: "13", fill: sink.color });
      const ring = svgElement("circle", { class: "system-collapse-ring", cx: sink.x, cy: sink.y, r: "17", opacity: "0" });
      group.append(ring, core);
      const focusDuration = 320;
      const collapseEnd = focusDuration + collapseDuration;
      const handoffAt = collapseEnd + settleDuration;
      let started = null, handoffAttempted = false;
      let releaseAt = null, releaseDuration = 0;
      sound?.start(handoffAt);

      function render(now) {
        if (started === null) started = now;
        const elapsed = now - started;
        const width = window.innerWidth, height = window.innerHeight;
        const padding = Math.min(48, width * 0.05);
        const scale = Math.min((width - padding * 2) / viewBox.width, (height - padding * 2) / viewBox.height);
        const x = (width - viewBox.width * scale) / 2 - viewBox.x * scale;
        const y = (height - viewBox.height * scale) / 2 - viewBox.y * scale;
        const focus = ease(clamp(elapsed / focusDuration));
        const mix = (from, to) => from + (to - from) * focus;
        scene.setAttribute("viewBox", `0 0 ${width} ${height}`);
        group.setAttribute("transform", `matrix(${mix(initial.a, scale)} ${mix(initial.b, 0)} ${mix(initial.c, 0)} ${mix(initial.d, scale)} ${mix(initial.e, x)} ${mix(initial.f, y)})`);
        const progress = ease(clamp((elapsed - focusDuration) / collapseDuration));
        edgeViews.forEach(({ edge, line, flow }) => {
          const path = edge.collapsePath;
          const d = pathBetween(path, path.length * progress, edge.path.length + (path.length - edge.path.length) * progress);
          line.setAttribute("d", d);
          flow.setAttribute("d", d);
          line.setAttribute("opacity", String(1 - progress));
          flow.setAttribute("opacity", String(Math.min(1, (1 - progress) * 8)));
          flow.setAttribute("stroke-dashoffset", String(-elapsed * 0.45));
        });
        nodeViews.forEach(({ circle, path }) => {
          const point = pointAt(path, path.length * progress);
          circle.setAttribute("cx", point[0]);
          circle.setAttribute("cy", point[1]);
          circle.setAttribute("r", String(13 - 8 * progress));
          circle.setAttribute("opacity", String(Math.min(1, (1 - progress) * 12)));
        });
        const charge = clamp((elapsed - collapseEnd) / settleDuration);
        core.setAttribute("r", String(13 + 10 * progress + 4 * Math.sin(charge * Math.PI)));
        ring.setAttribute("r", String(18 + progress * 13 + charge * 18));
        ring.setAttribute("opacity", String(progress * 0.7));

        if (elapsed >= handoffAt) {
          if (releaseAt === null) {
            releaseAt = elapsed;
            releaseDuration = sound?.pop() || 0;
          }
          if (elapsed - releaseAt < releaseDuration) {
            // The destination node begins emitting its wave while the pop sounds.
            const release = clamp((elapsed - releaseAt) / releaseDuration);
            ring.setAttribute("r", String(49 + release * 28));
            ring.setAttribute("opacity", String(0.7 - release * 0.15));
            frame = requestAnimationFrame(step);
            return;
          }
          const center = [x + sink.x * scale, y + sink.y * scale];
          if (!handoffAttempted) {
            handoffAttempted = true;
            try {
              sessionStorage.setItem(handoffKey, JSON.stringify({
                path: url.pathname, at: Date.now(), x: center[0] / width, y: center[1] / height,
                duration: waveDuration, color: waveColor, fillColor: waveFillColor
              }));
              navigate();
              return;
            } catch { /* With storage blocked, draw the outgoing wave here. */ }
          }
          const wave = ease(clamp((elapsed - releaseAt - releaseDuration) / waveDuration));
          const radius = Math.hypot(Math.max(center[0], width - center[0]), Math.max(center[1], height - center[1]));
          ring.setAttribute("r", String(49 + wave * radius / scale));
          ring.style.fill = waveFillColor;
          ring.setAttribute("opacity", String(1 - wave * 0.6));
          core.setAttribute("opacity", String(1 - wave));
          if (wave >= 1) { navigate(); return; }
        }
        frame = requestAnimationFrame(step);
      }

      function step(now) {
        try { render(now); } catch { navigate(); }
      }
      // Background tabs and interrupted animations must never trap navigation.
      watchdog = setTimeout(navigate, handoffAt + waveDuration + 1500);
      step(performance.now());
    }

    document.addEventListener("click", event => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      if (active) { event.preventDefault(); return; }
      const url = new URL(link.href, document.baseURI);
      const page = destinations.find(page => page.url.origin === url.origin && page.url.pathname === url.pathname);
      if (!page || reducedMotion.matches) return;
      event.preventDefault();
      try { start(url, page); } catch { sound?.stop(); window.location.assign(url.href); }
    });
    document.addEventListener("visibilitychange", () => {
      if (active && document.hidden) navigate();
    });
    reducedMotion.addEventListener("change", () => {
      if (active && reducedMotion.matches) navigate();
    });
    window.addEventListener("pagehide", stopClock);
    window.addEventListener("pageshow", restore);
  };
})();
