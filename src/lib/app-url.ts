/** Stable app origin for SSR and client (avoids hydration mismatch from window). */
export function getPublicAppOrigin(): string {
  const url =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  return url.replace(/\/$/, "");
}

export function absoluteAppPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = getPublicAppOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}
