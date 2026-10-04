(function () {
  "use strict";

  window.createSystemGraphTransitionSound = function (settings) {
    const volume = (value, fallback) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
    const windVolume = volume(settings.windVolume, 0.22);
    const popVolume = volume(settings.popVolume, 0.24);
    const voices = new Set();
    let audio = null, output = null, noise = null, wind = null;
    let popped = false;

    function release(voice) {
      if (!voices.delete(voice)) return;
      voice.nodes.forEach(node => node.disconnect());
      if (wind === voice) wind = null;
    }

    function stop() {
      voices.forEach(voice => {
        try { voice.source.stop(); } catch { /* Already ended. */ }
        release(voice);
      });
      if (audio && audio.state !== "closed") audio.close().catch(() => {});
      audio = output = noise = wind = null;
    }

    function track(source, nodes) {
      const voice = { source, nodes: [source, ...nodes] };
      voices.add(voice);
      source.onended = () => release(voice);
      return voice;
    }

    // Called inside the destination link click. Both sounds use this context so
    // the pop does not depend on autoplay permission in the next document.
    function start(milliseconds) {
      stop();
      popped = false;
      if (window.AOT_AUDIO?.enabled === false || settings.soundEnabled === false || (!windVolume && !popVolume) || document.hidden) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        audio = new AudioContext();
        const compressor = audio.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.1;
        output = compressor;
        output.connect(window.AOT_AUDIO?.output(audio) || audio.destination);
        if (audio.state === "suspended") audio.resume().catch(() => {});

        noise = audio.createBuffer(1, Math.ceil(audio.sampleRate * 2), audio.sampleRate);
        const samples = noise.getChannelData(0);
        let low = 0;
        for (let i = 0; i < samples.length; i++) {
          const white = Math.random() * 2 - 1;
          low = (low + 0.045 * white) / 1.045;
          samples[i] = low * 2.5 + white * 0.25;
        }
        if (!windVolume) return;
        const now = audio.currentTime;
        const duration = Math.max(0.3, milliseconds / 1000);
        const source = audio.createBufferSource();
        const highpass = audio.createBiquadFilter();
        const lowpass = audio.createBiquadFilter();
        const gain = audio.createGain();
        source.buffer = noise;
        source.loop = true;
        highpass.type = "highpass";
        highpass.frequency.value = 100;
        lowpass.type = "lowpass";
        lowpass.Q.value = 0.6;
        lowpass.frequency.setValueAtTime(400, now);
        lowpass.frequency.exponentialRampToValueAtTime(2400, now + duration * 0.8);
        lowpass.frequency.exponentialRampToValueAtTime(650, now + duration);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(windVolume * 0.2, now + duration * 0.12);
        gain.gain.linearRampToValueAtTime(windVolume, now + duration * 0.82);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(output);
        wind = track(source, [highpass, lowpass, gain]);
        source.start(now);
        source.stop(now + duration + 0.01);
      } catch {
        // The visual transition and navigation do not depend on audio support.
        stop();
      }
    }

    function pop() {
      if (popped || document.hidden || window.AOT_AUDIO?.enabled === false || !audio || audio.state !== "running" || !output) return 0;
      popped = true;
      if (wind) {
        try { wind.source.stop(); } catch { /* Wind has already faded. */ }
        if (wind) release(wind);
      }
      if (!popVolume) return 0;
      try {
        const now = audio.currentTime;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(780, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.075);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(popVolume, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
        oscillator.connect(gain);
        gain.connect(output);
        track(oscillator, [gain]);
        oscillator.start(now);
        oscillator.stop(now + 0.1);

        const click = audio.createBufferSource();
        const clickFilter = audio.createBiquadFilter();
        const clickGain = audio.createGain();
        click.buffer = noise;
        clickFilter.type = "highpass";
        clickFilter.frequency.value = 1600;
        clickGain.gain.setValueAtTime(popVolume * 0.3, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(output);
        track(click, [clickFilter, clickGain]);
        click.start(now);
        click.stop(now + 0.02);
        // Let the short pop reach the speakers before navigation unloads audio.
        const latency = (audio.baseLatency || 0) + (audio.outputLatency || 0);
        return Math.min(300, 140 + Math.max(0, latency) * 1000);
      } catch {
        stop();
        return 0;
      }
    }

    window.addEventListener("pagehide", stop);
    return { start, pop, stop };
  };
})();
