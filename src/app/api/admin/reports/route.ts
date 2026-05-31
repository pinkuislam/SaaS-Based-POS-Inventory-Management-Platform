import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { decimalToNumber } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "overview";

  if (type === "tenants") {
    const tenants = await prisma.tenant.groupBy({
      by: ["status"],
      _count: true,
      where: { deletedAt: null },
    });
    return NextResponse.json({ tenants });
  }

  if (type === "revenue") {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { start: startOfMonth(d), end: endOfMonth(d), label: d.toISOString() };
    });

    const data = await Promise.all(
      months.map(async (m) => {
        const payments = await prisma.subscriptionPayment.findMany({
          where: {
            status: "PAID",
            paidAt: { gte: m.start, lte: m.end },
          },
        });
        const total = payments.reduce(
          (s, p) => s + decimalToNumber(p.amount),
          0
        );
        return {
          month: m.start.toLocaleString("default", { month: "short", year: "2-digit" }),
          revenue: total,
        };
      })
    );
    return NextResponse.json({ revenue: data });
  }

  const [
    tenantCount,
    activeTenants,
    trialSubs,
    expiredSubs,
    pendingPayments,
    openTickets,
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscriptionPayment.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({
      where: { status: { in: ["open", "pending"] } },
    }),
  ]);

  return NextResponse.json({
    overview: {
      tenantCount,
      activeTenants,
      trialSubs,
      expiredSubs,
      pendingPayments,
      openTickets,
    },
  });
}
