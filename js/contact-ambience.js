(function () {
  "use strict";

  // Contact-only ambience. This recording is already quiet; volume is 0–1.
  const settings = {
    enabled: true,
    src: "../assets/contact-birds.mp3",
    volume: .85
  };
  if (!settings.enabled) return;

  const birds = new Audio(settings.src);
  birds.loop = true;
  birds.preload = "none";
  birds.volume = Math.max(0, Math.min(1, settings.volume));
  window.AOT_AUDIO?.trackMedia(birds, true);
  let pageActive = true;

  function canPlay() {
    const page = document.documentElement;
    return window.AOT_AUDIO?.enabled !== false && pageActive && !document.hidden &&
      !page.classList.contains("home-returning") &&
      !page.classList.contains("page-wave-reveal") &&
      !page.classList.contains("horse-exiting");
  }

  function sync() {
    if (!canPlay()) {
      birds.pause();
      return;
    }
    if (!birds.paused) return;
    // Try on arrival; browsers that block autoplay retry on a click or tap.
    birds.play()?.then(() => {
      if (!canPlay()) birds.pause();
    }).catch(() => {});
  }

  document.addEventListener("click", sync);
  window.AOT_AUDIO?.subscribe(sync);
  document.addEventListener("keydown", event => {
    if (!event.repeat && (event.key === "Enter" || event.key === " ")) sync();
  });
  document.addEventListener("visibilitychange", sync);
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
  window.addEventListener("pagehide", () => {
    pageActive = false;
    birds.pause();
  });
  window.addEventListener("pageshow", () => {
    pageActive = true;
    sync();
  });
  sync();
})();
