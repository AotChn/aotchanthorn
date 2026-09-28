(function () {
  "use strict";

  // Character timing and audio for the graph's typed notes.
  window.createSystemGraphTypewriter = function (root, config, view) {
    const { text, caret } = view;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settings = config.typing || {};
    const characterDelay = Math.max(16, Number(settings.characterDelay) || 32);
    const punctuationDelay = Math.max(0, Number(settings.punctuationDelay) || 0);
    const volume = Number.isFinite(settings.volume) ? Math.max(0, Math.min(1, settings.volume)) : 0.16;
    const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    const sounds = new Set();
    let timer = null;
    let audio = null;
    let keyBuffer = null;
    let characters = [];
    let position = 0;
    let message = "";
    let visible = true;
    let soundEnabled = false;
    let completed = true;

    function stopTimer() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }

    function stopSounds() {
      sounds.forEach(source => {
        try { source.stop(); } catch { /* The short sound may have already ended. */ }
      });
      sounds.clear();
    }

    // Called only by node activation, so audio starts within a user gesture.
    // One shared context and noise buffer keep the sound lightweight and local.
    function enableSound() {
      if (settings.soundEnabled === false || volume === 0 || reducedMotion.matches) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!audio || audio.state === "closed") {
          audio = new AudioContext();
          const length = Math.ceil(audio.sampleRate * 0.024);
          keyBuffer = audio.createBuffer(1, length, audio.sampleRate);
          const samples = keyBuffer.getChannelData(0);
          for (let i = 0; i < length; i++) {
            samples[i] = (Math.random() * 2 - 1) * Math.exp(-5 * i / length);
          }
        }
        if (audio.state === "suspended") audio.resume().catch(() => {});
      } catch {
        // Text still works when the browser cannot provide audio.
      }
    }

    function typeSound(character) {
      if (!soundEnabled || !audio || audio.state !== "running" || !keyBuffer || /\s/u.test(character) || document.hidden || !visible) return;
      try {
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        source.buffer = keyBuffer;
        source.playbackRate.value = 0.9 + Math.random() * 0.2;
        filter.type = "bandpass";
        filter.frequency.value = 1400 + Math.random() * 600;
        filter.Q.value = 0.7;
        gain.gain.setValueAtTime(0, audio.currentTime);
        gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.025);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        source.onended = () => {
          sounds.delete(source);
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
        sounds.add(source);
        source.start();
      } catch {
        // A blocked audio device must never interrupt the note animation.
      }
    }

    function finish() {
      stopTimer();
      position = characters.length;
      text.textContent = message;
      caret.hidden = true;
      if (!completed) {
        completed = true;
        view.onFinish?.();
      }
    }

    function schedule(delay = characterDelay) {
      if (timer !== null || position >= characters.length || document.hidden || !visible) return;
      timer = setTimeout(typeNext, delay);
    }

    function typeNext() {
      timer = null;
      if (document.hidden || !visible || position >= characters.length) return;
      const character = characters[position++];
      text.textContent += character;
      typeSound(character);
      if (position === characters.length) {
        finish();
        return;
      }
      const pause = /[.,!?;:…]/u.test(character) ? punctuationDelay : 0;
      schedule(characterDelay + pause);
    }

    function clear() {
      stopTimer();
      stopSounds();
      characters = [];
      position = 0;
      message = "";
      text.textContent = "";
      caret.hidden = true;
      soundEnabled = false;
      completed = true;
    }

    function show(value, options = {}) {
      clear();
      message = value;
      if (!message) return;
      completed = false;
      soundEnabled = options.sound !== false;
      characters = segmenter ? Array.from(segmenter.segment(message), item => item.segment) : Array.from(message);
      if (reducedMotion.matches) {
        finish();
        return;
      }
      caret.hidden = false;
      if (soundEnabled) enableSound();
      schedule();
    }

    function syncVisibility() {
      if (document.hidden || !visible) {
        stopTimer();
        stopSounds();
      } else {
        schedule();
      }
    }

    document.addEventListener("visibilitychange", syncVisibility);
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopSounds();
        finish();
      }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncVisibility();
      }).observe(root);
    }
    window.addEventListener("pagehide", () => {
      stopTimer();
      stopSounds();
    });
    window.addEventListener("pageshow", syncVisibility);

    return { show, clear, finish };
  };

  window.createSystemGraphNotes = function (root, config) {
    const container = root.querySelector("[data-node-note]");
    if (!container) return null;
    const line = container.querySelector("[data-note-line]");
    const announcement = container.querySelector("[data-note-announcement]");
    const writer = window.createSystemGraphTypewriter(root, config, {
      text: container.querySelector("[data-note-text]"),
      caret: container.querySelector("[data-note-caret]")
    });
    function clear() {
      writer.clear();
      announcement.textContent = "";
      line.hidden = true;
    }
    function show(node) {
      clear();
      const message = typeof node.note === "string" ? node.note.trim() : "";
      if (!message) return;
      line.hidden = false;
      // Announce the complete note once, not every typed letter.
      announcement.textContent = node.label + ": " + message;
      writer.show(message);
    }
    return { show, clear };
  };
})();
