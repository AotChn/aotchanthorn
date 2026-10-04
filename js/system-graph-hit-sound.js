(function () {
  "use strict";

  window.createSystemGraphHitSound = function (root, config) {
    const settings = config.hitSound || {};
    const clamp = (value, fallback, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));
    const volume = clamp(settings.volume, 0.16, 0, 1);
    const duration = clamp(settings.duration, 0.12, 0.05, 1);
    const basePitch = clamp(settings.basePitch, 330, 80, 4000);
    const pitchVariations = [1, 1.06, 0.96, 1.03, 0.92, 1.08, 0.98, 1.02];
    const pitches = new Map(config.nodes.map((node, index) => [node.id, basePitch * pitchVariations[index % pitchVariations.length]]));
    const voices = new Set();
    let audio = null;
    let output = null;
    let active = false;

    // Browsers require an interaction before audio can play. Hover never unlocks it.
    function unlock() {
      if (!active || document.hidden || window.AOT_AUDIO?.enabled === false || settings.enabled === false || volume === 0) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!audio || audio.state === "closed") {
          audio = new AudioContext();
          const compressor = audio.createDynamicsCompressor();
          compressor.threshold.value = -12;
          compressor.knee.value = 18;
          compressor.ratio.value = 6;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.12;
          output = audio.createGain();
          const filter = audio.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = Math.min(4000, basePitch * 8);
          filter.Q.value = 0.5;
          const master = audio.createGain();
          master.gain.value = volume;
          output.connect(filter);
          filter.connect(compressor);
          compressor.connect(master);
          master.connect(window.AOT_AUDIO?.output(audio) || audio.destination);
        }
        if (audio.state === "suspended") audio.resume().catch(() => {});
      } catch {
        // Graph animation remains usable when audio is unavailable.
        output = null;
      }
    }

    function release(voice) {
      if (voice.released) return;
      voice.released = true;
      voice.oscillators.forEach(oscillator => oscillator.disconnect());
      voice.gains.forEach(gain => gain.disconnect());
      voices.delete(voice);
    }

    function stop(voice) {
      voice.oscillators.forEach(oscillator => {
        try { oscillator.stop(); } catch { /* Already finished. */ }
      });
      release(voice);
    }

    function setActive(value) {
      active = value;
      if (!active) voices.forEach(stop);
    }

    function hit(node) {
      if (!active || document.hidden || window.AOT_AUDIO?.enabled === false || settings.enabled === false || !audio || audio.state !== "running" || !output) return;
      // A new hit always gets a clunk; retire the oldest tail during busy bursts.
      if (voices.size >= 12) stop(voices.values().next().value);
      const voice = { oscillators: [], gains: [], remaining: 2, released: false };
      voices.add(voice);
      const pitch = clamp(node.hitPitch, pitches.get(node.id) || basePitch, 80, 4000);
      const now = audio.currentTime;
      try {
        // A low, falling thud with a short buzzy impact gives a mechanical clunk.
        [
          { type: "triangle", ratio: 1, level: 0.8, decay: duration },
          { type: "square", ratio: 1.67, level: 0.12, decay: duration * 0.4 }
        ].forEach(part => {
          const oscillator = audio.createOscillator();
          const envelope = audio.createGain();
          voice.oscillators.push(oscillator);
          voice.gains.push(envelope);
          oscillator.type = part.type;
          oscillator.frequency.setValueAtTime(pitch * part.ratio * 1.65, now);
          oscillator.frequency.exponentialRampToValueAtTime(pitch * part.ratio, now + 0.028);
          envelope.gain.setValueAtTime(0, now);
          envelope.gain.linearRampToValueAtTime(part.level, now + 0.003);
          envelope.gain.setValueAtTime(part.level, now + Math.min(0.014, part.decay * 0.3));
          envelope.gain.exponentialRampToValueAtTime(0.0001, now + part.decay);
          oscillator.connect(envelope);
          envelope.connect(output);
          oscillator.onended = () => {
            if (--voice.remaining === 0) release(voice);
          };
          oscillator.start(now);
          oscillator.stop(now + part.decay + 0.01);
        });
      } catch {
        stop(voice);
      }
    }

    window.addEventListener("pagehide", () => setActive(false));
    window.AOT_AUDIO?.subscribe(enabled => {
      if (enabled) unlock();
      else voices.forEach(stop);
    });

    // Selection calls unlock within the node/edge click or keyboard gesture.
    return { hit, setActive, unlock };
  };
})();
