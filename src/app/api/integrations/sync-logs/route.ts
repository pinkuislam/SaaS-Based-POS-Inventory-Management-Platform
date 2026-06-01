import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const errorsOnly = searchParams.get("errorsOnly") === "true";

  const logs = await prisma.activityLog.findMany({
    where: {
      tenantId: authResult.session.user.tenantId!,
      module: "integrations",
      ...(errorsOnly
        ? {
            OR: [
              { action: { contains: "fail" } },
              { action: { contains: "error" } },
              { details: { contains: "fail" } },
              { details: { contains: "error" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
