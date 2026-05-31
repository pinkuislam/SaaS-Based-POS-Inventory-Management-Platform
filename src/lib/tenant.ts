import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { tenantDashboardPath } from "@/lib/tenant-path";

export async function getTenantSession() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }
  return session;
}

export async function getTenantId() {
  const session = await getTenantSession();
  return session.user.tenantId!;
}

export async function getTenantSlug() {
  const session = await getTenantSession();
  const slug = session.user.tenantSlug;
  if (!slug) redirect("/login");
  return slug;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    redirect("/admin/login");
  }
  return session;
}

export async function getTenantWithSubscription(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      package: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });
}

/** Redirect helper after login or when slug is known */
export function redirectToTenantDashboard(tenantSlug: string, subpath = "") {
  redirect(tenantDashboardPath(tenantSlug, subpath));
}
