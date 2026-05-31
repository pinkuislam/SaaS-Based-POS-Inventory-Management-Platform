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

  if (body.status === "published" && !body.publishedAt) {
    body.publishedAt = new Date();
  }
  if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);

  const item = await prisma.platformAnnouncement.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.platformAnnouncement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
