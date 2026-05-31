import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { getSubscriptionInvoiceDetail } from "@/lib/admin/subscription-invoice-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const data = await getSubscriptionInvoiceDetail(id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.status) {
    data.status = body.status;
    if (body.status === "paid") data.paidAt = new Date();
  }
  if (body.notes !== undefined) data.notes = body.notes;

  const invoice = await prisma.subscriptionInvoice.update({
    where: { id },
    data,
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const invoice = await prisma.subscriptionInvoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Cannot delete a paid invoice" },
      { status: 400 }
    );
  }

  await prisma.subscriptionInvoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
