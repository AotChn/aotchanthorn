import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../js/audio-preferences.js", import.meta.url), "utf8");
const script = name => readFileSync(new URL("../js/" + name, import.meta.url), "utf8");
function target() {
  const listeners = new Map();
  return {
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    emit(name, event = {}) { listeners.get(name)?.forEach(callback => callback(event)); }
  };
}
function media(muted = false) {
  return { ...target(), muted, volume: .35, matches: () => true };
}
function context() {
  const audio = { ...target(), currentTime: 3, state: "running", destination: {}, gains: [] };
  audio.createGain = () => {
    const gain = { gain: { value: 1, cancelScheduledValues() {}, setValueAtTime(value) { this.value = value; } },
      connect(destination) { this.destination = destination; } };
    audio.gains.push(gain);
    return gain;
  };
  return audio;
}
function page({ saved, storage = new Map(saved ? [["aot:sound", saved]] : []), blocked = false, elements = [] } = {}) {
  const window = target();
  const document = { ...target(), querySelectorAll: () => elements, hidden: false };
  const localStorage = {
    getItem(key) { if (blocked) throw Error("blocked"); return storage.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw Error("blocked"); storage.set(key, value); }
  };
  const sandbox = { window, document, localStorage };
  runInNewContext(source, sandbox);
  return { api: window.AOT_AUDIO, window, document, storage, sandbox, elements };
}

test("saved mute gates new and already-playing Web Audio outputs, preserving their levels", () => {
  const { api } = page({ saved: "off" });
  const audio = context();
  const gate = api.output(audio);
  assert.equal(gate.gain.value, 0);
  assert.equal(gate.destination, audio.destination);
  assert.equal(api.output(audio), gate);
  api.setEnabled(true);
  assert.equal(gate.gain.value, 1);
  api.setEnabled(false);
  assert.equal(gate.gain.value, 0);
  audio.state = "closed";
  audio.emit("statechange");
  gate.gain.setValueAtTime = () => assert.fail("A closed context must be released");
  api.setEnabled(true);
});

test("mute persists between pages and follows cross-tab and back/forward changes", () => {
  const first = page();
  first.api.setEnabled(false);
  const second = page({ storage: first.storage });
  assert.equal(second.api.enabled, false);
  first.api.setEnabled(true);
  second.window.emit("storage", { key: "aot:sound" });
  assert.equal(second.api.enabled, true);
  first.api.setEnabled(false);
  second.window.emit("pageshow");
  assert.equal(second.api.enabled, false);
  first.storage.clear();
  second.window.emit("storage", { key: null });
  assert.equal(second.api.enabled, true);
});

test("site mute restores individual media choices and handles new popup videos and detached ambience", () => {
  const video = media(), individuallyMuted = media(true), birds = media();
  const p = page({ elements: [video, individuallyMuted] });
  p.api.trackMedia(birds, true);
  p.api.setEnabled(false);
  assert(video.muted && individuallyMuted.muted && birds.muted);
  const popup = media();
  p.api.trackMedia(popup);
  p.elements.push(popup);
  assert.equal(popup.muted, true);
  popup.muted = false;
  popup.emit("volumechange");
  assert.equal(popup.muted, true);
  p.api.setEnabled(true);
  assert.equal(video.muted, false);
  assert.equal(popup.muted, false);
  assert.equal(birds.muted, false);
  assert.equal(individuallyMuted.muted, true);
  assert.equal(video.volume, .35);
});

test("static and newly played media are muted before playback, even with blocked storage", () => {
  const p = page({ blocked: true });
  p.api.setEnabled(false);
  const video = media();
  p.elements.push(video);
  p.document.emit("DOMContentLoaded");
  assert.equal(video.muted, true);
  const later = media();
  p.document.emit("play", { target: later });
  assert.equal(later.muted, true);
  p.window.emit("pageshow");
  assert.equal(p.api.enabled, false);
  p.api.setEnabled(true);
  assert.equal(video.muted, false);
});

test("muted graph, typing, transition and horse effects do not open audio devices", () => {
  const p = page({ saved: "off" });
  let contextsCreated = 0;
  p.window.AudioContext = function () { contextsCreated++; };
  p.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  p.sandbox.setTimeout = () => 1;
  p.sandbox.clearTimeout = () => {};
  for (const file of ["system-graph-hit-sound.js", "system-graph-notes.js", "system-graph-transition-sound.js", "horse-movement-sound.js"]) {
    runInNewContext(script(file), p.sandbox);
  }
  const hit = p.window.createSystemGraphHitSound({}, { nodes: [{ id: "test" }] });
  hit.setActive(true);
  hit.unlock();
  hit.hit({ id: "test" });
  const wind = p.window.createSystemGraphTransitionSound({});
  wind.start(1000);
  assert.equal(wind.pop(), 0);
  const text = {};
  const writer = p.window.createSystemGraphTypewriter({}, {}, { text, caret: {} });
  writer.show("Still visible while muted");
  writer.finish();
  assert.equal(text.textContent, "Still visible while muted");
  const horse = p.window.createHorseMovementSound({});
  horse.setActive(true);
  horse.update(100, 2);
  p.document.emit("click");
  assert.equal(contextsCreated, 0);
});

test("Contact ambience pauses on mute and resumes on unmute without changing its level", () => {
  const p = page({ saved: "off" });
  p.document.documentElement = { classList: { contains: () => false } };
  const birds = media();
  birds.paused = true;
  birds.play = () => { birds.paused = false; return Promise.resolve(); };
  birds.pause = () => { birds.paused = true; };
  p.sandbox.Audio = function () { return birds; };
  p.sandbox.MutationObserver = class { observe() {} };
  runInNewContext(script("contact-ambience.js"), p.sandbox);
  assert.equal(birds.paused, true);
  assert.equal(birds.muted, true);
  p.api.setEnabled(true);
  assert.equal(birds.paused, false);
  assert.equal(birds.muted, false);
  assert.equal(birds.volume, .85);
  p.api.setEnabled(false);
  assert.equal(birds.paused, true);
  assert.equal(birds.muted, true);
});
