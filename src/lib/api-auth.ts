import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Permission, hasPermission } from "@/lib/permissions";

export async function getTenantSession() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return null;
  }
  return session;
}

export async function requireTenantSession() {
  const session = await getTenantSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requirePermission(permission: Permission) {
  const result = await requireTenantSession();
  if ("error" in result) return result;

  const permissions = result.session.user.permissions || [];
  if (!hasPermission(permissions, permission)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session: result.session };
}
