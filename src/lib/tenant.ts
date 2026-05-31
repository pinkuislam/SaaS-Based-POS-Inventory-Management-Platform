import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

export async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    redirect("/login?type=admin");
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
