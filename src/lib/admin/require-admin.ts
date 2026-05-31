import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAdminIpAllowed } from "@/lib/admin/ip-restrict";

export async function requireSuperAdmin(request?: Request) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (request && !(await isAdminIpAllowed(request))) {
    return { error: NextResponse.json({ error: "IP not allowed" }, { status: 403 }) };
  }
  return { session };
}

export async function requireSuperAdminSession() {
  const result = await requireSuperAdmin();
  if ("error" in result) return null;
  return result.session;
}
