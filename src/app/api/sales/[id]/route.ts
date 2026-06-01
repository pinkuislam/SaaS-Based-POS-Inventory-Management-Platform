import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              stockQty: true,
              taxRate: true,
            },
          },
        },
      },
      customer: true,
      user: true,
      branch: true,
      payments: true,
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  return NextResponse.json(sale);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("edit_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const sale = await prisma.sale.findFirst({ where: { id, tenantId } });
  if (!sale) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (sale.status === "CANCELLED") {
    return NextResponse.json({ error: "Sale is cancelled" }, { status: 400 });
  }

  const paidAmount =
    body.paidAmount !== undefined
      ? Number(body.paidAmount)
      : decimalToNumber(sale.paidAmount);
  const total = decimalToNumber(sale.total);
  const dueAmount = Math.max(0, total - paidAmount);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

  const updated = await prisma.sale.update({
    where: { id },
    data: {
      ...(body.customerId !== undefined && {
        customerId: body.customerId || null,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.deliveryStatus !== undefined && {
        deliveryStatus: body.deliveryStatus,
      }),
      ...(body.paidAmount !== undefined && {
        paidAmount,
        dueAmount,
        paymentStatus,
      }),
      ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
    },
    include: {
      customer: true,
      items: { include: { product: true } },
      branch: true,
      user: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("delete_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!sale) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (sale.status !== "HELD") {
    return NextResponse.json(
      { error: "Only held/draft sales can be deleted" },
      { status: 400 }
    );
  }

  await prisma.sale.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
