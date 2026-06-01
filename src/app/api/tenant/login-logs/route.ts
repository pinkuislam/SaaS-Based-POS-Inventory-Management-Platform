import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseISO } from "date-fns";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canView =
    session.user.permissions?.includes("*") ||
    session.user.permissions?.includes("manage_settings") ||
    session.user.permissions?.includes("manage_users");

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const successParam = searchParams.get("success");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

  const logs = await prisma.loginLog.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(successParam === "true" ? { success: true } : {}),
      ...(successParam === "false" ? { success: false } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: parseISO(from) } : {}),
              ...(to ? { lte: parseISO(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
