import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLowStockNotifications } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  await syncLowStockNotifications(tenantId);

  const notifications = await prisma.notification.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
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
