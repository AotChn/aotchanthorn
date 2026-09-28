(function () {
  "use strict";

  window.createHorseHoofSound = function (settings) {
    const volume = Math.max(0, Math.min(1, settings.volume ?? .2));
    const voices = new Set();
    let audio = null, output = null, hoof = null, active = false;

    function release(voice) {
      if (!voices.delete(voice)) return;
      voice.source.disconnect();
      voice.gain.disconnect();
    }

    function silence() {
      voices.forEach(voice => {
        try { voice.source.stop(); } catch { /* Already ended. */ }
        release(voice);
      });
    }

    function close() {
      silence();
      if (audio && audio.state !== "closed") audio.close().catch(() => {});
      audio = output = hoof = null;
    }

    // Unlock only from a real interaction; browsing and animation stay silent
    // until the browser permits audio. The star control also gates hoofbeats.
    function unlock() {
      if (!active || document.hidden || settings.enabled === false || !volume) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!audio || audio.state === "closed") {
          audio = new AudioContext();
          output = audio.createGain();
          output.gain.value = volume;
          output.connect(audio.destination);
          hoof = audio.createBuffer(1, Math.ceil(audio.sampleRate * .11), audio.sampleRate);
          const samples = hoof.getChannelData(0);
          let previousNoise = 0;
          for (let index = 0; index < samples.length; index++) {
            const t = index / audio.sampleRate;
            const noise = Math.random() * 2 - 1;
            // A short hollow clop: low hoof impact, woody resonance, and grit.
            const attack = 1 - Math.exp(-t * 1100);
            samples[index] = attack * (
              .62 * Math.sin(2 * Math.PI * (190 * t - 350 * t * t)) * Math.exp(-t * 48)
              + .28 * Math.sin(2 * Math.PI * 780 * t) * Math.exp(-t * 85)
              + .15 * (noise - previousNoise) * Math.exp(-t * 130)
            );
            previousNoise = noise;
          }
        }
        if (audio.state === "suspended") audio.resume().catch(() => {});
      } catch { close(); }
    }

    function hit(speed, accent, delay = 0) {
      if (!active || document.hidden || !audio || audio.state !== "running" || !hoof) return;
      try {
        const source = audio.createBufferSource();
        const gain = audio.createGain();
        const pace = Math.min(1, speed / 245);
        source.buffer = hoof;
        source.playbackRate.value = .95 + Math.random() * .08 + pace * .04;
        gain.gain.value = accent * (.6 + pace * .4);
        source.connect(gain);
        gain.connect(output);
        const voice = { source, gain };
        voices.add(voice);
        source.onended = () => release(voice);
        source.start(audio.currentTime + Math.max(0, Math.min(.05, delay)));
      } catch { silence(); }
    }

    function setActive(value) {
      active = value;
      if (!active) silence();
    }

    document.addEventListener("click", unlock);
    document.addEventListener("keydown", event => {
      if (!event.repeat && (event.key === "Enter" || event.key === " ")) unlock();
    });
    window.addEventListener("pagehide", close);
    return { hit, setActive };
  };
})();
