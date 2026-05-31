import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { verifyImpersonationToken } from "@/lib/admin/impersonation";
import { tenantHomePath } from "@/lib/tenant-path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const payload = verifyImpersonationToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL("/admin/login?error=impersonation_expired", request.url)
    );
  }

  try {
    await signIn("credentials", {
      loginType: "impersonate",
      impersonateToken: token,
      email: "",
      password: "",
      tenantSlug: payload.tenantSlug,
      redirect: false,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?error=impersonation_failed", request.url)
    );
  }

  return NextResponse.redirect(new URL(tenantHomePath(payload.tenantSlug), request.url));
}
