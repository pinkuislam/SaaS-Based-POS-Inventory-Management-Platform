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
  productId?: string | null;
}

function saleWhere(f: ReportFilters) {
  return {
    tenantId: f.tenantId,
    saleDate: { gte: f.from, lte: f.to },
    status: "COMPLETED" as const,
    ...(f.branchId && { branchId: f.branchId }),
    ...(f.userId && { userId: f.userId }),
    ...(f.customerId && { customerId: f.customerId }),
    ...(f.productId && { items: { some: { productId: f.productId } } }),
  };
}

function purchaseWhere(f: ReportFilters) {
  return {
    tenantId: f.tenantId,
    purchaseDate: { gte: f.from, lte: f.to },
    ...(f.supplierId && { supplierId: f.supplierId }),
    ...(f.productId && { items: { some: { productId: f.productId } } }),
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
    case "sales": {
      const sales = await prisma.sale.findMany({
        where: saleWhere(f),
        include: { customer: true, user: true },
        orderBy: { saleDate: "asc" },
      });
      const rows = sales.map((s) => ({
        invoice: s.invoiceNo,
        date: s.saleDate,
        customer: s.customer?.name || "Walk-in",
        cashier: s.user?.name || "—",
        total: decimalToNumber(s.total),
        paid: decimalToNumber(s.paidAmount),
        due: decimalToNumber(s.dueAmount),
        method: s.paymentMethod,
      }));
      return {
        title: "Sales Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "purchases": {
      const purchases = await prisma.purchase.findMany({
        where: purchaseWhere(f),
        include: { supplier: true },
        orderBy: { purchaseDate: "asc" },
      });
      const rows = purchases.map((p) => ({
        invoice: p.invoiceNo,
        date: p.purchaseDate,
        supplier: p.supplier?.name || "—",
        total: decimalToNumber(p.total),
        paid: decimalToNumber(p.paidAmount),
        due: decimalToNumber(p.dueAmount),
        status: p.paymentStatus,
      }));
      return {
        title: "Purchase Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "product_catalog": {
      const products = await prisma.product.findMany({
        where: {
          tenantId: f.tenantId,
          status: "ACTIVE",
          ...(f.productId && { id: f.productId }),
        },
        include: { category: true, brand: true, unit: true },
        orderBy: { name: "asc" },
      });
      const rows = products.map((p) => ({
        name: p.name,
        sku: p.sku || "—",
        barcode: p.barcode || "—",
        category: p.category?.name || "—",
        brand: p.brand?.name || "—",
        unit: p.unit?.name || "—",
        stock: decimalToNumber(p.stockQty),
        purchase_price: decimalToNumber(p.purchasePrice),
        selling_price: decimalToNumber(p.sellingPrice),
        tax_rate: decimalToNumber(p.taxRate),
      }));
      return {
        title: "Product Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce(
            (s, r) => s + r.stock * r.purchase_price,
            0
          ),
        },
      };
    }
    case "stock": {
      const products = await prisma.product.findMany({
        where: {
          tenantId: f.tenantId,
          status: "ACTIVE",
          ...(f.productId && { id: f.productId }),
        },
        include: { category: true, branch: true },
        orderBy: { name: "asc" },
      });
      const rows = products.map((p) => ({
        name: p.name,
        sku: p.sku || "—",
        category: p.category?.name || "—",
        branch: p.branch?.name || "—",
        stock: decimalToNumber(p.stockQty),
        reorder: decimalToNumber(p.reorderLevel),
        value:
          decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
      }));
      return {
        title: "Stock / Inventory Valuation",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.value, 0),
        },
      };
    }
    case "profit": {
      const [salesAgg, purchasesAgg, expensesAgg] = await Promise.all([
        prisma.sale.aggregate({
          where: saleWhere(f),
          _sum: { total: true },
        }),
        prisma.purchase.aggregate({
          where: {
            tenantId: f.tenantId,
            purchaseDate: { gte: f.from, lte: f.to },
          },
          _sum: { total: true },
        }),
        prisma.expense.aggregate({
          where: {
            tenantId: f.tenantId,
            expenseDate: { gte: f.from, lte: f.to },
          },
          _sum: { amount: true },
        }),
      ]);
      const salesTotal = decimalToNumber(salesAgg._sum.total);
      const purchasesTotal = decimalToNumber(purchasesAgg._sum.total);
      const expensesTotal = decimalToNumber(expensesAgg._sum.amount);
      const grossProfit = salesTotal - purchasesTotal;
      const netProfit = grossProfit - expensesTotal;
      const rows = [
        { item: "Total Sales", amount: salesTotal },
        { item: "Total Purchases", amount: purchasesTotal },
        { item: "Gross Profit", amount: grossProfit },
        { item: "Total Expenses", amount: expensesTotal },
        { item: "Net Profit (est.)", amount: netProfit },
      ];
      return {
        title: "Profit & Loss",
        ...meta,
        rows,
        summary: { count: rows.length, total: netProfit },
      };
    }
    case "out_of_stock": {
      const products = await prisma.product.findMany({
        where: { tenantId: f.tenantId, status: "ACTIVE", stockQty: { lte: 0 } },
        include: { category: true },
        orderBy: { name: "asc" },
      });
      const rows = products.map((p) => ({
        name: p.name,
        sku: p.sku || "—",
        stock: decimalToNumber(p.stockQty),
        category: p.category?.name || "—",
      }));
      return {
        title: "Out of Stock Report",
        ...meta,
        rows,
        summary: { count: rows.length, total: 0 },
      };
    }
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
        .filter(
          (s) =>
            s.status === "RETURNED" ||
            s.items.some((i) => decimalToNumber(i.returnedQty) > 0)
        )
        .map((s) => ({
          invoice: s.invoiceNo,
          date: s.saleDate,
          status: s.status,
          returnedItems: s.items.filter(
            (i) => decimalToNumber(i.returnedQty) > 0
          ).length,
        }));
      return {
        title: "Sales Returns (line items)",
        ...meta,
        rows,
        summary: { count: rows.length, total: 0 },
      };
    }
    case "sale_returns": {
      const returns = await prisma.saleReturn.findMany({
        where: {
          tenantId: f.tenantId,
          returnDate: { gte: f.from, lte: f.to },
          status: "COMPLETED",
          ...(f.productId && {
            items: { some: { productId: f.productId } },
          }),
        },
        include: { sale: true, customer: true, items: true },
        orderBy: { returnDate: "desc" },
      });
      const rows = returns.map((r) => ({
        return_no: r.returnNo,
        sale_invoice: r.sale.invoiceNo,
        date: r.returnDate,
        customer: r.customer?.name || "—",
        items: r.items.length,
        refund: decimalToNumber(r.refundAmount),
      }));
      return {
        title: "Sales Return Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.refund, 0),
        },
      };
    }
    case "purchase_returns": {
      const returns = await prisma.purchaseReturn.findMany({
        where: {
          tenantId: f.tenantId,
          returnDate: { gte: f.from, lte: f.to },
          status: "COMPLETED",
          ...(f.supplierId && { supplierId: f.supplierId }),
          ...(f.productId && {
            items: { some: { productId: f.productId } },
          }),
        },
        include: { purchase: true, supplier: true, items: true },
        orderBy: { returnDate: "desc" },
      });
      const rows = returns.map((r) => ({
        return_no: r.returnNo,
        purchase_invoice: r.purchase.invoiceNo,
        date: r.returnDate,
        supplier: r.supplier?.name || "—",
        items: r.items.length,
        refund: decimalToNumber(r.refundAmount),
      }));
      return {
        title: "Purchase Return Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.refund, 0),
        },
      };
    }
    case "damaged_stock": {
      const movements = await prisma.stockMovement.findMany({
        where: {
          tenantId: f.tenantId,
          type: "DAMAGE",
          createdAt: { gte: f.from, lte: f.to },
          status: "APPROVED",
          ...(f.branchId && { branchId: f.branchId }),
          ...(f.productId && { productId: f.productId }),
        },
        include: { product: true, branch: true, user: true },
        orderBy: { createdAt: "desc" },
      });
      const rows = movements.map((m) => ({
        date: m.createdAt,
        product: m.product.name,
        branch: m.branch?.name || "—",
        quantity: decimalToNumber(m.quantity),
        reason: m.reason || "—",
        user: m.user?.name || "—",
      }));
      return {
        title: "Damaged Stock Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + Math.abs(r.quantity), 0),
        },
      };
    }
    case "stock_movements": {
      const movements = await prisma.stockMovement.findMany({
        where: {
          tenantId: f.tenantId,
          createdAt: { gte: f.from, lte: f.to },
          status: "APPROVED",
          ...(f.branchId && { branchId: f.branchId }),
          ...(f.productId && { productId: f.productId }),
        },
        include: { product: true, branch: true, user: true },
        orderBy: { createdAt: "desc" },
      });
      const rows = movements.map((m) => ({
        date: m.createdAt,
        type: m.type,
        product: m.product.name,
        branch: m.branch?.name || "—",
        quantity: decimalToNumber(m.quantity),
        reference: m.reference || "—",
        user: m.user?.name || "—",
      }));
      return {
        title: "Stock Movement Report",
        ...meta,
        rows,
        summary: { count: rows.length, total: 0 },
      };
    }
    case "payments": {
      const [customerPay, supplierPay] = await Promise.all([
        prisma.customerPayment.findMany({
          where: {
            tenantId: f.tenantId,
            paymentDate: { gte: f.from, lte: f.to },
            status: "completed",
            reversedAt: null,
            ...(f.customerId && { customerId: f.customerId }),
          },
          include: { customer: true },
          orderBy: { paymentDate: "desc" },
        }),
        prisma.supplierPayment.findMany({
          where: {
            tenantId: f.tenantId,
            paymentDate: { gte: f.from, lte: f.to },
            status: "completed",
            reversedAt: null,
            ...(f.supplierId && { supplierId: f.supplierId }),
          },
          include: { supplier: true },
          orderBy: { paymentDate: "desc" },
        }),
      ]);
      const rows = [
        ...customerPay.map((p) => ({
          type: "Customer payment",
          party: p.customer.name,
          date: p.paymentDate,
          method: p.method,
          amount: decimalToNumber(p.amount),
          reference: p.transactionRef || "—",
        })),
        ...supplierPay.map((p) => ({
          type: "Supplier payment",
          party: p.supplier.name,
          date: p.paymentDate,
          method: p.method,
          amount: decimalToNumber(p.amount),
          reference: p.transactionRef || "—",
        })),
      ].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return {
        title: "Payment Report",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.amount, 0),
        },
      };
    }
    case "top_selling": {
      const items = await prisma.saleItem.findMany({
        where: { sale: saleWhere(f) },
        include: { product: true },
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
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 50)
        .map((r, i) => ({
          rank: i + 1,
          product: r.name,
          quantity: r.qty,
          total: r.total,
        }));
      return {
        title: "Top-selling Products",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.total, 0),
        },
      };
    }
    case "slow_moving": {
      const items = await prisma.saleItem.findMany({
        where: { sale: saleWhere(f) },
        include: { product: true },
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
      const activeProducts = await prisma.product.findMany({
        where: { tenantId: f.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, stockQty: true },
      });
      const rows = activeProducts
        .map((p) => ({
          product: p.name,
          quantity_sold: map.get(p.id)?.qty ?? 0,
          revenue: map.get(p.id)?.total ?? 0,
          stock: decimalToNumber(p.stockQty),
        }))
        .sort((a, b) => a.quantity_sold - b.quantity_sold)
        .slice(0, 50);
      return {
        title: "Slow-moving Products",
        ...meta,
        rows,
        summary: {
          count: rows.length,
          total: rows.reduce((s, r) => s + r.revenue, 0),
        },
      };
    }
    case "daily_closing": {
      const dayStart = f.from;
      const dayEnd = f.to;
      const [salesAgg, purchaseAgg, expenseAgg, saleCount, customerPay] =
        await Promise.all([
          prisma.sale.aggregate({
            where: {
              tenantId: f.tenantId,
              saleDate: { gte: dayStart, lte: dayEnd },
              status: "COMPLETED",
              ...(f.branchId && { branchId: f.branchId }),
            },
            _sum: { total: true, paidAmount: true, dueAmount: true },
            _count: true,
          }),
          prisma.purchase.aggregate({
            where: {
              tenantId: f.tenantId,
              purchaseDate: { gte: dayStart, lte: dayEnd },
            },
            _sum: { total: true },
            _count: true,
          }),
          prisma.expense.aggregate({
            where: {
              tenantId: f.tenantId,
              expenseDate: { gte: dayStart, lte: dayEnd },
              deletedAt: null,
            },
            _sum: { amount: true },
          }),
          prisma.sale.count({
            where: {
              tenantId: f.tenantId,
              saleDate: { gte: dayStart, lte: dayEnd },
              status: "COMPLETED",
            },
          }),
          prisma.customerPayment.aggregate({
            where: {
              tenantId: f.tenantId,
              paymentDate: { gte: dayStart, lte: dayEnd },
              status: "completed",
              reversedAt: null,
            },
            _sum: { amount: true },
          }),
        ]);
      const salesTotal = decimalToNumber(salesAgg._sum.total);
      const rows = [
        { metric: "Sales invoices", value: saleCount },
        { metric: "Gross sales", value: salesTotal },
        { metric: "Amount collected", value: decimalToNumber(salesAgg._sum.paidAmount) },
        { metric: "Sales due added", value: decimalToNumber(salesAgg._sum.dueAmount) },
        { metric: "Customer payments received", value: decimalToNumber(customerPay._sum.amount) },
        { metric: "Purchases", value: decimalToNumber(purchaseAgg._sum.total) },
        { metric: "Purchase count", value: purchaseAgg._count },
        { metric: "Expenses", value: decimalToNumber(expenseAgg._sum.amount) },
        {
          metric: "Net cash (est.)",
          value:
            decimalToNumber(salesAgg._sum.paidAmount) +
            decimalToNumber(customerPay._sum.amount) -
            decimalToNumber(purchaseAgg._sum.total) -
            decimalToNumber(expenseAgg._sum.amount),
        },
      ];
      return {
        title: "Daily Closing Report",
        ...meta,
        rows,
        summary: { count: rows.length, total: salesTotal },
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
          deletedAt: null,
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
