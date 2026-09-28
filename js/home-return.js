(function () {
  "use strict";

  const settings = window.AOT_SYSTEM_GRAPH?.entrance || {};
  if (settings.enabled === false) return;
  const home = new URL("portfolio.html", document.baseURI);
  if (window.location.pathname === home.pathname) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const duration = Number.isFinite(settings.returnDuration)
    ? Math.max(100, Math.min(6000, settings.returnDuration)) : 750;
  const sound = window.createSystemGraphTransitionSound?.({ ...settings, popVolume: 0 });
  let destination = null, timer = null, originalInert = false;
  let playingMedia = [];

  function stop() {
    clearTimeout(timer);
    timer = null;
    sound?.stop();
  }

  function restore() {
    stop();
    if (!destination) return;
    document.documentElement.classList.remove("home-returning");
    document.body.inert = originalInert;
    document.body.removeAttribute("aria-busy");
    destination = null;
    playingMedia.forEach(media => { media.play()?.catch(() => {}); });
    playingMedia = [];
  }

  function navigate() {
    if (!destination) return;
    stop();
    try { window.location.assign(destination.href); }
    catch { restore(); }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href, document.baseURI);
    if (url.origin !== home.origin || url.pathname !== home.pathname || reducedMotion.matches || window.AOT_ANIMATIONS?.enabled === false) return;
    event.preventDefault();
    if (destination) return;
    destination = url;
    originalInert = document.body.inert;
    document.body.inert = true;
    document.body.setAttribute("aria-busy", "true");
    document.documentElement.classList.remove("page-wave-reveal");
    document.documentElement.classList.add("home-returning");
    playingMedia = [...document.querySelectorAll("video, audio")].filter(media => !media.paused && !media.ended);
    playingMedia.forEach(media => media.pause());
    // Wind runs within this click's audio permission, before the document unloads.
    sound?.start(duration);
    timer = setTimeout(navigate, duration + 50);
  });

  document.addEventListener("visibilitychange", () => { if (document.hidden && destination) navigate(); });
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches && destination) navigate(); });
  window.AOT_ANIMATIONS?.subscribe((enabled, reason) => { if (!enabled && reason !== "pageshow") navigate(); });
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", restore);
})();
