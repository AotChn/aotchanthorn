(function () {
  const nav = document.querySelector("nav");
  const toggle = document.querySelector(".nav-toggle");
  const navActions = document.querySelector(".nav-actions");

  if (!nav || !toggle || !navActions) return;

  function closeNav() {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function openNav() {
    nav.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
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
    if (event.key === "Escape") closeNav();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 640) closeNav();
  });
})();
