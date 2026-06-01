import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId: authResult.session.user.tenantId! },
    include: {
      supplier: true,
      user: true,
      branch: true,
      items: { include: { product: true } },
    },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(purchase);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (purchase.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Cannot edit a cancelled purchase" },
      { status: 400 }
    );
  }

  if (purchase.status === "DRAFT" && body.items?.length) {
    await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
    const subtotal = body.subtotal ?? 0;
    const discount = body.discount ?? 0;
    const tax = body.tax ?? 0;
    const shippingCost = body.shippingCost ?? 0;
    const total = body.total ?? subtotal - discount + tax + shippingCost;
    const paid = body.paidAmount ?? 0;
    const dueAmount = Math.max(0, total - paid);

    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        ...(body.supplierId !== undefined && {
          supplierId: body.supplierId || null,
        }),
        ...(body.supplierInvoiceNo !== undefined && {
          supplierInvoiceNo: body.supplierInvoiceNo?.trim() || null,
        }),
        ...(body.purchaseDate && { purchaseDate: new Date(body.purchaseDate) }),
        ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
        ...(body.notes !== undefined && { notes: body.notes }),
        subtotal,
        discount,
        tax,
        shippingCost,
        total,
        paidAmount: paid,
        dueAmount,
        paymentStatus:
          dueAmount <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE",
        items: {
          create: body.items.map(
            (item: {
              productId: string;
              quantity: number;
              unitPrice: number;
              discount?: number;
              tax?: number;
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
      include: { supplier: true, items: { include: { product: true } } },
    });
    return NextResponse.json(updated);
  }

  const paidAmount =
    body.paidAmount !== undefined
      ? Number(body.paidAmount)
      : decimalToNumber(purchase.paidAmount);
  const total = decimalToNumber(purchase.total);
  const dueAmount = Math.max(0, total - paidAmount);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

  const updated = await prisma.purchase.update({
    where: { id },
    data: {
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.supplierInvoiceNo !== undefined && {
        supplierInvoiceNo: body.supplierInvoiceNo?.trim() || null,
      }),
      ...(body.paidAmount !== undefined && {
        paidAmount,
        dueAmount,
        paymentStatus,
      }),
      ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
    },
    include: { supplier: true, items: { include: { product: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId },
  });
  if (!purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (purchase.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft purchases can be deleted" },
      { status: 400 }
    );
  }

  await prisma.purchase.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
