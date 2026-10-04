(function () {
  const nav = document.querySelector("nav");
  const toggle = document.querySelector(".nav-toggle");
  const navActions = document.querySelector(".nav-actions");
  const animationsToggle = document.querySelector(".animations-toggle");
  const volumeToggle = document.querySelector(".volume-toggle");

  if (animationsToggle && window.AOT_ANIMATIONS) {
    const control = document.createElement("div");
    control.className = "animations-control";
    const feedback = document.createElement("span");
    feedback.className = "animations-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");
    animationsToggle.before(control);
    control.append(animationsToggle);
    if (volumeToggle) control.append(volumeToggle);
    control.append(feedback);
    let feedbackTimer;

    function hideFeedback() {
      clearTimeout(feedbackTimer);
      feedback.classList.remove("is-visible");
    }

    function showFeedback(message) {
      clearTimeout(feedbackTimer);
      feedback.textContent = message;
      feedback.classList.add("is-visible");
      feedbackTimer = setTimeout(hideFeedback, 1500);
    }

    function updateAnimationsToggle(enabled) {
      animationsToggle.setAttribute("aria-pressed", String(enabled));
      animationsToggle.setAttribute("title", "Turn transition animations " + (enabled ? "off" : "on"));
    }
    animationsToggle.addEventListener("click", () => {
      window.AOT_ANIMATIONS.setEnabled(!window.AOT_ANIMATIONS.enabled);
      showFeedback(window.AOT_ANIMATIONS.enabled ? "animations on" : "animations off");
    });
    if (volumeToggle && window.AOT_AUDIO) {
      const updateVolumeToggle = enabled => {
        volumeToggle.setAttribute("aria-pressed", String(enabled));
        volumeToggle.setAttribute("title", enabled ? "Mute site sounds" : "Unmute site sounds");
      };
      volumeToggle.addEventListener("click", () => {
        window.AOT_AUDIO.setEnabled(!window.AOT_AUDIO.enabled);
        showFeedback(window.AOT_AUDIO.enabled ? "sound on" : "sound off");
      });
      window.AOT_AUDIO.subscribe(updateVolumeToggle);
      updateVolumeToggle(window.AOT_AUDIO.enabled);
    }
    window.addEventListener("pagehide", hideFeedback);
    window.addEventListener("pageshow", hideFeedback);
    window.AOT_ANIMATIONS.subscribe(updateAnimationsToggle);
    updateAnimationsToggle(window.AOT_ANIMATIONS.enabled);
  }

  if (!nav || !toggle || !navActions) return;

  function closeNav() {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  }

  function openNav() {
    nav.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
  }

  toggle.addEventListener("click", function () {
    if (nav.classList.contains("nav-open")) {
      closeNav();
      return;
    }

    openNav();
  });

  navActions.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("nav-open")) {
      closeNav();
      toggle.focus();
    }
  });

  document.addEventListener("pointerdown", function (event) {
    if (!nav.contains(event.target)) closeNav();
  });
  nav.addEventListener("focusout", function (event) {
    if (!nav.contains(event.relatedTarget)) closeNav();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 800) closeNav();
  });
})();
