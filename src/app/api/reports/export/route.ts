import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function GET(request: Request) {
  const authResult = await requirePermission("view_reports");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sales";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam
    ? parseISO(fromParam)
    : startOfMonth(new Date());
  const to = toParam ? parseISO(toParam) : endOfMonth(new Date());
  const branchId = searchParams.get("branchId");
  const userId = searchParams.get("userId");
  const customerId = searchParams.get("customerId");
  const supplierId = searchParams.get("supplierId");

  const EXTENDED_TYPES = [
    "low_stock",
    "product_sales",
    "category_sales",
    "user_sales",
    "branch_sales",
    "payment_methods",
    "tax",
    "returns",
    "customer_due",
    "supplier_due",
    "expiry",
    "expenses",
  ];

  if (EXTENDED_TYPES.includes(type)) {
    const { getTenantPackageFeatures, hasPackageFeature, PACKAGE_FEATURES } =
      await import("@/lib/package-features");
    const features = await getTenantPackageFeatures(tenantId);
    if (!hasPackageFeature(features, PACKAGE_FEATURES.ADVANCED_REPORTS)) {
      return NextResponse.json(
        {
          error:
            "Advanced reports are not included in your subscription package.",
        },
        { status: 403 }
      );
    }
  }

  const { buildReport } = await import("@/lib/reports");
  const extended = await buildReport(type, {
    tenantId,
    from,
    to,
    branchId,
    userId,
    customerId,
    supplierId,
  });
  if (extended) return NextResponse.json(extended);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      where: {
        tenantId,
        saleDate: { gte: from, lte: to },
        status: "COMPLETED",
        ...(branchId && { branchId }),
        ...(userId && { userId }),
        ...(customerId && { customerId }),
      },
      include: { customer: true, user: true },
      orderBy: { saleDate: "asc" },
    });

    return NextResponse.json({
      title: "Sales Report",
      businessName: tenant?.name,
      from: from.toISOString(),
      to: to.toISOString(),
      rows: sales.map((s) => ({
        invoice: s.invoiceNo,
        date: s.saleDate,
        customer: s.customer?.name || "Walk-in",
        cashier: s.user?.name || "—",
        total: decimalToNumber(s.total),
        paid: decimalToNumber(s.paidAmount),
        due: decimalToNumber(s.dueAmount),
        method: s.paymentMethod,
      })),
      summary: {
        count: sales.length,
        total: sales.reduce((sum, s) => sum + decimalToNumber(s.total), 0),
      },
    });
  }

  if (type === "purchases") {
    const purchases = await prisma.purchase.findMany({
      where: {
        tenantId,
        purchaseDate: { gte: from, lte: to },
      },
      include: { supplier: true },
      orderBy: { purchaseDate: "asc" },
    });

    return NextResponse.json({
      title: "Purchase Report",
      businessName: tenant?.name,
      from: from.toISOString(),
      to: to.toISOString(),
      rows: purchases.map((p) => ({
        invoice: p.invoiceNo,
        date: p.purchaseDate,
        supplier: p.supplier?.name || "—",
        total: decimalToNumber(p.total),
        paid: decimalToNumber(p.paidAmount),
        due: decimalToNumber(p.dueAmount),
        status: p.paymentStatus,
      })),
      summary: {
        count: purchases.length,
        total: purchases.reduce((sum, p) => sum + decimalToNumber(p.total), 0),
      },
    });
  }

  if (type === "stock") {
    const products = await prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: { category: true, branch: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      title: "Stock Report",
      businessName: tenant?.name,
      from: from.toISOString(),
      to: to.toISOString(),
      rows: products.map((p) => ({
        name: p.name,
        sku: p.sku || "—",
        category: p.category?.name || "—",
        branch: p.branch?.name || "—",
        stock: decimalToNumber(p.stockQty),
        reorder: decimalToNumber(p.reorderLevel),
        value:
          decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
      })),
      summary: {
        count: products.length,
        total: products.reduce(
          (sum, p) =>
            sum + decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
          0
        ),
      },
    });
  }

  if (type === "profit") {
    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          tenantId,
          saleDate: { gte: from, lte: to },
          status: "COMPLETED",
        },
        _sum: { total: true },
      }),
      prisma.purchase.aggregate({
        where: { tenantId, purchaseDate: { gte: from, lte: to } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { tenantId, expenseDate: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
    ]);

    const salesTotal = decimalToNumber(sales._sum.total);
    const purchasesTotal = decimalToNumber(purchases._sum.total);
    const expensesTotal = decimalToNumber(expenses._sum.amount);
    const grossProfit = salesTotal - purchasesTotal;
    const netProfit = grossProfit - expensesTotal;

    return NextResponse.json({
      title: "Profit & Loss Summary",
      businessName: tenant?.name,
      from: from.toISOString(),
      to: to.toISOString(),
      rows: [
        { item: "Total Sales", amount: salesTotal },
        { item: "Total Purchases", amount: purchasesTotal },
        { item: "Gross Profit", amount: grossProfit },
        { item: "Total Expenses", amount: expensesTotal },
        { item: "Net Profit (est.)", amount: netProfit },
      ],
      summary: { count: 5, total: netProfit },
    });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
