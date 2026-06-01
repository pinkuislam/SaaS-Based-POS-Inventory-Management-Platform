import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const restored = await prisma.product.update({
    where: { id },
    data: { deletedAt: null, status: "ACTIVE" },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "restore",
    module: "products",
    details: `Restored product ${restored.name}`,
  });

  return NextResponse.json({ success: true, product: restored });
}
