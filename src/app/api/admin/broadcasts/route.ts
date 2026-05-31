import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const items = await prisma.platformBroadcast.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    title,
    message,
    channel = "system",
    targetType = "all",
    targetIds,
    sendNow = false,
  } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "title and message required" }, { status: 400 });
  }

  const broadcast = await prisma.platformBroadcast.create({
    data: {
      title,
      message,
      channel,
      targetType,
      targetIds: targetIds ?? undefined,
      status: sendNow ? "sent" : "draft",
      sentAt: sendNow ? new Date() : null,
    },
  });

  if (sendNow) {
    const tenants = await resolveTenantTargets(targetType, targetIds);
    if (tenants.length > 0) {
      await prisma.notification.createMany({
        data: tenants.map((t) => ({
          tenantId: t.id,
          type: "announcement",
          title,
          message,
          link: null,
        })),
      });
    }
  }

  return NextResponse.json(broadcast, { status: 201 });
}

async function resolveTenantTargets(
  targetType: string,
  targetIds?: string[] | null
) {
  if (targetType === "selected" && targetIds?.length) {
    return prisma.tenant.findMany({
      where: { id: { in: targetIds }, status: "ACTIVE", deletedAt: null },
    });
  }
  if (targetType === "package" && targetIds?.length) {
    return prisma.tenant.findMany({
      where: {
        packageId: { in: targetIds },
        status: "ACTIVE",
        deletedAt: null,
      },
    });
  }
  return prisma.tenant.findMany({
    where: { status: "ACTIVE", deletedAt: null },
  });
}
