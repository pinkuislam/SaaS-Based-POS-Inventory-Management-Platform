import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applySaleReturnStock } from "@/lib/sale-returns";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const existing = await prisma.saleReturn.findFirst({
    where: { id, tenantId, status: "DRAFT" },
    include: { items: true, sale: { include: { items: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await applySaleReturnStock(tx, existing.sale, existing, tenantId);
    await tx.saleReturn.update({
      where: { id },
      data: { status: "COMPLETED", refundStatus: "completed" },
    });
  });

  const updated = await prisma.saleReturn.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, sale: true },
  });

  return NextResponse.json(updated);
}
