import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { supplierHasHistory } from "@/lib/suppliers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_suppliers");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, tenantId: authResult.session.user.tenantId! },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_suppliers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.supplier.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      companyName: body.companyName ?? existing.companyName,
      phone: body.phone ?? existing.phone,
      email: body.email ?? existing.email,
      address: body.address ?? existing.address,
      openingBalance: body.openingBalance ?? existing.openingBalance,
      paymentTerms: body.paymentTerms ?? existing.paymentTerms,
      status: body.status ?? existing.status,
    },
  });

  return NextResponse.json(supplier);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_suppliers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const existing = await prisma.supplier.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (await supplierHasHistory(id)) {
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
    return NextResponse.json({ success: true, archived: true });
  }

  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
