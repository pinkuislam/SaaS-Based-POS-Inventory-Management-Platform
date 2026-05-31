import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const title =
    typeof body.title === "string" ? body.title.trim() : undefined;
  const message =
    typeof body.message === "string" ? body.message.trim() : undefined;
  const sendNow = body.sendNow === true;

  const existing = await prisma.platformBroadcast.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "sent" && sendNow) {
    return NextResponse.json(
      { error: "This notification was already sent" },
      { status: 400 }
    );
  }

  const nextTitle = title ?? existing.title;
  const nextMessage = message ?? existing.message;

  if (!nextTitle || !nextMessage) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    );
  }

  const updateData: {
    title: string;
    message: string;
    status?: string;
    sentAt?: Date;
  } = {
    title: nextTitle,
    message: nextMessage,
  };

  if (sendNow && existing.status !== "sent") {
    const tenants = await prisma.tenant.findMany({
      where: { status: "ACTIVE", deletedAt: null },
    });
    if (tenants.length > 0) {
      await prisma.notification.createMany({
        data: tenants.map((t) => ({
          tenantId: t.id,
          type: "announcement",
          title: nextTitle,
          message: nextMessage,
          link: null,
        })),
      });
    }
    updateData.status = "sent";
    updateData.sentAt = new Date();
  }

  try {
    const item = await prisma.platformBroadcast.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("[broadcast PATCH]", e);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.platformBroadcast.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
