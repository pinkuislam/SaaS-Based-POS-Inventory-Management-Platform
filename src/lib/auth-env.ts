"use client";

/**
 * next-auth/react sets `__NEXTAUTH` at module load via parseUrl(process.env.NEXTAUTH_URL).
 * If that URL is missing or points at the wrong port (e.g. .env says :3000 but dev runs on :3001),
 * session fetch hangs and the UI shows endless loading.
 * Import this module before any `next-auth/react` import.
 */
function resolveAuthOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

const authOrigin = resolveAuthOrigin();

if (typeof window !== "undefined") {
  // Always match the browser host/port (dev server may not be on :3000)
  process.env.NEXTAUTH_URL = authOrigin;
  process.env.AUTH_URL = authOrigin;
} else {
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = authOrigin;
  }
  if (!process.env.AUTH_URL) {
    process.env.AUTH_URL = authOrigin;
  }
}
