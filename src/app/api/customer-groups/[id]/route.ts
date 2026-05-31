import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.customerGroup.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const group = await prisma.customerGroup.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.discountPercent !== undefined && {
        discountPercent: body.discountPercent,
      }),
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  await prisma.customer.updateMany({
    where: { tenantId, groupId: id },
    data: { groupId: null },
  });

  await prisma.customerGroup.deleteMany({ where: { id, tenantId } });
  return NextResponse.json({ success: true });
}
