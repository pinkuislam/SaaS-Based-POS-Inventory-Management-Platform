import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_pos");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const body = await request.json();
  const { items, customerId, subtotal, discount, tax, total, notes, branchId } =
    body;

  if (!items?.length) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const saleCount = await prisma.sale.count({ where: { tenantId } });
  const invoiceNo = generateInvoiceNo("HLD", saleCount + 1);

  const sale = await prisma.sale.create({
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
      paidAmount: 0,
      dueAmount: total,
      paymentMethod: "cash",
      paymentStatus: "DUE",
      status: "HELD",
      notes: notes || "Held sale",
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
    include: { items: { include: { product: true } }, customer: true },
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "hold_sale",
    module: "pos",
    details: `Held sale ${invoiceNo}`,
    metadata: { saleId: sale.id },
  });

  return NextResponse.json(sale);
}

export async function GET() {
  const authResult = await requirePermission("manage_pos");
  if ("error" in authResult) return authResult.error;

  const sales = await prisma.sale.findMany({
    where: {
      tenantId: authResult.session.user.tenantId!,
      status: "HELD",
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      customer: true,
      user: true,
    },
  });

  return NextResponse.json(sales);
}
