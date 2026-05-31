import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { generateSubscriptionInvoiceNo } from "@/lib/admin/invoice-no";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const invoices = await prisma.subscriptionInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tenantIds = [...new Set(invoices.map((i) => i.tenantId))];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true, slug: true },
  });
  const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t]));

  return NextResponse.json(
    invoices.map((inv) => ({ ...inv, tenant: tenantMap[inv.tenantId] }))
  );
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { tenantId, subscriptionId, amount, tax = 0, discount = 0, dueDate, notes } =
    body;

  if (!tenantId || amount === undefined) {
    return NextResponse.json({ error: "tenantId and amount required" }, { status: 400 });
  }

  const amt = Number(amount);
  const taxAmt = Number(tax);
  const disc = Number(discount);
  const total = amt + taxAmt - disc;
  const invoiceNo = await generateSubscriptionInvoiceNo();

  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      tenantId,
      subscriptionId: subscriptionId || null,
      invoiceNo,
      amount: amt,
      tax: taxAmt,
      discount: disc,
      total,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      status: "unpaid",
    },
  });

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "CREATE",
    module: "invoices",
    details: `Created invoice ${invoiceNo}`,
  });

  return NextResponse.json(invoice, { status: 201 });
}
