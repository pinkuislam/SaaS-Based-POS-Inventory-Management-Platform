import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { isAdminIpAllowed } from "@/lib/admin/ip-restrict";
import { createImpersonationToken } from "@/lib/admin/impersonation";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  if (!(await isAdminIpAllowed(request))) {
    return NextResponse.json({ error: "IP not allowed" }, { status: 403 });
  }

  const { id: tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  if (tenant.loginBlocked) {
    return NextResponse.json({ error: "Tenant login is blocked" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { tenantId, userType: "TENANT", isActive: true },
    orderBy: { createdAt: "asc" },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "No active tenant user found" }, { status: 404 });
  }

  const token = createImpersonationToken({
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || "Admin",
  });

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "IMPERSONATE",
    module: "tenants",
    details: `Impersonating ${user.email} @ ${tenant.slug}`,
    metadata: { tenantId, userId: user.id },
  });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.json({
    url: `${base}/api/auth/impersonate?token=${encodeURIComponent(token)}`,
  });
}
