import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

  const admin = await prisma.superAdmin.findUnique({ where: { id } });
  if (!admin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (admin.isPrimary && body.isActive === false) {
    return NextResponse.json(
      { error: "Cannot deactivate primary Super Admin" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.roleId !== undefined) data.roleId = body.roleId;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  const updated = await prisma.superAdmin.update({
    where: { id },
    data,
    include: { role: true },
  });

  const { password: _, ...safe } = updated;
  return NextResponse.json(safe);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const admin = await prisma.superAdmin.findUnique({ where: { id } });
  if (!admin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (admin.isPrimary) {
    return NextResponse.json(
      { error: "Cannot delete primary Super Admin" },
      { status: 400 }
    );
  }

  await prisma.superAdmin.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
