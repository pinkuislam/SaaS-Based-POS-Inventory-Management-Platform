import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { escapeCsvCell } from "@/lib/utils";
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
  const module = searchParams.get("module");
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format");
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

  const where = {
    tenantId: session.user.tenantId,
    ...(module && module !== "all" ? { module } : {}),
    ...(userId && userId !== "all" ? { userId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: parseISO(from) } : {}),
            ...(to ? { lte: parseISO(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (format === "csv") {
    const headers = ["date", "user", "module", "action", "details"];
    const lines = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.createdAt.toISOString(),
          log.userName || "System",
          log.module,
          log.action,
          log.details || "",
        ]
          .map((v) => escapeCsvCell(v))
          .join(",")
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="activity-log.csv"',
      },
    });
  }

  return NextResponse.json(logs);
}
