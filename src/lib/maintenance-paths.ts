/** Paths that stay available while maintenance mode is on (edge-safe, no Prisma). */
export function isMaintenanceBypassPath(pathname: string): boolean {
  if (
    pathname === "/maintenance" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/public/maintenance"
  ) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return true;
  }
  return false;
}
