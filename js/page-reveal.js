(function () {
  "use strict";

  let handoff;
  try {
    const saved = sessionStorage.getItem("aot:page-wave");
    sessionStorage.removeItem("aot:page-wave");
    if (!saved) return;
    handoff = JSON.parse(saved);
  } catch { return; }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!handoff || handoff.path !== window.location.pathname || !Number.isFinite(handoff.at) ||
      Math.abs(Date.now() - handoff.at) > 15000 || reducedMotion.matches ||
      !Number.isFinite(handoff.x) || !Number.isFinite(handoff.y)) return;

  const root = document.documentElement;
  const duration = Number.isFinite(handoff.duration) ? Math.max(100, Math.min(6000, handoff.duration)) : 900;
  const x = Math.max(0, Math.min(1, handoff.x));
  const y = Math.max(0, Math.min(1, handoff.y));
  let timer;
  function sizeWave() {
    const width = window.innerWidth, height = window.innerHeight;
    const radius = Math.ceil(Math.hypot(Math.max(x, 1 - x) * width, Math.max(y, 1 - y) * height)) + 2;
    const body = document.body?.getBoundingClientRect();
    root.style.setProperty("--page-wave-x", x * width + "px");
    root.style.setProperty("--page-wave-y", y * height + "px");
    root.style.setProperty("--page-wave-content-x", x * width - (body?.left || 0) + "px");
    root.style.setProperty("--page-wave-content-y", y * height - (body?.top || 0) + "px");
    root.style.setProperty("--page-wave-radius", radius + "px");
    root.style.setProperty("--page-wave-diameter", radius * 2 + "px");
  }
  function finish() {
    clearTimeout(timer);
    root.classList.remove("page-wave-reveal");
    window.removeEventListener("resize", sizeWave);
    window.removeEventListener("scroll", sizeWave);
    document.removeEventListener("animationend", onAnimationEnd);
    reducedMotion.removeEventListener("change", finish);
  }
  function onAnimationEnd(event) {
    if (event.target === document.body && event.animationName === "page-wave-content") finish();
  }
  sizeWave();
  root.style.setProperty("--page-wave-duration", duration + "ms");
  root.style.setProperty("--page-wave-color", typeof handoff.color === "string" && CSS.supports("color", handoff.color) ? handoff.color : "#c8b89a");
  root.style.setProperty("--page-wave-fill", typeof handoff.fillColor === "string" && CSS.supports("color", handoff.fillColor) ? handoff.fillColor : "#181713");
  // This script runs in the head so the circular reveal is set before first paint.
  root.classList.add("page-wave-reveal");
  document.addEventListener("animationend", onAnimationEnd);
  document.addEventListener("DOMContentLoaded", () => {
    sizeWave();
    timer = setTimeout(finish, duration + 500);
  }, { once: true });
  window.addEventListener("resize", sizeWave);
  window.addEventListener("scroll", sizeWave, { passive: true });
  window.addEventListener("pageshow", event => { if (event.persisted) finish(); });
  reducedMotion.addEventListener("change", finish);
})();
