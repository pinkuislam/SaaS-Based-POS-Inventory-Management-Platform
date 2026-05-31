import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export interface ReportFilters {
  tenantId: string;
  from: Date;
  to: Date;
  branchId?: string | null;
  userId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
}

function saleWhere(f: ReportFilters) {
  return {
    tenantId: f.tenantId,
    saleDate: { gte: f.from, lte: f.to },
    status: "COMPLETED" as const,
    ...(f.branchId && { branchId: f.branchId }),
    ...(f.userId && { userId: f.userId }),
    ...(f.customerId && { customerId: f.customerId }),
  };
}

export async function buildReport(type: string, f: ReportFilters) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: f.tenantId },
    select: { name: true },
  });
  const meta = {
    businessName: tenant?.name,
    from: f.from.toISOString(),
    to: f.to.toISOString(),
  };

  switch (type) {
    case "low_stock": {
      const products = await prisma.product.findMany({
        where: { tenantId: f.tenantId, status: "ACTIVE" },
        include: { category: true },
      });
      const rows = products
        .filter((p) => decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel))
        .map((p) => ({
          name: p.name,
          sku: p.sku || "—",
          stock: decimalToNumber(p.stockQty),
          reorder: decimalToNumber(p.reorderLevel),
          category: p.category?.name || "—",
        }));
      return {
        title: "Low Stock Report",
        ...meta,
        rows,
        summary: { count: rows.length, total: 0 },
      };
    }
    case "product_sales": {
      const items = await prisma.saleItem.findMany({
        where: { sale: saleWhere(f) },
        include: { product: true, sale: true },
      });
      const map = new Map<string, { name: string; qty: number; total: number }>();
      for (const item of items) {
        const key = item.productId;
        const cur = map.get(key) || {
          name: item.product.name,
          qty: 0,
          total: 0,
        };
        cur.qty += decimalToNumber(item.quantity);
        cur.total += decimalToNumber(item.total);
        map.set(key, cur);
      }
      const rows = [...map.values()]
        .sort((a, b) => b.total - a.total)
        .map((r) => ({ product: r.name, quantity: r.qty, total: r.total }));
      return {
        title: "Product-wise Sales",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "category_sales": {
      const items = await prisma.saleItem.findMany({
        where: { sale: saleWhere(f) },
        include: { product: { include: { category: true } } },
      });
      const map = new Map<string, { name: string; qty: number; total: number }>();
      for (const item of items) {
        const cat = item.product.category?.name || "Uncategorized";
        const cur = map.get(cat) || { name: cat, qty: 0, total: 0 };
        cur.qty += decimalToNumber(item.quantity);
        cur.total += decimalToNumber(item.total);
        map.set(cat, cur);
      }
      const rows = [...map.values()]
        .sort((a, b) => b.total - a.total)
        .map((r) => ({
          category: r.name,
          quantity: r.qty,
          total: r.total,
        }));
      return {
        title: "Category-wise Sales",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "user_sales": {
      const sales = await prisma.sale.findMany({
        where: saleWhere(f),
        include: { user: true },
      });
      const map = new Map<string, { name: string; count: number; total: number }>();
      for (const s of sales) {
        const key = s.userId || "none";
        const cur = map.get(key) || {
          name: s.user?.name || "Unknown",
          count: 0,
          total: 0,
        };
        cur.count++;
        cur.total += decimalToNumber(s.total);
        map.set(key, cur);
      }
      const rows = [...map.values()].map((r) => ({
        user: r.name,
        invoices: r.count,
        total: r.total,
      }));
      return {
        title: "User-wise Sales",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "branch_sales": {
      const sales = await prisma.sale.findMany({
        where: saleWhere(f),
        include: { branch: true },
      });
      const map = new Map<string, { name: string; count: number; total: number }>();
      for (const s of sales) {
        const key = s.branchId || "none";
        const cur = map.get(key) || {
          name: s.branch?.name || "Main",
          count: 0,
          total: 0,
        };
        cur.count++;
        cur.total += decimalToNumber(s.total);
        map.set(key, cur);
      }
      const rows = [...map.values()].map((r) => ({
        branch: r.name,
        invoices: r.count,
        total: r.total,
      }));
      return {
        title: "Branch-wise Sales",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "payment_methods": {
      const sales = await prisma.sale.findMany({ where: saleWhere(f) });
      const map = new Map<string, number>();
      for (const s of sales) {
        const m = s.paymentMethod || "cash";
        map.set(m, (map.get(m) || 0) + decimalToNumber(s.total));
      }
      const rows = [...map.entries()].map(([method, total]) => ({ method, total }));
      return {
        title: "Payment Method Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "returns": {
      const sales = await prisma.sale.findMany({
        where: {
          tenantId: f.tenantId,
          saleDate: { gte: f.from, lte: f.to },
          status: { in: ["RETURNED", "COMPLETED"] },
        },
        include: { items: true },
      });
      const rows = sales
        .filter((s) => s.status === "RETURNED" || s.items.some((i) => decimalToNumber(i.returnedQty) > 0))
        .map((s) => ({
          invoice: s.invoiceNo,
          date: s.saleDate,
          status: s.status,
          returnedItems: s.items.filter((i) => decimalToNumber(i.returnedQty) > 0).length,
        }));
      return {
        title: "Sales Return Report",
        ...meta,
        rows,
        summary: { count: rows.length, total: 0 },
      };
    }
    case "tax": {
      const sales = await prisma.sale.findMany({ where: saleWhere(f) });
      const rows = sales.map((s) => ({
        invoice: s.invoiceNo,
        date: s.saleDate,
        subtotal: decimalToNumber(s.subtotal),
        tax: decimalToNumber(s.tax),
        total: decimalToNumber(s.total),
      }));
      return {
        title: "Tax / VAT Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.tax, 0),
        },
      };
    }
    case "customer_due": {
      const sales = await prisma.sale.findMany({
        where: {
          tenantId: f.tenantId,
          dueAmount: { gt: 0 },
          status: "COMPLETED",
          ...(f.customerId && { customerId: f.customerId }),
        },
        include: { customer: true },
      });
      const rows = sales.map((s) => ({
        invoice: s.invoiceNo,
        customer: s.customer?.name || "—",
        total: decimalToNumber(s.total),
        due: decimalToNumber(s.dueAmount),
      }));
      return {
        title: "Customer Due Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.due, 0),
        },
      };
    }
    case "supplier_due": {
      const purchases = await prisma.purchase.findMany({
        where: {
          tenantId: f.tenantId,
          dueAmount: { gt: 0 },
          ...(f.supplierId && { supplierId: f.supplierId }),
        },
        include: { supplier: true },
      });
      const rows = purchases.map((p) => ({
        invoice: p.invoiceNo,
        supplier: p.supplier?.name || "—",
        total: decimalToNumber(p.total),
        due: decimalToNumber(p.dueAmount),
      }));
      return {
        title: "Supplier Due Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.due, 0),
        },
      };
    }
    case "expenses": {
      const expenses = await prisma.expense.findMany({
        where: {
          tenantId: f.tenantId,
          expenseDate: { gte: f.from, lte: f.to },
        },
        include: { category: true },
        orderBy: { expenseDate: "desc" },
      });
      const rows = expenses.map((e) => ({
        date: e.expenseDate,
        category: e.category?.name || "—",
        description: e.title || e.notes || "—",
        amount: decimalToNumber(e.amount),
      }));
      return {
        title: "Expense Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.amount, 0),
        },
      };
    }
    case "expiry": {
      const products = await prisma.product.findMany({
        where: {
          tenantId: f.tenantId,
          expiryDate: { not: null, lte: f.to },
          status: "ACTIVE",
        },
        orderBy: { expiryDate: "asc" },
      });
      const rows = products.map((p) => ({
        name: p.name,
        sku: p.sku || "—",
        expiry: p.expiryDate,
        stock: decimalToNumber(p.stockQty),
        batch: p.batchNo || "—",
      }));
      return {
        title: "Expiry Stock Report",
        ...meta,
        rows,
        summary: { count: rows.length, total: 0 },
      };
    }
    default:
      return null;
  }
}
