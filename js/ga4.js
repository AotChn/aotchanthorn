(function () {
  // Paste your real GA4 Measurement ID here, for example: G-ABC123DEF4
  var GA_MEASUREMENT_ID = "G-GYD72TBRG3";

  function hasValidMeasurementId(id) {
    return /^G-[A-Z0-9]+$/i.test(id);
  }

  function trackConfiguredClicks() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-ga-event]");
      var eventName;
      var eventLabel;

      if (!trigger || typeof window.gtag !== "function") return;

      eventName = trigger.getAttribute("data-ga-event");
      eventLabel = trigger.getAttribute("data-ga-label") || trigger.textContent.trim();

      if (!eventName) return;

      window.gtag("event", eventName, {
        event_label: eventLabel,
        link_url: trigger.href || ""
      });
    });
  }

  if (!hasValidMeasurementId(GA_MEASUREMENT_ID)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  trackConfiguredClicks();

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(script);
})();
