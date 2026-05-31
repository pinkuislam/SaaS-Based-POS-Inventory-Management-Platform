import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { subDays, startOfMonth, endOfMonth, format } from "date-fns";

export async function getAdminPlatformStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    tenantCount,
    activeTenants,
    pendingTenants,
    suspendedTenants,
    inactiveTenants,
    trialTenants,
    expiredSubscriptions,
    subscriptions,
    activeSubscriptions,
    expiringSoon,
    tenantsByMonth,
    recentPayments,
    pendingPayments,
    openTickets,
    totalProducts,
    totalSales,
    revenueByMonth,
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.tenant.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.tenant.count({ where: { status: "SUSPENDED", deletedAt: null } }),
    prisma.tenant.count({
      where: { status: { in: ["INACTIVE", "EXPIRED"] }, deletedAt: null },
    }),
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscription.findMany({
      include: { package: true, tenant: true },
    }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: subDays(now, -14) },
      },
      include: { tenant: true, package: true },
      take: 10,
    }),
    prisma.tenant.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select: { createdAt: true },
    }),
    prisma.subscriptionPayment.findMany({
      where: { status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { paidAt: "desc" },
      take: 8,
      include: {
        subscription: { include: { tenant: true } },
      },
    }),
    prisma.subscriptionPayment.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({
      where: { status: { in: ["open", "pending"] } },
    }),
    prisma.product.count(),
    prisma.sale.count({
      where: { saleDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.subscriptionPayment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: subDays(now, 180) },
      },
      select: { paidAt: true, amount: true },
    }),
  ]);

  const mrr = subscriptions
    .filter((s) => s.status === "ACTIVE" || s.status === "TRIAL")
    .reduce((sum, s) => sum + decimalToNumber(s.amount), 0);

  const monthlyRevenue = recentPayments.reduce(
    (sum, p) => sum + decimalToNumber(p.amount),
    0
  );

  const tenantGrowth = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(now, 29 - i);
    const day = format(date, "yyyy-MM-dd");
    const count = tenantsByMonth.filter(
      (t) => format(t.createdAt, "yyyy-MM-dd") === day
    ).length;
    return { date: format(date, "MMM dd"), count };
  });

  const packageBreakdown = await prisma.tenant.groupBy({
    by: ["packageId"],
    _count: true,
    where: { packageId: { not: null }, deletedAt: null },
  });

  const packages = await prisma.subscriptionPackage.findMany();
  const packageStats = packageBreakdown.map((pb) => ({
    name: packages.find((p) => p.id === pb.packageId)?.name || "Unknown",
    count: pb._count,
  }));

  const revenueChart = Array.from({ length: 6 }, (_, i) => {
    const d = subDays(startOfMonth(now), (5 - i) * 30);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const total = revenueByMonth
      .filter((p) => p.paidAt && p.paidAt >= start && p.paidAt <= end)
      .reduce((s, p) => s + decimalToNumber(p.amount), 0);
    return {
      month: format(start, "MMM yy"),
      revenue: total,
    };
  });

  return {
    tenantCount,
    activeTenants,
    pendingTenants,
    suspendedTenants,
    inactiveTenants,
    trialTenants,
    expiredSubscriptions,
    activeSubscriptions,
    expiringSoon,
    mrr,
    monthlyRevenue,
    pendingPayments,
    openTickets,
    totalProducts,
    totalSales,
    tenantGrowth,
    packageStats,
    revenueChart,
    recentPayments,
  };
}
