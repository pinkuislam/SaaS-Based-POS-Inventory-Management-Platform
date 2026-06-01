import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { syncLowStockNotifications } from "@/lib/notifications";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export type DashboardChartPoint = {
  date: string;
  sales: number;
  purchases: number;
  profit: number;
};

export async function getDashboardStats(
  tenantId: string,
  branchFilter: { branchId?: string } = {}
) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const last7 = subDays(new Date(), 7);
  const last30 = subDays(new Date(), 30);
  const branchWhere = branchFilter.branchId
    ? { branchId: branchFilter.branchId }
    : {};

  await syncLowStockNotifications(tenantId);

  const [
    todaySales,
    todayPurchases,
    todayExpenses,
    allTimeExpenses,
    products,
    lowStockProducts,
    outOfStockProducts,
    outOfStockCount,
    recentSales,
    recentPurchases,
    salesLast7Days,
    purchasesLast7Days,
    todaySaleItems,
    saleItems7d,
    paymentMethodSales,
    customerCount,
    supplierCount,
    totalDueSales,
    subscription,
    customerPayments,
    supplierPayments,
    branchSales30d,
    branches,
    notifications,
    unreadNotificationCount,
    slowMovingCandidates,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId,
        ...branchWhere,
        saleDate: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
      },
      _sum: { total: true, paidAmount: true },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: {
        tenantId,
        purchaseDate: { gte: todayStart, lte: todayEnd },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        expenseDate: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { tenantId },
      _sum: { amount: true },
    }),
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true,
        stockQty: true,
        purchasePrice: true,
        sellingPrice: true,
        reorderLevel: true,
      },
    }),
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        stockQty: true,
        reorderLevel: true,
      },
    }),
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE", stockQty: { lte: 0 } },
      take: 8,
      select: {
        id: true,
        name: true,
        stockQty: true,
        reorderLevel: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.count({
      where: { tenantId, status: "ACTIVE", stockQty: { lte: 0 } },
    }),
    prisma.sale.findMany({
      where: { tenantId, ...branchWhere },
      orderBy: { saleDate: "desc" },
      take: 8,
      include: { customer: true, user: true },
    }),
    prisma.purchase.findMany({
      where: { tenantId },
      orderBy: { purchaseDate: "desc" },
      take: 8,
      include: { supplier: true },
    }),
    prisma.sale.groupBy({
      by: ["saleDate"],
      where: {
        tenantId,
        ...branchWhere,
        saleDate: { gte: last7 },
        status: "COMPLETED",
      },
      _sum: { total: true },
    }),
    prisma.purchase.groupBy({
      by: ["purchaseDate"],
      where: {
        tenantId,
        purchaseDate: { gte: last7 },
      },
      _sum: { total: true },
    }),
    prisma.saleItem.findMany({
      where: {
        sale: {
          tenantId,
          ...branchWhere,
          saleDate: { gte: todayStart, lte: todayEnd },
          status: "COMPLETED",
        },
      },
      include: { product: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          tenantId,
          ...branchWhere,
          saleDate: { gte: last7 },
          status: "COMPLETED",
        },
      },
      _sum: { quantity: true, total: true },
    }),
    prisma.sale.findMany({
      where: {
        tenantId,
        ...branchWhere,
        saleDate: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
      },
      select: { paymentMethod: true, total: true },
    }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.supplier.count({ where: { tenantId } }),
    prisma.sale.aggregate({
      where: {
        tenantId,
        ...branchWhere,
        dueAmount: { gt: 0 },
        status: "COMPLETED",
      },
      _sum: { dueAmount: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        status: true,
        subscriptions: {
          take: 1,
          orderBy: { endDate: "desc" },
          include: { package: { select: { name: true, billingCycle: true } } },
        },
      },
    }),
    prisma.customerPayment.findMany({
      where: { tenantId },
      orderBy: { paymentDate: "desc" },
      take: 8,
      include: { customer: { select: { name: true } } },
    }),
    prisma.supplierPayment.findMany({
      where: { tenantId },
      orderBy: { paymentDate: "desc" },
      take: 8,
      include: { supplier: { select: { name: true } } },
    }),
    prisma.sale.groupBy({
      by: ["branchId"],
      where: {
        tenantId,
        status: "COMPLETED",
        saleDate: { gte: last30 },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, code: true },
    }),
    prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notification.count({
      where: { tenantId, isRead: false },
    }),
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, name: true, stockQty: true },
      take: 200,
    }),
  ]);

  const lowStock = products.filter(
    (p) => decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel)
  );

  const stockValue = products.reduce(
    (sum, p) =>
      sum + decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
    0
  );

  const chartData: DashboardChartPoint[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayKey = format(date, "yyyy-MM-dd");
    const daySales = salesLast7Days
      .filter((s) => format(s.saleDate, "yyyy-MM-dd") === dayKey)
      .reduce((sum, s) => sum + decimalToNumber(s._sum.total), 0);
    const dayPurchases = purchasesLast7Days
      .filter((p) => format(p.purchaseDate, "yyyy-MM-dd") === dayKey)
      .reduce((sum, p) => sum + decimalToNumber(p._sum.total), 0);
    return {
      date: format(date, "EEE"),
      sales: daySales,
      purchases: dayPurchases,
      profit: daySales - dayPurchases,
    };
  });

  const filteredLowStock = lowStockProducts
    .filter((p) => decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel))
    .sort(
      (a, b) => decimalToNumber(a.stockQty) - decimalToNumber(b.stockQty)
    )
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stockQty: decimalToNumber(p.stockQty),
      reorderLevel: decimalToNumber(p.reorderLevel),
    }));

  const productMapToday = new Map<
    string,
    { id: string; name: string; qty: number; total: number }
  >();
  for (const item of todaySaleItems) {
    const key = item.productId;
    const cur = productMapToday.get(key) || {
      id: item.productId,
      name: item.product.name,
      qty: 0,
      total: 0,
    };
    cur.qty += decimalToNumber(item.quantity);
    cur.total += decimalToNumber(item.total);
    productMapToday.set(key, cur);
  }
  const topProductsToday = [...productMapToday.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const productIds7d = saleItems7d.map((s) => s.productId);
  const products7d = productIds7d.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds7d } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(products7d.map((p) => [p.id, p.name]));
  const topSellingProducts = saleItems7d
    .map((row) => ({
      id: row.productId,
      name: nameById.get(row.productId) || "Unknown",
      qty: decimalToNumber(row._sum.quantity),
      total: decimalToNumber(row._sum.total),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const soldQty30d = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        tenantId,
        ...branchWhere,
        saleDate: { gte: last30 },
        status: "COMPLETED",
      },
    },
    _sum: { quantity: true },
  });
  const soldMap = new Map(
    soldQty30d.map((r) => [r.productId, decimalToNumber(r._sum.quantity)])
  );
  const slowMovingProducts = slowMovingCandidates
    .map((p) => ({
      id: p.id,
      name: p.name,
      stockQty: decimalToNumber(p.stockQty),
      soldQty30d: soldMap.get(p.id) ?? 0,
    }))
    .sort((a, b) => a.soldQty30d - b.soldQty30d)
    .slice(0, 8);

  const paymentMap = new Map<string, number>();
  for (const s of paymentMethodSales) {
    const m = s.paymentMethod || "cash";
    paymentMap.set(m, (paymentMap.get(m) || 0) + decimalToNumber(s.total));
  }
  const paymentMethods = [...paymentMap.entries()].map(([method, total]) => ({
    method,
    total,
  }));

  const todayProfitEst =
    decimalToNumber(todaySales._sum.total) -
    decimalToNumber(todayPurchases._sum.total) -
    decimalToNumber(todayExpenses._sum.amount);

  const allTimeSales = await prisma.sale.aggregate({
    where: { tenantId, ...branchWhere, status: "COMPLETED" },
    _sum: { total: true },
  });

  const branchNameById = new Map(branches.map((b) => [b.id, b.name]));
  const branchWisePerformance = branchSales30d
    .map((row) => ({
      branchId: row.branchId,
      branchName: row.branchId
        ? branchNameById.get(row.branchId) || "Unknown branch"
        : "No branch",
      salesTotal: decimalToNumber(row._sum.total),
      salesCount: row._count,
    }))
    .sort((a, b) => b.salesTotal - a.salesTotal);

  type RecentPayment = {
    id: string;
    type: "customer" | "supplier";
    partyName: string;
    amount: number;
    method: string;
    paymentDate: Date;
  };

  const recentPayments: RecentPayment[] = [
    ...customerPayments.map((p) => ({
      id: p.id,
      type: "customer" as const,
      partyName: p.customer.name,
      amount: decimalToNumber(p.amount),
      method: p.method,
      paymentDate: p.paymentDate,
    })),
    ...supplierPayments.map((p) => ({
      id: p.id,
      type: "supplier" as const,
      partyName: p.supplier.name,
      amount: decimalToNumber(p.amount),
      method: p.method,
      paymentDate: p.paymentDate,
    })),
  ]
    .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
    .slice(0, 8);

  const activeSub = subscription?.subscriptions[0];

  return {
    todaySalesTotal: decimalToNumber(todaySales._sum.total),
    todaySalesCount: todaySales._count,
    todayPurchasesTotal: decimalToNumber(todayPurchases._sum.total),
    todayPurchasesCount: todayPurchases._count,
    todayExpensesTotal: decimalToNumber(todayExpenses._sum.amount),
    totalExpenses: decimalToNumber(allTimeExpenses._sum.amount),
    todayProfitEst,
    totalRevenue: decimalToNumber(allTimeSales._sum.total),
    totalDue: decimalToNumber(totalDueSales._sum.dueAmount),
    customerCount,
    supplierCount,
    productCount: products.length,
    outOfStockCount,
    subscriptionPackage: activeSub?.package?.name || null,
    subscriptionStatus: activeSub?.status || subscription?.status || null,
    subscriptionEndDate: activeSub?.endDate || null,
    subscriptionBillingCycle: activeSub?.package?.billingCycle || null,
    stockValue,
    lowStockCount: lowStock.length,
    lowStockProducts: filteredLowStock,
    outOfStockProducts: outOfStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      stockQty: decimalToNumber(p.stockQty),
      reorderLevel: decimalToNumber(p.reorderLevel),
    })),
    recentSales,
    recentPurchases,
    recentPayments,
    chartData,
    topProductsToday,
    topSellingProducts,
    slowMovingProducts,
    branchWisePerformance,
    paymentMethods,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    unreadNotificationCount,
  };
}
