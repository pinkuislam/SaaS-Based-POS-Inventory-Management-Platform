import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { applySaleReturnStock } from "@/lib/sale-returns";

export async function GET(request: Request) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  const returns = await prisma.saleReturn.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as never } : {}),
      ...(customerId ? { customerId } : {}),
    },
    orderBy: { returnDate: "desc" },
    take: 100,
    include: {
      sale: { select: { invoiceNo: true } },
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  return NextResponse.json(returns);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const {
    saleId,
    items,
    reason,
    notes,
    refundAmount,
    status: returnStatus,
    requireApproval,
  } = body;

  if (!saleId || !items?.length) {
    return NextResponse.json(
      { error: "Sale and items required" },
      { status: 400 }
    );
  }

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, tenantId },
    include: { items: true },
  });
  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }
  if (sale.status === "HELD" || sale.status === "CANCELLED") {
    return NextResponse.json({ error: "Invalid sale status" }, { status: 400 });
  }

  const count = await prisma.saleReturn.count({ where: { tenantId } });
  const returnNo = generateInvoiceNo("SRET", count + 1);
  const isDraft = returnStatus === "DRAFT";
  const needsApproval = requireApproval === true;
  const status = isDraft ? "DRAFT" : needsApproval ? "PENDING" : "COMPLETED";

  const totalRefund =
    refundAmount ??
    items.reduce(
      (s: number, i: { refundAmount?: number }) => s + (i.refundAmount || 0),
      0
    );

  const result = await prisma.$transaction(async (tx) => {
    const saleReturn = await tx.saleReturn.create({
      data: {
        tenantId,
        saleId,
        customerId: sale.customerId,
        returnNo,
        status,
        refundAmount: totalRefund,
        refundStatus: status === "COMPLETED" ? "completed" : "pending",
        reason: reason || null,
        notes: notes || null,
        items: {
          create: items.map(
            (item: {
              saleItemId?: string;
              productId?: string;
              quantity: number;
              refundAmount?: number;
              reason?: string;
            }) => {
              const si = sale.items.find(
                (p) =>
                  p.id === item.saleItemId || p.productId === item.productId
              );
              if (!si) throw new Error("Invalid return item");
              return {
                saleItemId: si.id,
                productId: si.productId,
                quantity: item.quantity,
                refundAmount: item.refundAmount || 0,
                reason: item.reason || null,
              };
            }
          ),
        },
      },
      include: { items: true },
    });

    if (status === "COMPLETED") {
      await applySaleReturnStock(tx, sale, saleReturn, tenantId);
    }

    return saleReturn;
  });

  return NextResponse.json(result);
}
