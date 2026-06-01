import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLowStockNotifications } from "@/lib/notifications";
import { syncDueNotifications } from "@/lib/due-notifications";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  await Promise.all([
    syncLowStockNotifications(tenantId),
    syncDueNotifications(tenantId),
  ]);

  const notifications = await prisma.notification.findMany({
    where: {
      tenantId,
      ...(type && type !== "all" ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await prisma.notification.count({
    where: { tenantId, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { markAllRead, id } = await request.json();
  const tenantId = session.user.tenantId;

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { tenantId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (id) {
    await prisma.notification.updateMany({
      where: { id, tenantId },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Notification id required" }, { status: 400 });
  }

  await prisma.notification.deleteMany({
    where: { id, tenantId: session.user.tenantId },
  });

  return NextResponse.json({ success: true });
}
