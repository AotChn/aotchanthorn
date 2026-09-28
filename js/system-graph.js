(function () {
  "use strict";

  const root = document.querySelector("[data-system-graph]");
  if (!root || !window.AOT_SYSTEM_GRAPH) return;

  const config = window.AOT_SYSTEM_GRAPH;
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
  let isolatedEdges = new Set();
  let visible = true;
  let frame = null;
  let lastTime = null;
  let elapsed = 0;
  let transitioning = false;
  let entering = false;

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
      view.group.classList.toggle("is-muted", key !== null && !connectedNodes.has(nodeId));
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
      if (selectedEdge && (selectedEdge.from === id || selectedEdge.to === id)) {
        tooltip.hidden = true;
        return;
      }
      const node = nodes.get(id);
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

  function bindComponent(group, key, anchor) {
    group.addEventListener("pointerenter", () => {
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
    function explore() {
      if (transitioning || entering) return;
      isolateComponent(selection === key ? null : key);
      // Drawing an edge last moves it in the DOM, so restore focus afterwards.
      group.focus({ preventScroll: true });
      if (selection !== null) hitSound?.unlock();
      showTooltip(key, anchor);
      highlight();
    }
    group.addEventListener("click", explore);
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        explore();
      }
    });
  }

  const edgeLayer = svgElement("g", { "aria-label": "Directed connections" });
  const nodeLayer = svgElement("g", { "aria-label": "System nodes" });
  svg.append(edgeLayer, nodeLayer);

  edges.forEach((edge, id) => {
    const source = nodes.get(edge.from);
    const target = nodes.get(edge.to);
    outgoing.get(edge.from).push(id);
    const points = [[source.x, source.y], ...edge.via, [target.x, target.y]];
    const path = points.map((point, index) => (index ? "L" : "M") + point.join(" ")).join(" ");
    const length = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]), 0);
    const group = svgElement("g", {
      class: "system-edge", "data-edge-id": id, "data-from": edge.from, "data-to": edge.to,
      tabindex: "0", role: "button", "aria-label": source.label + " to " + target.label + ": isolate connection", "aria-pressed": "false"
    });
    const base = svgElement("path", { class: "system-edge-idle", d: path });
    const flow = svgElement("path", { class: "system-edge-flow", d: path, pathLength: "1000", opacity: "0" });
    const hit = svgElement("path", { class: "system-edge-hit", d: path });
    group.append(base, flow, hit);
    edgeLayer.append(group);
    edgeViews.set(id, { group, base, flow, hit, duration: Math.max(1.1, length / config.flowSpeed), pulses: [] });
    bindComponent(group, "edge:" + id, hit);
  });

  nodes.forEach((node, id) => {
    const group = svgElement("g", {
      class: "system-node", "data-node-id": id, transform: "translate(" + node.x + " " + node.y + ")",
      tabindex: "0", role: "button", "aria-label": node.label + ": isolate connections", "aria-pressed": "false"
    });
    const hit = svgElement("circle", { class: "system-node-hit", r: "24" });
    const ring = svgElement("circle", { class: "system-node-ring", r: "17" });
    const focus = svgElement("circle", { class: "system-node-focus", r: "19" });
    const body = svgElement("circle", { class: "system-node-body", r: "13" });
    const label = svgElement("text", {
      class: "system-node-label", y: node.y < 45 ? "48" : "-30",
      "text-anchor": node.x < 100 ? "start" : node.x > 1180 ? "end" : "middle",
      "aria-hidden": "true"
    });
    label.textContent = node.label;
    group.append(hit, ring, focus, body, label);
    nodeLayer.append(group);
    nodeViews.set(id, { group, ring, body, lastPulse: -10, nextOutput: node.phase });
    bindComponent(group, "node:" + id, body);
  });

  document.addEventListener("click", event => {
    if (transitioning || selection === null) return;
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
      view.ring.setAttribute("r", String(14 + Math.min(age, 1) * 13));
      view.ring.style.opacity = age < 1 ? String((1 - age) * 0.85) : "0";
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
  const entrance = window.createSystemGraphEntrance?.(root, config, {
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
