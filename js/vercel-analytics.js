(function () {
  // Only count visits to the public website, not local or deployment previews.
  const productionHosts = ["aotchn.com", "www.aotchn.com"];
  if (!productionHosts.includes(window.location.hostname)) return;

  const scriptPath = "/_vercel/insights/script.js";
  if (document.querySelector('script[src="' + scriptPath + '"]')) return;

  // Vercel's plain-HTML integration; page views are recorded automatically.
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  const script = document.createElement("script");
  script.defer = true;
  script.src = scriptPath;
  document.head.appendChild(script);
})();
