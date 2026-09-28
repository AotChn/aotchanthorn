(function () {
  "use strict";

  const lane = document.querySelector("[data-horse-lane]");
  const horse = lane?.querySelector(".horse-sprite");
  const settings = window.AOT_SYSTEM_GRAPH?.pageTransition || {};
  if (!horse || settings.enabled === false) return;

  // Owner controls for the exit sprint. Wave colors, timing, and wind/pop
  // volume come from pageTransition in system-graph-config.js.
  const sprintSpeed = 650; // CSS pixels/second
  const minimumRun = 650, maximumRun = 1600; // milliseconds
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sound = window.createSystemGraphTransitionSound?.(settings);
  const waveDuration = Number.isFinite(settings.waveDuration)
    ? Math.max(100, Math.min(6000, settings.waveDuration)) : 900;
  const waveColor = settings.waveColor || "#c8b89a";
  const waveFill = settings.waveFillColor || "#181713";
  const destinations = [
    ["portfolio.html", "Home"], ["about.html", "About"], ["work.html", "Work"],
    ["writing.html", "Memos"], ["contact.html", "Contact"]
  ].map(([href, label]) => ({ url: new URL(href, document.baseURI), label }));
  const clamp = value => Math.max(0, Math.min(1, value));
  let destination = null, navigating = false, overlay = null, struckText = null;
  let frame = null, watchdog = null, inertStates = [], playingMedia = [];

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
    struckText?.classList.remove("horse-impact-target");
    struckText = null;
    document.documentElement.classList.remove("horse-exiting");
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

  function collisionTarget(bounds, width) {
    const size = bounds.width;
    const noseY = bounds.top + size * .72;
    const leftNose = bounds.left + size * .125;
    const rightNose = bounds.left + size * .875;
    const candidates = [];
    // Measure the letters themselves, not the full-width heading/button box.
    document.querySelectorAll("main h1, main h2, main p, main a, main button, main .tag, main .updates-count")
      .forEach(element => {
        if (!element.textContent.trim() || getComputedStyle(element).visibility === "hidden") return;
        const range = document.createRange();
        range.selectNodeContents(element);
        [...range.getClientRects()].forEach(rect => {
          if (!rect.width || !rect.height || rect.bottom < noseY - size * .1 || rect.top > noseY + size * .1) return;
          const direction = rect.right <= leftNose - 16 ? -1 : rect.left >= rightNose + 16 ? 1 : 0;
          if (!direction) return;
          const x = direction < 0 ? rect.right : rect.left;
          if (x < 12 || x > width - 12) return;
          const endX = x - size * (direction < 0 ? .125 : .875);
          candidates.push({ x, y: Math.max(rect.top + 1, Math.min(noseY, rect.bottom - 1)),
            endX, direction, element, distance: Math.abs(endX - bounds.left) });
        });
      });
    if (candidates.length) return candidates.sort((a, b) => a.distance - b.distance)[0];

    // No letters in its horizontal path: run into a short wall at the screen edge.
    const facing = Number(horse.style.transform.match(/scaleX\(([-\d.]+)\)/)?.[1] || -1);
    let direction = facing < 0 ? 1 : -1;
    const room = direction < 0 ? leftNose - 12 : width - 12 - rightNose;
    if (room < Math.min(160, width * .3)) direction *= -1;
    const x = direction < 0 ? 12 : width - 12;
    const endX = x - size * (direction < 0 ? .125 : .875);
    return { x, y: noseY, endX, direction, distance: Math.abs(endX - bounds.left) };
  }

  function start(url, label) {
    destination = url;
    document.documentElement.classList.remove("page-wave-reveal");
    let bounds = horse.getBoundingClientRect();
    const navBottom = document.querySelector("nav")?.getBoundingClientRect().bottom || 0;
    if (bounds.top < navBottom + 12 || bounds.bottom > window.innerHeight - 20) {
      lane.scrollIntoView({ block: "center", behavior: "instant" });
      bounds = horse.getBoundingClientRect();
    }
    if (!bounds.width || !bounds.height) { navigate(); return; }
    const width = window.innerWidth, height = window.innerHeight;
    const target = collisionTarget(bounds, width);
    const runDuration = Math.max(minimumRun, Math.min(maximumRun, target.distance / sprintSpeed * 1000 + 180));
    const strideLength = 28 + target.distance / (runDuration / 1000) * .22;
    const initialFrame = Math.round(parseFloat(getComputedStyle(horse).backgroundPositionX) / 100 * 3) || 0;

    overlay = document.createElement("div");
    overlay.className = "horse-exit-overlay";
    overlay.style.setProperty("--horse-wave-color", waveColor);
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-label", "Opening " + label);
    overlay.addEventListener("wheel", event => event.preventDefault(), { passive: false });
    const stage = document.createElement("div");
    stage.className = "horse-exit-stage";
    stage.setAttribute("aria-hidden", "true");
    Object.assign(stage.style, { width: width + "px", height: height + "px" });
    // Continue the existing horse at its exact screen position; hide its original
    // only after this snapshot is ready. Nothing new drops in for the transition.
    const runner = horse.cloneNode(false);
    runner.classList.add("horse-exit-runner");
    Object.assign(runner.style, { width: bounds.width + "px", height: bounds.height + "px",
      top: bounds.top + "px", bottom: "auto" });
    stage.append(runner);
    if (!target.element) {
      const wall = document.createElement("div");
      wall.className = "horse-exit-wall";
      Object.assign(wall.style, { left: target.x + "px", top: bounds.top + bounds.height * .4 + "px",
        height: bounds.height * .57 + "px" });
      stage.append(wall);
    }
    const scene = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    scene.setAttribute("class", "horse-exit-wave");
    scene.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", target.x);
    ring.setAttribute("cy", target.y);
    ring.setAttribute("r", "0");
    ring.setAttribute("opacity", "0");
    scene.append(ring);
    stage.append(scene);
    overlay.append(stage);
    inertStates = [...document.body.children].map(element => [element, element.inert]);
    inertStates.forEach(([element]) => { element.inert = true; });
    playingMedia = [...document.querySelectorAll("video, audio")].filter(media => !media.paused && !media.ended);
    playingMedia.forEach(media => media.pause());
    document.documentElement.classList.add("horse-exiting");
    document.body.append(overlay);

    const started = performance.now();
    let impactAt = null, releaseDuration = 0, handoffAttempted = false;
    sound?.start(runDuration);

    function paint(x, index, squash = 1) {
      runner.style.left = x + "px";
      runner.style.backgroundPositionX = index * 100 / 3 + "%";
      runner.style.transform = `scaleX(${-target.direction * squash}) scaleY(${2 - squash})`;
    }

    function render(now) {
      const elapsed = now - started;
      stage.style.transform = `scale(${window.innerWidth / width},${window.innerHeight / height})`;
      if (elapsed < runDuration) {
        const t = clamp(elapsed / runDuration);
        // Accelerate for the first fifth, then keep running until the collision.
        const progress = t < .2 ? t * t / .36 : (t - .1) / .9;
        const distance = target.distance * progress;
        paint(bounds.left + (target.endX - bounds.left) * progress,
          Math.floor(initialFrame + distance / strideLength * 4) % 4);
      } else {
        if (impactAt === null) {
          impactAt = elapsed;
          struckText = target.element || null;
          struckText?.classList.add("horse-impact-target");
          releaseDuration = Math.max(180, sound?.pop() || 0);
        }
        const release = clamp((elapsed - impactAt) / releaseDuration);
        paint(target.endX, 3, 1 - Math.sin(release * Math.PI) * .18);
        runner.style.opacity = String(1 - release * .75);
        ring.setAttribute("r", String(4 + release * 60));
        ring.setAttribute("opacity", ".9");
        if (release >= 1) {
          if (!handoffAttempted) {
            handoffAttempted = true;
            try {
              sessionStorage.setItem("aot:page-wave", JSON.stringify({ path: url.pathname, at: Date.now(),
                x: target.x / width, y: target.y / height, duration: waveDuration, color: waveColor, fillColor: waveFill }));
              navigate();
              return;
            } catch { /* Storage blocked: show the wave here before navigating. */ }
          }
          const wave = clamp((elapsed - impactAt - releaseDuration) / waveDuration);
          const radius = Math.hypot(Math.max(target.x, width - target.x), Math.max(target.y, height - target.y));
          ring.setAttribute("r", String(64 + wave * radius));
          ring.style.fill = waveFill;
          runner.style.opacity = String(.25 * (1 - wave));
          if (wave >= 1) { navigate(); return; }
        }
      }
      frame = requestAnimationFrame(step);
    }

    function step(now) {
      try { render(now); } catch { navigate(); }
    }
    watchdog = setTimeout(navigate, runDuration + waveDuration + 1500);
    step(started);
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    if (destination) { event.preventDefault(); return; }
    const url = new URL(link.href, document.baseURI);
    const page = destinations.find(page => page.url.origin === url.origin && page.url.pathname === url.pathname);
    if (url.pathname === window.location.pathname || !page ||
        reducedMotion.matches || window.AOT_ANIMATIONS?.enabled === false) return;
    event.preventDefault();
    try { start(url, page.label); }
    catch { destination = url; navigate(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) navigate(); });
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) navigate(); });
  window.AOT_ANIMATIONS?.subscribe((enabled, reason) => { if (!enabled && reason !== "pageshow") navigate(); });
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", restore);
})();
