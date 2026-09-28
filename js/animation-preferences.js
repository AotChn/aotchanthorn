(function () {
  "use strict";

  // Load before the entrance scripts so a saved preference applies at first paint.
  const storageKey = "aot:transition-animations";
  const listeners = new Set();
  let enabled = true;

  function readPreference() {
    try { return localStorage.getItem(storageKey) !== "off"; }
    catch { return enabled; }
  }

  function apply(value, reason) {
    const changed = enabled !== value;
    enabled = value;
    document.documentElement.classList.toggle("transitions-disabled", !enabled);
    if (changed) listeners.forEach(listener => listener(enabled, reason));
  }

  window.AOT_ANIMATIONS = {
    get enabled() { return enabled; },
    setEnabled(value) {
      value = Boolean(value);
      try { localStorage.setItem(storageKey, value ? "on" : "off"); } catch { /* Keep the current page usable when storage is blocked. */ }
      apply(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };

  apply(readPreference());
  window.addEventListener("pageshow", () => apply(readPreference(), "pageshow"));
  window.addEventListener("storage", event => {
    if (event.key === storageKey || event.key === null) apply(readPreference());
  });
})();
