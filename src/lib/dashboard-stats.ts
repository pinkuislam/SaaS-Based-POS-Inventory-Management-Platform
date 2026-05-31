import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getDashboardStats(
  tenantId: string,
  branchFilter: { branchId?: string } = {}
) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const branchWhere = branchFilter.branchId
    ? { branchId: branchFilter.branchId }
    : {};

  const [
    todaySales,
    todayPurchases,
    products,
    lowStockProducts,
    recentSales,
    salesLast7Days,
    todaySaleItems,
    paymentMethodSales,
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
      where: {
        tenantId,
        status: "ACTIVE",
      },
      take: 10,
    }),
    prisma.sale.findMany({
      where: { tenantId, ...branchWhere },
      orderBy: { saleDate: "desc" },
      take: 5,
      include: { customer: true, user: true },
    }),
    prisma.sale.groupBy({
      by: ["saleDate"],
      where: {
        tenantId,
        ...branchWhere,
        saleDate: { gte: subDays(new Date(), 7) },
        status: "COMPLETED",
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
    prisma.sale.findMany({
      where: {
        tenantId,
        ...branchWhere,
        saleDate: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
      },
      select: { paymentMethod: true, total: true },
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

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySales = salesLast7Days
      .filter((s) => format(s.saleDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
      .reduce((sum, s) => sum + decimalToNumber(s._sum.total), 0);
    return {
      date: format(date, "EEE"),
      sales: daySales,
    };
  });

  const filteredLowStock = lowStockProducts
    .filter((p) => decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel))
    .slice(0, 5);

  const productMap = new Map<string, { name: string; qty: number; total: number }>();
  for (const item of todaySaleItems) {
    const key = item.productId;
    const cur = productMap.get(key) || {
      name: item.product.name,
      qty: 0,
      total: 0,
    };
    cur.qty += decimalToNumber(item.quantity);
    cur.total += decimalToNumber(item.total);
    productMap.set(key, cur);
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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
    decimalToNumber(todayPurchases._sum.total);

  return {
    todaySalesTotal: decimalToNumber(todaySales._sum.total),
    todaySalesCount: todaySales._count,
    todayPurchasesTotal: decimalToNumber(todayPurchases._sum.total),
    todayProfitEst,
    stockValue,
    lowStockCount: lowStock.length,
    lowStockProducts: filteredLowStock,
    recentSales,
    chartData,
    topProducts,
    paymentMethods,
  };
}
