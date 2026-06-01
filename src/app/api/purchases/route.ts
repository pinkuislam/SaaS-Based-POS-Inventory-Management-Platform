import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const supplierId = searchParams.get("supplierId");
  const branchId = searchParams.get("branchId");

  const purchases = await prisma.purchase.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as never } : {}),
      ...(paymentStatus ? { paymentStatus: paymentStatus as never } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(branchId ? { branchId } : {}),
    },
    orderBy: { purchaseDate: "desc" },
    take: 200,
    include: {
      supplier: true,
      user: true,
      branch: true,
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
    shippingCost,
    total,
    paidAmount,
    notes,
    branchId,
    supplierInvoiceNo,
    purchaseDate,
    paymentMethod,
    status: purchaseStatus,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "No items in purchase" }, { status: 400 });
  }

  const isDraft = purchaseStatus === "DRAFT";
  const purchaseCount = await prisma.purchase.count({ where: { tenantId } });
  const invoiceNo = generateInvoiceNo("PUR", purchaseCount + 1);
  const paid = paidAmount ?? 0;
  const dueAmount = Math.max(0, total - paid);
  const paymentStatus =
    isDraft ? "DUE" : dueAmount <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE";

  const purchase = await prisma.$transaction(async (tx) => {
    const newPurchase = await tx.purchase.create({
      data: {
        tenantId,
        branchId: branchId || session.user.branchId,
        supplierId: supplierId || null,
        userId: session.user.id,
        invoiceNo,
        supplierInvoiceNo: supplierInvoiceNo?.trim() || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        shippingCost: shippingCost || 0,
        total,
        paidAmount: paid,
        dueAmount,
        paymentMethod: paymentMethod || "cash",
        paymentStatus,
        status: isDraft ? "DRAFT" : "COMPLETED",
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

    if (!isDraft) {
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
            userId: session.user.id,
            type: "PURCHASE",
            quantity: item.quantity,
            reference: invoiceNo,
            status: "APPROVED",
          },
        });
      }
    }

    return newPurchase;
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: isDraft ? "create_purchase_draft" : "create_purchase",
    module: "purchases",
    details: `Purchase ${invoiceNo}`,
  });

  return NextResponse.json(purchase);
}
