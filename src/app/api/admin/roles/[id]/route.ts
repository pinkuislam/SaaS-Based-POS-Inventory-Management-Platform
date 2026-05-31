import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const role = await prisma.adminRole.update({ where: { id }, data: body });
  return NextResponse.json(role);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const count = await prisma.superAdmin.count({ where: { roleId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Reassign admins before deleting this role" },
      { status: 400 }
    );
  }

  await prisma.adminRole.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
