// One-shot toast that survives a full page load (sessionStorage). Used after
// sign-in/up/out, which hard-navigate so no stale signed-in/out view lingers
// in the client router cache or in routes kept mounted by Activity.

const KEY = "mc_flash";
const TYPES = ["success", "warning", "error"] as const;

export type Flash = { type: (typeof TYPES)[number]; message: string };

export function setFlash(flash: Flash) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(flash));
  } catch {
    // Storage blocked (private mode): the toast is a nicety, skip it.
  }
}

export function takeFlash(): Flash | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const value = JSON.parse(raw) as Partial<Flash>;
    return TYPES.includes(value.type as Flash["type"]) && typeof value.message === "string"
      ? (value as Flash)
      : null;
  } catch {
    return null;
  }
}

/**
 * Validates a ?next= return path: same-origin paths only, so it can't be
 * used as an open redirect ("//evil.com", "/\\evil.com", "https://…").
 */
export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/";
  try {
    // Parse like the browser will (it strips tabs/newlines, so "/\t/evil.com"
    // would become "//evil.com"), then require the same origin.
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    if (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up")) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

/** Full page load to `path` with a toast shown after it loads. */
export function navigateWithFlash(path: string, flash: Flash) {
  setFlash(flash);
  window.location.assign(path);
}
