import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const todayOnly = searchParams.get("today") === "1";
  const posList = searchParams.get("pos") === "1";
  const limitParam = parseInt(searchParams.get("limit") || "0", 10);
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const customerId = searchParams.get("customerId");
  const branchId = searchParams.get("branchId");
  const userId = searchParams.get("userId");

  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as never } : posList || todayOnly ? {} : {}),
      ...(paymentStatus ? { paymentStatus: paymentStatus as never } : {}),
      ...(customerId ? { customerId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(userId ? { userId } : {}),
      ...(todayOnly && {
        saleDate: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      }),
    },
    orderBy: { saleDate: "desc" },
    take: limitParam > 0 ? limitParam : todayOnly ? 500 : 100,
    include: {
      customer: true,
      user: true,
      branch: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(sales);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const body = await request.json();
  const {
    items,
    customerId,
    subtotal,
    discount,
    tax,
    total,
    paidAmount,
    paymentMethod,
    notes,
    branchId,
    splitPayments,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "No items in sale" }, { status: 400 });
  }

  try {
    const { assertInvoiceLimit } = await import("@/lib/package-limits");
    await assertInvoiceLimit(tenantId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Limit reached" },
      { status: 400 }
    );
  }

  const saleCount = await prisma.sale.count({ where: { tenantId } });
  const invoiceNo = generateInvoiceNo("INV", saleCount + 1);
  const dueAmount = Math.max(0, total - paidAmount);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        tenantId,
        branchId: branchId || session.user.branchId,
        customerId: customerId || null,
        userId: session.user.id,
        invoiceNo,
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        paidAmount: paidAmount || total,
        dueAmount,
        paymentMethod: paymentMethod || "cash",
        paymentStatus,
        status: "COMPLETED",
        notes: splitPayments
          ? JSON.stringify({ splitPayments, note: notes })
          : notes,
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
      include: { items: true, customer: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: branchId || session.user.branchId,
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          reference: invoiceNo,
        },
      });
    }

    return newSale;
  });

  if (customerId) {
    try {
      const { getTenantSettings } = await import("@/lib/tenant-settings");
      const { pointsEarnedForSale } = await import("@/lib/loyalty");
      const settings = await getTenantSettings(tenantId);
      const earned = pointsEarnedForSale(Number(total), settings);
      if (earned > 0) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: earned } },
        });
      }
    } catch {
      /* loyalty optional */
    }
  }

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "create_sale",
    module: "sales",
    details: `Sale ${invoiceNo} - ${total}`,
  });

  return NextResponse.json(sale);
}
