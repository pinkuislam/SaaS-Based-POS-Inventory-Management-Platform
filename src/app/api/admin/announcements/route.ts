import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const items = await prisma.platformAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { title, content, status = "draft", targetType = "all", targetIds, scheduledAt } =
    body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  const item = await prisma.platformAnnouncement.create({
    data: {
      title,
      content,
      status,
      targetType,
      targetIds: targetIds ?? undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
