"use client";

/**
 * next-auth/react sets `__NEXTAUTH` at module load via parseUrl(process.env.NEXTAUTH_URL).
 * That env var is often missing in the browser bundle, which makes `.path` undefined and
 * crashes on `.replace()`. This file must be imported before any `next-auth/react` import.
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

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = authOrigin;
}
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = authOrigin;
}
