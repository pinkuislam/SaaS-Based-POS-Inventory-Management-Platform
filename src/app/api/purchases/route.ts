import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const purchases = await prisma.purchase.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    orderBy: { purchaseDate: "desc" },
    take: 100,
    include: {
      supplier: true,
      user: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(purchases);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const body = await request.json();
  const {
    items,
    supplierId,
    subtotal,
    discount,
    tax,
    total,
    paidAmount,
    notes,
    branchId,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "No items in purchase" }, { status: 400 });
  }

  const purchaseCount = await prisma.purchase.count({ where: { tenantId } });
  const invoiceNo = generateInvoiceNo("PUR", purchaseCount + 1);
  const paid = paidAmount ?? 0;
  const dueAmount = Math.max(0, total - paid);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE";

  const purchase = await prisma.$transaction(async (tx) => {
    const newPurchase = await tx.purchase.create({
      data: {
        tenantId,
        branchId: branchId || session.user.branchId,
        supplierId: supplierId || null,
        userId: session.user.id,
        invoiceNo,
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        paidAmount: paid,
        dueAmount,
        paymentStatus,
        notes,
        items: {
          create: items.map(
            (item: {
              productId: string;
              quantity: number;
              unitPrice: number;
              discount: number;
              tax: number;
              total: number;
            }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              tax: item.tax || 0,
              total: item.total,
            })
          ),
        },
      },
      include: { items: true, supplier: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: { increment: item.quantity },
          purchasePrice: item.unitPrice,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: branchId || session.user.branchId,
          productId: item.productId,
          type: "PURCHASE",
          quantity: item.quantity,
          reference: invoiceNo,
        },
      });
    }

    return newPurchase;
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "create_purchase",
    module: "purchases",
    details: `Purchase ${invoiceNo}`,
  });

  return NextResponse.json(purchase);
}
