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
    subscriptions,
    activeSubscriptions,
    expiringSoon,
    tenantsByMonth,
    recentPayments,
    totalProducts,
    totalSales,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "PENDING" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
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
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.subscriptionPayment.findMany({
      where: { status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.product.count(),
    prisma.sale.count({
      where: { saleDate: { gte: monthStart, lte: monthEnd } },
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
    where: { packageId: { not: null } },
  });

  const packages = await prisma.subscriptionPackage.findMany();
  const packageStats = packageBreakdown.map((pb) => ({
    name: packages.find((p) => p.id === pb.packageId)?.name || "Unknown",
    count: pb._count,
  }));

  return {
    tenantCount,
    activeTenants,
    pendingTenants,
    suspendedTenants,
    activeSubscriptions,
    expiringSoon,
    mrr,
    monthlyRevenue,
    totalProducts,
    totalSales,
    tenantGrowth,
    packageStats,
  };
}
