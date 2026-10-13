(function () {
  // Measure the public website, not local or deployment previews.
  const productionHosts = ["aotchn.com", "www.aotchn.com"];
  if (!productionHosts.includes(window.location.hostname)) return;

  const scriptPath = "/_vercel/speed-insights/script.js";
  if (document.querySelector('script[src="' + scriptPath + '"]')) return;

  // Vercel's plain-HTML integration collects performance metrics automatically.
  window.si = window.si || function () {
    (window.siq = window.siq || []).push(arguments);
  };
  const script = document.createElement("script");
  script.defer = true;
  script.src = scriptPath;
  document.head.appendChild(script);
})();
