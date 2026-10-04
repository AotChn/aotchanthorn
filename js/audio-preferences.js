(function () {
  "use strict";

  const storageKey = "aot:sound";
  const listeners = new Set();
  const outputs = new Map();
  const mediaStates = new WeakMap();
  const detachedMedia = new Set();
  let enabled = true;

  function readPreference() {
    try { return localStorage.getItem(storageKey) !== "off"; }
    catch { return enabled; }
  }

  // Preserve each video's own mute/volume setting when the site is unmuted.
  function trackMedia(media, detached = false) {
    if (!mediaStates.has(media)) {
      mediaStates.set(media, { forced: false, muted: media.muted });
      media.addEventListener("volumechange", () => {
        if (!enabled && !media.muted) media.muted = true;
      });
    }
    if (detached) detachedMedia.add(media);
    const state = mediaStates.get(media);
    if (!enabled) {
      if (!state.forced) state.muted = media.muted;
      state.forced = true;
      media.muted = true;
    } else if (state.forced) {
      state.forced = false;
      media.muted = state.muted;
    }
    return media;
  }

  function syncMedia() {
    document.querySelectorAll("video, audio").forEach(media => trackMedia(media));
    detachedMedia.forEach(media => trackMedia(media));
  }

  function apply(value) {
    const changed = enabled !== value;
    enabled = value;
    outputs.forEach((gain, context) => {
      if (context.state === "closed") { outputs.delete(context); return; }
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(enabled ? 1 : 0, context.currentTime);
    });
    syncMedia();
    if (changed) listeners.forEach(listener => listener(enabled));
  }

  window.AOT_AUDIO = {
    get enabled() { return enabled; },
    setEnabled(value) {
      value = Boolean(value);
      try { localStorage.setItem(storageKey, value ? "on" : "off"); } catch { /* The current page still works without storage. */ }
      apply(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Every synthesized/recorded effect routes through a single gate per context.
    // Muting silences sounds already playing as well as newly scheduled ones.
    output(context) {
      if (!outputs.has(context)) {
        const gain = context.createGain();
        gain.gain.value = enabled ? 1 : 0;
        gain.connect(context.destination);
        outputs.set(context, gain);
        context.addEventListener("statechange", () => {
          if (context.state === "closed") outputs.delete(context);
        });
      }
      return outputs.get(context);
    },
    trackMedia
  };

  apply(readPreference());
  document.addEventListener("DOMContentLoaded", syncMedia, { once: true });
  document.addEventListener("play", event => {
    if (event.target.matches?.("video, audio")) trackMedia(event.target);
  }, true);
  window.addEventListener("pageshow", () => apply(readPreference()));
  window.addEventListener("storage", event => {
    if (event.key === storageKey || event.key === null) apply(readPreference());
  });
})();
