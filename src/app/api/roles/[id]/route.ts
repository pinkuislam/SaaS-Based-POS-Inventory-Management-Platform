import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions || [];
  if (
    !permissions.includes("*") &&
    !permissions.includes("manage_users")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { permissions: newPermissions, name } = body;

  const role = await prisma.role.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.name === "Owner" && role.isDefault) {
    return NextResponse.json(
      { error: "Cannot modify default Owner role permissions" },
      { status: 400 }
    );
  }

  const validPermissions = Array.isArray(newPermissions)
    ? newPermissions.filter((p: string) =>
        (ALL_PERMISSIONS as readonly string[]).includes(p)
      )
    : undefined;

  const updated = await prisma.role.update({
    where: { id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(validPermissions ? { permissions: validPermissions } : {}),
    },
  });

  return NextResponse.json(updated);
}
