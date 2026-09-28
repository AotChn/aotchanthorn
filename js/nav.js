(function () {
  const nav = document.querySelector("nav");
  const toggle = document.querySelector(".nav-toggle");
  const navActions = document.querySelector(".nav-actions");
  const animationsToggle = document.querySelector(".animations-toggle");

  if (animationsToggle && window.AOT_ANIMATIONS) {
    function updateAnimationsToggle(enabled) {
      animationsToggle.setAttribute("aria-pressed", String(enabled));
      animationsToggle.setAttribute("title", "Turn transition animations " + (enabled ? "off" : "on"));
    }
    animationsToggle.addEventListener("click", () => {
      window.AOT_ANIMATIONS.setEnabled(!window.AOT_ANIMATIONS.enabled);
    });
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
