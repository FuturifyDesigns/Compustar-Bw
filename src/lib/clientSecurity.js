/** Soft client-side cooldown to reduce accidental/spam submits. Server still enforces limits. */
export function assertClientCooldown(key, waitMs = 45_000) {
  try {
    const storageKey = `compustar-cooldown:${key}`;
    const last = Number(localStorage.getItem(storageKey) || 0);
    const now = Date.now();
    if (last && now - last < waitMs) {
      const seconds = Math.ceil((waitMs - (now - last)) / 1000);
      return { ok: false, error: `Please wait ${seconds}s before trying again.` };
    }
    localStorage.setItem(storageKey, String(now));
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
