(function () {
  "use strict";

  window.createHorseMovementSound = function (settings) {
    const volume = Math.max(0, Math.min(1, settings.volume ?? .5));
    const voices = new Set();
    let audio = null, recording = null, loading = null, voice = null;
    let active = false, speed = 0, stridesPerSecond = 0;

    function release(current) {
      if (!voices.delete(current)) return;
      current.source.disconnect();
      current.gain.disconnect();
    }

    function silence(fade = .12) {
      voice = null;
      voices.forEach(current => {
        try {
          if (!fade) {
            current.source.stop();
            release(current);
          } else if (!current.fading) {
            current.fading = true;
            const now = audio.currentTime;
            const gain = current.gain.gain;
            gain.cancelScheduledValues(now);
            gain.setValueAtTime(gain.value, now);
            gain.linearRampToValueAtTime(0, now + fade);
            current.source.stop(now + fade + .005);
          }
        } catch { release(current); }
      });
    }

    function close() {
      active = false;
      silence(0);
      loading?.controller.abort();
      loading = null;
      if (audio && audio.state !== "closed") audio.close().catch(() => {});
      audio = null;
    }

    function syncPlayback() {
      if (!active || document.hidden || speed <= 3 || !audio || audio.state !== "running") {
        silence();
        return;
      }
      if (!recording) return;
      try {
        // Match the recording's gallop cadence to the sprite's actual strides.
        const rate = Math.max(.4, Math.min(1.6, stridesPerSecond / (settings.recordedStridesPerSecond || 2)));
        const level = volume * Math.min(1, speed / 24);
        const now = audio.currentTime;
        if (!voice) {
          const source = audio.createBufferSource();
          const gain = audio.createGain();
          source.buffer = recording;
          source.loop = true;
          source.loopStart = Math.max(0, Math.min(settings.loopStart || 0, recording.duration - .01));
          source.loopEnd = Math.max(source.loopStart + .01, Math.min(settings.loopEnd || recording.duration, recording.duration));
          source.playbackRate.value = rate;
          gain.gain.value = 0;
          source.connect(gain);
          gain.connect(audio.destination);
          const current = { source, gain, fading: false };
          voice = current;
          voices.add(current);
          source.onended = () => {
            if (voice === current) voice = null;
            release(current);
          };
          source.start(now, source.loopStart);
        }
        // Smooth changes while accelerating or braking, without restarting the clip.
        if (voice.rate === undefined || Math.abs(voice.rate - rate) > .01) {
          voice.source.playbackRate.setTargetAtTime(rate, now, .06);
          voice.rate = rate;
        }
        if (voice.level === undefined || Math.abs(voice.level - level) > .005) {
          voice.gain.gain.setTargetAtTime(level, now, .04);
          voice.level = level;
        }
      } catch { silence(); }
    }

    function loadRecording(context) {
      if (recording || loading) return;
      const request = { controller: new AbortController() };
      loading = request;
      fetch(settings.src, { signal: request.controller.signal })
        .then(response => {
          if (!response.ok) throw new Error("Horse recording unavailable");
          return response.arrayBuffer();
        })
        .then(bytes => context.decodeAudioData(bytes))
        .then(buffer => {
          // A completed request must not restart sound after leaving the page.
          if (audio !== context || loading !== request) return;
          recording = buffer;
          syncPlayback();
        })
        .catch(() => {})
        .finally(() => { if (loading === request) loading = null; });
    }

    // Browsers require a click, tap, or keyboard activation before audio plays.
    function unlock() {
      if (!active || document.hidden || settings.enabled === false || !volume) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!audio || audio.state === "closed") audio = new AudioContext();
        loadRecording(audio);
        if (audio.state === "suspended") audio.resume().then(syncPlayback).catch(() => {});
        else syncPlayback();
      } catch { close(); }
    }

    function update(nextSpeed, cadence) {
      speed = Math.max(0, nextSpeed);
      stridesPerSecond = Math.max(0, cadence);
      syncPlayback();
    }

    function setActive(value) {
      active = value;
      if (!active) silence(.04);
      else syncPlayback();
    }

    document.addEventListener("click", unlock);
    document.addEventListener("keydown", event => {
      if (!event.repeat && (event.key === "Enter" || event.key === " ")) unlock();
    });
    window.addEventListener("pagehide", close);
    return { update, setActive, rest() { speed = stridesPerSecond = 0; silence(); } };
  };
})();
