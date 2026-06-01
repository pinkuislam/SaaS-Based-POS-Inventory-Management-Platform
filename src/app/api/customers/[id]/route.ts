import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { customerHasHistory } from "@/lib/customers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId: authResult.session.user.tenantId! },
    include: { group: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.customer.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      phone: body.phone ?? existing.phone,
      email: body.email ?? existing.email,
      address: body.address ?? existing.address,
      customerType: body.customerType ?? existing.customerType,
      groupId:
        body.groupId !== undefined ? body.groupId || null : existing.groupId,
      openingBalance: body.openingBalance ?? existing.openingBalance,
      creditLimit: body.creditLimit ?? existing.creditLimit,
      loyaltyPoints: body.loyaltyPoints ?? existing.loyaltyPoints,
      status: body.status ?? existing.status,
      ...(body.dateOfBirth !== undefined && {
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      }),
    },
  });

  return NextResponse.json(customer);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const existing = await prisma.customer.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (await customerHasHistory(id)) {
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
    return NextResponse.json({ success: true, archived: true });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
