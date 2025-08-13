// gate.js — reads KDF/ALG from payload so it matches locked.enc
(() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const byId = (id) => document.getElementById(id);
  const msgEl = byId("msg");
  const pwEl  = byId("pw");

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function parseKdf(kdfStr) {
    // Supports formats like: "PBKDF2-SHA256-600000" or "PBKDF2-SHA-256-600000"
    const parts = kdfStr.split("-");
    // Find the last numeric segment as iterations
    const iter = parseInt(parts[parts.length - 1], 10);
    const hash = parts.slice(1, parts.length - 1).join("-").toUpperCase().replace("SHA-256","SHA-256");
    return { method: parts[0].toUpperCase(), hash: hash || "SHA-256", iterations: isFinite(iter) ? iter : 600000 };
  }

  async function deriveKeyPBKDF2(password, salt, hash, iterations, usages) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, usages
    );
  }

  async function loadPayload(path = "assets/content/locked.enc") {
    const res = await fetch("assets/content/locked.enc", { cache: "no-store" });
    if (!res.ok) throw new Error("Encrypted file not found.");
    return res.json();
  }

  function normalizePassword(p) {
  // Trim accidental spaces and normalize unicode to reduce layout mishaps
    return (p || "").trim().normalize("NFC");
  }

  async function unlock(evt) {
    evt?.preventDefault();
    msgEl.textContent = "Loading…";

    let payload;
    try {
      payload = await loadPayload("assets/content/locked.enc");
    } catch (e) {
      console.error(e);
      msgEl.textContent = "Could not load locked.enc (check the path / 404).";
      return;
    }

    try {
      const pwd = normalizePassword(pwEl.value);
      if (!pwd) { msgEl.textContent = "Enter a password."; return; }

      const salt = b64ToBytes(payload.salt);
      const iv   = b64ToBytes(payload.iv);
      const ct   = b64ToBytes(payload.ct);

      // Read algorithm/KDF from the payload
      const alg = (payload.alg || "AES-GCM").toUpperCase();
      if (alg !== "AES-GCM") throw new Error("Unsupported algorithm in payload.");

      const { method, hash, iterations } = parseKdf(payload.kdf || "PBKDF2-SHA-256-600000");

      let key;
      if (method === "PBKDF2") {
        key = await deriveKeyPBKDF2(pwd, salt, hash.replace("SHA256","SHA-256"), iterations, ["decrypt"]);
      } else {
        throw new Error("Unsupported KDF method in payload.");
      }

      const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      const html = dec.decode(plainBuf);

      document.open();
      document.write(html);
      document.close();
    } catch (e) {
      console.error(e);
      msgEl.textContent = "Wrong password or corrupted data.";
    }
  }

  document.getElementById("unlock-form").addEventListener("submit", unlock);
})();
