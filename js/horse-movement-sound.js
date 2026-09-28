(function () {
  "use strict";

  window.createHorseMovementSound = function (settings) {
    const volume = Math.max(0, Math.min(1, settings.volume ?? .12));
    // A minor pentatonic palette keeps overlapping notes gentle and consonant.
    const pitches = [220, 261.63, 293.66, 329.63, 392];
    const voices = new Set();
    let audio = null, output = null, tones = [], active = false;
    let lastNoteAt = -Infinity, previousPitch = null;

    function release(voice) {
      if (!voices.delete(voice)) return;
      voice.source.disconnect();
      voice.gain.disconnect();
    }

    function silence(fade = .04) {
      voices.forEach(voice => {
        try {
          if (!fade) {
            voice.source.stop();
            release(voice);
          } else if (!voice.fading) {
            voice.fading = true;
            const now = audio.currentTime;
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime(0, now + fade);
            voice.source.stop(now + fade + .005);
          }
        } catch { release(voice); }
      });
      lastNoteAt = -Infinity;
    }

    function close() {
      silence(0);
      if (audio && audio.state !== "closed") audio.close().catch(() => {});
      audio = output = null;
      tones = [];
    }

    // Audio begins after a click, tap, or keyboard activation. The star control
    // and visibility checks continue to pause both movement and its soundtrack.
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
          tones = pitches.map(frequency => {
            const duration = .5;
            const tone = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
            const samples = tone.getChannelData(0);
            for (let index = 0; index < samples.length; index++) {
              const t = index / audio.sampleRate;
              const attack = Math.sin(Math.min(1, t / .035) * Math.PI / 2) ** 2;
              const tail = Math.min(1, (duration - t) / .06);
              const envelope = attack * Math.exp(-Math.max(0, t - .035) * 7) * tail * tail;
              // Rounded sine tones with a faint octave, without an impact/noise layer.
              samples[index] = envelope * (
                .82 * Math.sin(2 * Math.PI * frequency * t)
                + .1 * Math.sin(4 * Math.PI * frequency * t) * Math.exp(-t * 8)
              );
            }
            return tone;
          });
        }
        if (audio.state === "suspended") audio.resume().catch(() => {});
      } catch { close(); }
    }

    function note(speed, position, delay = 0) {
      if (!active || document.hidden || !audio || audio.state !== "running" || !tones.length) return;
      const at = audio.currentTime + Math.max(0, Math.min(.05, delay));
      // Even a dash stays sparse: at most one soft note per quarter second.
      if (at - lastNoteAt < .24) return;
      try {
        const target = Math.round(Math.max(0, Math.min(1, position)) * (pitches.length - 1));
        previousPitch = previousPitch === null ? target
          : previousPitch + Math.sign(target - previousPitch);
        const source = audio.createBufferSource();
        const gain = audio.createGain();
        source.buffer = tones[previousPitch];
        gain.gain.value = .45 + Math.min(1, speed / 245) * .15;
        source.connect(gain);
        gain.connect(output);
        const voice = { source, gain, fading: false };
        voices.add(voice);
        source.onended = () => release(voice);
        source.start(at);
        lastNoteAt = at;
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
    return { note, setActive, rest() { silence(.12); } };
  };
})();
