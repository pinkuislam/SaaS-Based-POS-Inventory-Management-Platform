import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getDashboardStats(tenantId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    todaySales,
    todayPurchases,
    products,
    lowStockProducts,
    recentSales,
    salesLast7Days,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId,
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
      where: { tenantId },
      orderBy: { saleDate: "desc" },
      take: 5,
      include: { customer: true, user: true },
    }),
    prisma.sale.groupBy({
      by: ["saleDate"],
      where: {
        tenantId,
        saleDate: { gte: subDays(new Date(), 7) },
        status: "COMPLETED",
      },
      _sum: { total: true },
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

  return {
    todaySalesTotal: decimalToNumber(todaySales._sum.total),
    todaySalesCount: todaySales._count,
    todayPurchasesTotal: decimalToNumber(todayPurchases._sum.total),
    stockValue,
    lowStockCount: lowStock.length,
    lowStockProducts: filteredLowStock,
    recentSales,
    chartData,
  };
}
