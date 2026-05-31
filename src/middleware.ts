import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { getTenantSlugFromHost } from "@/lib/tenant-host";
import {
  getTenantSlugFromPath,
  isLegacyDashboardPath,
  isTenantPanelPath,
  isTenantRootPath,
  legacyDashboardToTenantPath,
  tenantDashboardPath,
  tenantHomePath,
} from "@/lib/tenant-path";
import { canAccessRoute } from "@/lib/route-permissions";
import { toLegacyDashboardPath } from "@/lib/tenant-path";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;
  const host = req.headers.get("host") || "";
  const hostTenantSlug = getTenantSlugFromHost(host);
  const pathTenantSlug = getTenantSlugFromPath(pathname);
  const userType = session?.user?.userType;
  const sessionTenantSlug = session?.user?.tenantSlug as string | undefined;
  const effectiveTenantSlug =
    pathTenantSlug || hostTenantSlug || sessionTenantSlug || null;

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (isTenantRootPath(pathname) && pathTenantSlug) {
    return NextResponse.redirect(new URL(tenantHomePath(pathTenantSlug), req.url));
  }

  if (isLegacyDashboardPath(pathname)) {
    const slug = sessionTenantSlug || hostTenantSlug || pathTenantSlug;
    if (slug) {
      return NextResponse.redirect(
        new URL(legacyDashboardToTenantPath(pathname, slug), req.url)
      );
    }
  }

  const response = NextResponse.next();

  if (effectiveTenantSlug) {
    response.cookies.set("tenant-slug", effectiveTenantSlug, {
      path: "/",
      sameSite: "lax",
    });
  } else {
    response.cookies.delete("tenant-slug");
  }

  const isAdminRoute =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isTenantPanelRoute = isTenantPanelPath(pathname);
  const isAdminLogin = pathname === "/admin/login";
  const isTenantLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const isTenantAuthRoute = isTenantLogin || isRegister;

  const tenantHome = sessionTenantSlug
    ? tenantHomePath(sessionTenantSlug)
    : "/login";

  if (isLoggedIn) {
    if (userType === "SUPER_ADMIN") {
      if (
        isTenantAuthRoute ||
        isTenantPanelRoute ||
        isLegacyDashboardPath(pathname)
      ) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    } else if (userType === "TENANT") {
      if (isAdminLogin || isAdminRoute) {
        return NextResponse.redirect(new URL(tenantHome, req.url));
      }
      if (isTenantAuthRoute) {
        return NextResponse.redirect(new URL(tenantHome, req.url));
      }
      if (
        pathTenantSlug &&
        sessionTenantSlug &&
        pathTenantSlug !== sessionTenantSlug
      ) {
        return NextResponse.redirect(
          new URL("/login?error=wrong-tenant", req.url)
        );
      }
    }
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (userType !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(tenantHome, req.url));
    }
  }

  if (isTenantPanelRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      if (pathTenantSlug) loginUrl.searchParams.set("tenant", pathTenantSlug);
      else if (hostTenantSlug) loginUrl.searchParams.set("tenant", hostTenantSlug);
      return NextResponse.redirect(loginUrl);
    }
    if (userType === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (
      hostTenantSlug &&
      sessionTenantSlug &&
      sessionTenantSlug !== hostTenantSlug
    ) {
      return NextResponse.redirect(
        new URL("/login?error=wrong-tenant", req.url)
      );
    }

    const legacyPath = toLegacyDashboardPath(pathname);
    if (
      !canAccessRoute(
        legacyPath,
        session?.user?.permissions as string[] | undefined
      )
    ) {
      const denied = new URL(tenantHomePath(sessionTenantSlug!), "");
      denied.searchParams.set("error", "forbidden");
      return NextResponse.redirect(denied);
    }
  }

  return response;
});

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/:tenant",
    "/:tenant/:path*",
    "/login",
    "/register",
  ],
};
