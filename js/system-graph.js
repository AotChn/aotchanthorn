(function () {
  "use strict";

  const root = document.querySelector("[data-system-graph]");
  if (!root || !window.AOT_SYSTEM_GRAPH) return;

  const sourceConfig = window.AOT_SYSTEM_GRAPH;
  // Keep owner coordinates untouched; portrait uses the same routes transposed.
  const config = {
    ...sourceConfig,
    nodes: sourceConfig.nodes.map(node => ({ ...node })),
    edges: sourceConfig.edges.map(edge => ({ ...edge }))
  };
  const portrait = window.matchMedia("(max-width: 640px) and (orientation: portrait)");
  const touchInput = window.matchMedia("(pointer: coarse)");
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = root.querySelector("[data-graph-svg]");
  const canvas = root.querySelector("[data-graph-canvas]");
  const tooltip = root.querySelector("[data-graph-tooltip]");
  const hitSound = window.createSystemGraphHitSound?.(root, config);
  const note = window.createSystemGraphNotes?.(root, config);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nodes = new Map(config.nodes.map(node => [node.id, node]));
  const edges = new Map(config.edges.map(edge => [edge.from + "--" + edge.to, edge]));
  const nodeViews = new Map();
  const edgeViews = new Map();
  const outgoing = new Map(config.nodes.map(node => [node.id, []]));
  let hovered = null;
  let focused = null;
  let selection = null;
  let showingTitles = false;
  let isolatedEdges = new Set();
  let visible = true;
  let frame = null;
  let lastTime = null;
  let elapsed = 0;
  let transitioning = false;
  let entering = false;
  let entrance = null;

  function layoutGraph() {
    const project = (x, y) => portrait.matches ? [y, x] : [x, y];
    config.nodes.forEach((node, index) => {
      const source = sourceConfig.nodes[index];
      [node.x, node.y] = project(source.x, source.y);
    });
    config.edges.forEach((edge, index) => {
      edge.via = sourceConfig.edges[index].via.map(([x, y]) => project(x, y));
    });
    svg.setAttribute("viewBox", portrait.matches ? "-20 -35 900 1350" : "0 0 1280 860");
    root.classList.toggle("is-portrait", portrait.matches);
    nodeViews.forEach((view, id) => {
      const node = nodes.get(id);
      view.group.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
      positionLabel(view.label, node);
    });
    edgeViews.forEach((view, id) => {
      const { path, duration } = edgeGeometry(edges.get(id));
      [view.base, view.flow, view.hit, ...view.pulses.map(pulse => pulse.element)]
        .forEach(element => element.setAttribute("d", path));
      view.duration = duration;
    });
  }

  function positionLabel(label, node) {
    label.setAttribute("x", "0");
    const width = portrait.matches ? 860 : 1280;
    label.setAttribute("y", portrait.matches ? (node.y < 80 ? "56" : "-42") : node.y < 45 ? "48" : "-30");
    const left = portrait.matches ? width * 0.25 : 100;
    const right = portrait.matches ? width * 0.75 : 1180;
    label.setAttribute("text-anchor", node.x < left ? "start" : node.x > right ? "end" : "middle");
  }

  function edgeGeometry(edge) {
    const source = nodes.get(edge.from), target = nodes.get(edge.to);
    const points = [[source.x, source.y], ...edge.via, [target.x, target.y]];
    const path = points.map((point, index) => (index ? "L" : "M") + point.join(" ")).join(" ");
    const length = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]), 0);
    return { path, duration: Math.max(1.1, length / config.flowSpeed) };
  }

  function sizeLabels() {
    const scale = svg.getScreenCTM()?.a;
    const minimum = portrait.matches || touchInput.matches ? 14 : 0;
    if (scale > 0) root.style.setProperty("--graph-node-label-size", Math.max(24, minimum / scale) + "px");
    arrangeLabels();
  }

  function arrangeLabels() {
    nodeViews.forEach((view, id) => positionLabel(view.label, nodes.get(id)));
    if (!showingTitles || !portrait.matches) return;
    // Stagger neighboring phone labels so revealing the entire graph stays legible.
    const occupied = config.nodes.map(node => ({ x: node.x - 20, y: node.y - 20, width: 40, height: 40 }));
    const overlaps = (a, b) => a.x < b.x + b.width + 8 && a.x + a.width + 8 > b.x
      && a.y < b.y + b.height + 8 && a.y + a.height + 8 > b.y;
    nodeViews.forEach((view, id) => {
      const node = nodes.get(id), label = view.label;
      if (!node.label) return;
      const anchor = label.getAttribute("text-anchor");
      const above = Number(label.getAttribute("y"));
      const candidates = [
        [0, above, anchor], [0, 60, anchor],
        [32, 14, "start"], [-32, 14, "end"],
        [0, -88, anchor], [0, 106, anchor],
        [0, above, "start"], [0, above, "end"],
        ...[60, -88, 106, -132, 150].flatMap(y =>
          [anchor, "start", "end"].map(align => [0, y, align]))
      ];
      let best = null, lowest = Infinity;
      candidates.forEach(([x, y, align]) => {
        label.setAttribute("x", x);
        label.setAttribute("y", y);
        label.setAttribute("text-anchor", align);
        const box = label.getBBox();
        const bounds = { x: node.x + box.x, y: node.y + box.y, width: box.width, height: box.height };
        if (bounds.x < -12 || bounds.x + bounds.width > 872 || bounds.y < -27 || bounds.y + bounds.height > 1307) return;
        const score = occupied.filter(other => overlaps(bounds, other)).length;
        if (score < lowest) { lowest = score; best = { x, y, align, bounds }; }
      });
      if (best) {
        label.setAttribute("x", best.x);
        label.setAttribute("y", best.y);
        label.setAttribute("text-anchor", best.align);
        occupied.push(best.bounds);
      } else positionLabel(label, node);
    });
  }

  function showAllTitles(show) {
    showingTitles = show;
    root.classList.toggle("show-all-titles", show);
    nodeViews.forEach((view, id) => {
      if (nodes.get(id).action !== "toggle-labels") return;
      view.group.classList.toggle("is-selected", show);
      view.group.setAttribute("aria-pressed", String(show));
      view.group.setAttribute("aria-label", show ? "Hide all node titles" : "Show all node titles");
    });
    arrangeLabels();
  }

  layoutGraph();

  function element(tag, attributes, text) {
    const el = document.createElement(tag);
    Object.entries(attributes || {}).forEach(([key, value]) => el.setAttribute(key, value));
    if (text) el.textContent = text;
    return el;
  }

  function svgElement(tag, attributes) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attributes || {}).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function refreshColors() {
    root.style.setProperty("--graph-bg", config.background);
    root.style.setProperty("--graph-label", config.labelColor);
    root.style.setProperty("--graph-outline", config.nodeOutline);
    root.style.setProperty("--graph-muted-opacity", String(config.dimmedOpacity ?? 0.12));
    nodeViews.forEach((view, id) => {
      const node = nodes.get(id);
      view.body.setAttribute("fill", node.color);
      view.group.style.setProperty("--node-output", node.outputColor);
    });
    edgeViews.forEach((view, id) => {
      const edge = edges.get(id);
      view.base.setAttribute("stroke", edge.color);
      view.flow.setAttribute("stroke", edge.activeColor || nodes.get(edge.from).outputColor);
      view.pulses.forEach(pulse => pulse.element.setAttribute("stroke", edge.activeColor || nodes.get(edge.from).outputColor));
    });
  }

  function highlight() {
    const key = hovered || focused;
    const [kind, id] = (key || "").split(":");
    edgeViews.forEach((view, edgeId) => {
      const edge = edges.get(edgeId);
      const emphasized = selection !== null
        ? isolatedEdges.has(edgeId)
        : kind === "edge" ? edgeId === id : kind === "node" && (edge.from === id || edge.to === id);
      view.group.classList.toggle("is-highlighted", emphasized);
    });
    nodeViews.forEach((view, nodeId) => {
      view.group.classList.toggle("is-highlighted", kind === "node" && id === nodeId);
    });
  }

  function isolateComponent(key) {
    showAllTitles(false);
    selection = key;
    const [kind, id] = (key || "").split(":");
    hitSound?.setActive(false);
    if (kind === "node") note?.show(nodes.get(id));
    else note?.clear();
    isolatedEdges = new Set();
    const connectedNodes = new Set(kind === "node" ? [id] : []);
    edges.forEach((edge, edgeId) => {
      if (kind === "edge" ? edgeId === id : kind === "node" && (edge.from === id || edge.to === id)) {
        isolatedEdges.add(edgeId);
        connectedNodes.add(edge.from);
        connectedNodes.add(edge.to);
      }
    });
    nodeViews.forEach((view, nodeId) => {
      const selected = kind === "node" && nodeId === id;
      view.group.classList.toggle("is-muted", key !== null && !connectedNodes.has(nodeId) && nodes.get(nodeId).action !== "toggle-labels");
      view.group.classList.toggle("is-selected", selected);
      view.group.classList.toggle("is-endpoint", kind === "edge" && connectedNodes.has(nodeId));
      view.group.setAttribute("aria-pressed", String(selected));
      view.lastPulse = -10;
      view.ring.style.opacity = "0";
      if (key === null) view.nextOutput = elapsed + nodes.get(nodeId).phase;
    });
    edgeViews.forEach((view, edgeId) => {
      const selected = kind === "edge" && edgeId === id;
      view.group.classList.toggle("is-muted", key !== null && !isolatedEdges.has(edgeId));
      view.group.classList.toggle("is-selected", selected);
      view.group.setAttribute("aria-pressed", String(selected));
      // Clear old packets so a previous selection cannot arrive or sound later.
      view.pulses.forEach(pulse => {
        if (pulse.element !== view.flow) pulse.element.remove();
      });
      view.pulses = [];
      view.flow.setAttribute("opacity", "0");
    });
    // Shared trunks stay readable: draw the selected connections above the rest.
    edgeViews.forEach((view, edgeId) => {
      if (!isolatedEdges.has(edgeId)) edgeLayer.append(view.group);
    });
    isolatedEdges.forEach(edgeId => edgeLayer.append(edgeViews.get(edgeId).group));
    if (!reducedMotion.matches) {
      isolatedEdges.forEach(edgeId => {
        emitEdge(edgeId);
        const source = nodes.get(edges.get(edgeId).from);
        const view = nodeViews.get(source.id);
        view.lastPulse = elapsed;
        view.nextOutput = elapsed + source.interval;
      });
    }
    highlight();
    syncPlayback();
  }

  function clearIsolation() {
    hovered = focused = null;
    tooltip.hidden = true;
    isolateComponent(null);
  }

  function showTooltip(key, target) {
    if (transitioning || entering) return;
    const [kind, id] = key.split(":");
    tooltip.replaceChildren();
    if (kind === "node") {
      const selectedEdge = selection?.startsWith("edge:") ? edges.get(selection.slice(5)) : null;
      // Selected nodes and edge endpoints already have a persistent title.
      if (showingTitles || selection === key || (selectedEdge && (selectedEdge.from === id || selectedEdge.to === id))) {
        tooltip.hidden = true;
        return;
      }
      const node = nodes.get(id);
      if (!node.label) {
        tooltip.hidden = true;
        return;
      }
      tooltip.append(element("strong", {}, node.label));
    } else {
      const edge = edges.get(id);
      const label = (edge.label || "").trim();
      const subcaption = (edge.subcaption || "").trim();
      if (!label && !subcaption) {
        tooltip.hidden = true;
        return;
      }
      if (label) tooltip.append(element("strong", {}, label));
      if (subcaption) tooltip.append(element("span", {}, subcaption));
    }
    tooltip.hidden = false;
    const rect = target.getBoundingClientRect();
    const bounds = canvas.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const x = rect.left + rect.width / 2 - bounds.left + canvas.scrollLeft;
    const y = rect.top - bounds.top;
    const left = Math.max(canvas.scrollLeft + 8, Math.min(x - width / 2, canvas.scrollLeft + canvas.clientWidth - width - 8));
    const top = y > height + 20 ? y - height - 12 : y + rect.height + 12;
    tooltip.style.left = left + "px";
    tooltip.style.top = Math.max(8, Math.min(top, canvas.clientHeight - height - 8)) + "px";
  }

  function explore(group, key, anchor) {
    if (transitioning || entering) return;
    if (key.startsWith("node:") && nodes.get(key.slice(5)).action === "toggle-labels") {
      const show = !showingTitles;
      clearIsolation();
      showAllTitles(show);
      group.focus({ preventScroll: true });
      tooltip.hidden = true;
      return;
    }
    isolateComponent(selection === key ? null : key);
    // Drawing an edge last moves it in the DOM, so restore focus afterwards.
    group.focus({ preventScroll: true });
    if (selection !== null) hitSound?.unlock();
    showTooltip(key, anchor);
    highlight();
  }

  function bindComponent(group, key, anchor) {
    group.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") return;
      hovered = key;
      showTooltip(key, anchor);
      highlight();
    });
    group.addEventListener("pointerleave", () => {
      hovered = null;
      tooltip.hidden = true;
      highlight();
    });
    group.addEventListener("focus", () => {
      focused = key;
      showTooltip(key, anchor);
      highlight();
    });
    group.addEventListener("blur", () => {
      focused = null;
      tooltip.hidden = true;
      highlight();
    });
    group.addEventListener("click", () => explore(group, key, anchor));
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        explore(group, key, anchor);
      }
    });
  }

  const edgeLayer = svgElement("g", { "aria-label": "Directed connections" });
  const nodeLayer = svgElement("g", { "aria-label": "System nodes" });
  svg.querySelector("[data-static-graph]")?.remove();
  svg.append(edgeLayer, nodeLayer);

  edges.forEach((edge, id) => {
    const source = nodes.get(edge.from);
    const target = nodes.get(edge.to);
    outgoing.get(edge.from).push(id);
    const { path, duration } = edgeGeometry(edge);
    const group = svgElement("g", {
      class: "system-edge", "data-edge-id": id, "data-from": edge.from, "data-to": edge.to,
      tabindex: "0", role: "button", "aria-label": source.label + " to " + target.label + ": isolate connection", "aria-pressed": "false"
    });
    const base = svgElement("path", { class: "system-edge-idle", d: path });
    const flow = svgElement("path", { class: "system-edge-flow", d: path, pathLength: "1000", opacity: "0" });
    const hit = svgElement("path", { class: "system-edge-hit", d: path });
    group.append(base, flow, hit);
    edgeLayer.append(group);
    edgeViews.set(id, { group, base, flow, hit, duration, pulses: [] });
    bindComponent(group, "edge:" + id, hit);
  });

  nodes.forEach((node, id) => {
    const overview = node.action === "toggle-labels";
    const group = svgElement("g", {
      class: "system-node" + (overview ? " system-node-overview" : ""), "data-node-id": id, transform: "translate(" + node.x + " " + node.y + ")",
      tabindex: "0", role: "button", "aria-label": overview ? "Show all node titles" : node.label + ": isolate connections", "aria-pressed": "false"
    });
    if (overview) {
      group.style.setProperty("--node-pulse-duration", (node.pulseDuration || 3.2) + "s");
      group.style.setProperty("--node-pulse-scale", String(node.pulseScale || 1.12));
    }
    const hit = svgElement("circle", { class: "system-node-hit", r: "24" });
    const ring = svgElement("circle", { class: "system-node-ring", r: "17" });
    const rhombus = node.shape === "rhombus";
    const focus = svgElement(rhombus ? "polygon" : "circle", {
      class: "system-node-focus",
      ...(rhombus ? { points: "0,-24 19,0 0,24 -19,0" } : { r: "19" })
    });
    const body = svgElement(rhombus ? "polygon" : "circle", {
      class: "system-node-body",
      ...(rhombus ? { points: "0,-17 13,0 0,17 -13,0" } : { r: "13" })
    });
    const label = svgElement("text", {
      class: "system-node-label",
      "aria-hidden": "true"
    });
    label.textContent = node.label;
    positionLabel(label, node);
    group.append(hit, ring, focus, body, label);
    nodeLayer.append(group);
    nodeViews.set(id, { group, ring, body, label, lastPulse: -10, nextOutput: node.phase });
    bindComponent(group, "node:" + id, body);
  });

  // Resolve overlapping touch targets by distance, not SVG paint order. Native
  // scrolling and pinch zoom still cancel the click normally.
  svg.addEventListener("click", event => {
    if (event.detail === 0 || (!touchInput.matches && event.pointerType !== "touch")) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    let nearest = null, distance = 24;
    nodes.forEach(node => {
      const x = matrix.a * node.x + matrix.c * node.y + matrix.e;
      const y = matrix.b * node.x + matrix.d * node.y + matrix.f;
      const candidate = Math.hypot(event.clientX - x, event.clientY - y);
      if (candidate < distance) { nearest = node; distance = candidate; }
    });
    if (!nearest) return;
    event.stopPropagation();
    const view = nodeViews.get(nearest.id);
    explore(view.group, "node:" + nearest.id, view.body);
  }, true);

  document.addEventListener("click", event => {
    if (transitioning || (selection === null && !showingTitles)) return;
    // Keep the selection while reading or selecting the note's text.
    if (event.target.closest("[data-node-note]")) return;
    const component = event.target.closest(".system-node, .system-edge");
    if (component && root.contains(component)) return;
    clearIsolation();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !transitioning) {
      clearIsolation();
    }
  });
  canvas.addEventListener("scroll", () => { tooltip.hidden = true; }, { passive: true });
  window.addEventListener("resize", () => { tooltip.hidden = true; });
  portrait.addEventListener("change", () => {
    entrance?.finish();
    layoutGraph();
    sizeLabels();
  });
  if ("ResizeObserver" in window) new ResizeObserver(sizeLabels).observe(svg);
  else window.addEventListener("resize", sizeLabels);
  sizeLabels();

  // One clock drives all emissions. Only explicit outgoing edges carry output;
  // arrivals never recursively re-emit, so feedback cycles stay bounded.
  function emitEdge(edgeId) {
    const view = edgeViews.get(edgeId);
    let flow = view.flow;
    if (view.pulses.some(pulse => pulse.element === flow)) {
      flow = view.flow.cloneNode();
      view.group.insertBefore(flow, view.hit);
    }
    view.pulses.push({ element: flow, started: elapsed, arrived: false });
  }

  function tick(now) {
    frame = null;
    // Avoid rendering 60–120 times per second on a battery-powered touch device.
    if (touchInput.matches && lastTime !== null && now - lastTime < 1000 / 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    if (lastTime !== null) elapsed += Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    nodeViews.forEach((view, id) => {
      if (outgoing.get(id).length && elapsed >= view.nextOutput) {
        view.nextOutput = elapsed + nodes.get(id).interval;
        outgoing.get(id).forEach(edgeId => {
          if (selection !== null && !isolatedEdges.has(edgeId)) return;
          view.lastPulse = elapsed;
          emitEdge(edgeId);
        });
      }
      const age = elapsed - view.lastPulse;
      if (age < 1) {
        view.ring.setAttribute("r", String(14 + age * 13));
        view.ring.style.opacity = String((1 - age) * 0.85);
      } else if (view.ring.style.opacity !== "0") view.ring.style.opacity = "0";
    });
    edgeViews.forEach((view, id) => {
      view.pulses = view.pulses.filter(pulse => {
        const progress = (elapsed - pulse.started) / view.duration;
        const head = Math.min(1, progress);
        const tail = Math.max(0, progress - 0.22);
        if (tail >= 1) {
          pulse.element.setAttribute("opacity", "0");
          if (pulse.element !== view.flow) pulse.element.remove();
          return false;
        }
        // Clip a colored segment to the source→destination path; never wrap it.
        const start = tail * 1000;
        const size = Math.max(0, head - tail) * 1000;
        pulse.element.setAttribute("stroke-dasharray", "0 " + start + " " + size + " 1000");
        pulse.element.setAttribute("opacity", "1");
        if (progress >= 1 && !pulse.arrived) {
          const targetId = edges.get(id).to;
          nodeViews.get(targetId).lastPulse = elapsed;
          pulse.arrived = true;
          if (selection !== null && isolatedEdges.has(id)) hitSound?.hit(nodes.get(targetId));
        }
        return true;
      });
    });
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    const running = !transitioning && !entering && !reducedMotion.matches && visible && !document.hidden;
    root.classList.toggle("is-flow-paused", !running);
    hitSound?.setActive(running && selection !== null);
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
    if (running) frame = requestAnimationFrame(tick);
  }

  reducedMotion.addEventListener("change", syncPlayback);
  document.addEventListener("visibilitychange", syncPlayback);
  window.addEventListener("pageshow", syncPlayback);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }).observe(canvas);
  }

  refreshColors();
  entrance = window.createSystemGraphEntrance?.(root, config, {
    onStart() {
      entering = true;
      clearIsolation();
    },
    onFinish() {
      entering = false;
      syncPlayback();
    }
  });
  syncPlayback();
  window.createSystemGraphTransition?.(root, config, {
    onStart() {
      transitioning = true;
      entrance?.finish();
      clearIsolation();
    },
    onRestore() {
      transitioning = false;
      syncPlayback();
    }
  });
})();
