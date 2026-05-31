/** Reserved first path segments — not tenant slugs. */
const RESERVED_SEGMENTS = new Set([
  "admin",
  "login",
  "register",
  "api",
  "maintenance",
  "forgot-password",
  "reset-password",
  "_next",
]);

/** Dashboard home: `/demo-shop/dashboard` */
export function tenantHomePath(tenantSlug: string): string {
  return `/${tenantSlug}/dashboard`;
}

/**
 * Tenant panel URLs.
 * - Home: `/{slug}/dashboard`
 * - Other pages: `/{slug}/pos`, `/{slug}/products`, …
 */
export function tenantDashboardPath(
  tenantSlug: string,
  subpath = ""
): string {
  if (!subpath || subpath === "/") return tenantHomePath(tenantSlug);
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `/${tenantSlug}${normalized}`;
}

/** Extract tenant slug from `/{slug}/...` */
export function getTenantSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  const slug = match[1].toLowerCase();
  if (RESERVED_SEGMENTS.has(slug)) return null;
  return slug;
}

export function isTenantPanelPath(pathname: string): boolean {
  return getTenantSlugFromPath(pathname) !== null;
}

/** @deprecated alias */
export const isTenantDashboardPath = isTenantPanelPath;

/** `/{slug}` only — redirect to dashboard home */
export function isTenantRootPath(pathname: string): boolean {
  const slug = getTenantSlugFromPath(pathname);
  if (!slug) return false;
  return pathname === `/${slug}` || pathname === `/${slug}/`;
}

/** Map tenant URLs → `/dashboard/...` for permission rules */
export function toLegacyDashboardPath(pathname: string): string {
  const slug = getTenantSlugFromPath(pathname);
  if (!slug) return pathname;

  const rest = pathname.slice(`/${slug}`.length);
  if (!rest || rest === "/") return "/dashboard";
  if (rest === "/dashboard" || rest === "/dashboard/") return "/dashboard";
  if (rest.startsWith("/dashboard/")) {
    return `/dashboard${rest.slice("/dashboard".length)}`;
  }
  return `/dashboard${rest}`;
}

/** Legacy `/dashboard` or `/{slug}/dashboard/...` (not canonical home) */
export function isLegacyDashboardPath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }
  return /^\/[^/]+\/dashboard\/.+/.test(pathname);
}

export function legacyDashboardToTenantPath(
  pathname: string,
  tenantSlug: string
): string {
  if (pathname === "/dashboard") return tenantHomePath(tenantSlug);
  if (pathname.startsWith("/dashboard/")) {
    return tenantDashboardPath(tenantSlug, pathname.slice("/dashboard".length));
  }
  const nested = pathname.match(/^\/[^/]+\/dashboard(\/.*)?$/);
  if (nested) {
    const sub = nested[1] || "";
    if (!sub || sub === "/") return tenantHomePath(tenantSlug);
    return tenantDashboardPath(tenantSlug, sub);
  }
  return pathname;
}
