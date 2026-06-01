import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { getTenantSettings } from "@/lib/tenant-settings";

const DEDUP_HOURS = 24;

async function hasRecentNotification(
  tenantId: string,
  type: string,
  titlePrefix: string
) {
  const existing = await prisma.notification.findFirst({
    where: {
      tenantId,
      type,
      title: { startsWith: titlePrefix },
      createdAt: { gte: new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000) },
    },
  });
  return !!existing;
}

export async function syncDueNotifications(tenantId: string) {
  const settings = await getTenantSettings(tenantId);
  const prefs = settings.notifications ?? {};

  const [
    customerDueCount,
    supplierDueCount,
    purchaseDueCount,
    pendingReturns,
  ] = await Promise.all([
    prefs.inAppCustomerDue !== false
      ? prisma.sale.count({
          where: {
            tenantId,
            status: "COMPLETED",
            dueAmount: { gt: 0 },
          },
        })
      : Promise.resolve(0),
    prefs.inAppSupplierDue !== false
      ? prisma.purchase.count({
          where: {
            tenantId,
            dueAmount: { gt: 0 },
          },
        })
      : Promise.resolve(0),
    prefs.inAppPurchaseDue !== false
      ? prisma.purchase.count({
          where: {
            tenantId,
            paymentStatus: { in: ["DUE", "PARTIAL"] },
          },
        })
      : Promise.resolve(0),
    prefs.inAppSaleReturn !== false
      ? prisma.saleReturn.count({
          where: {
            tenantId,
            status: { in: ["DRAFT", "PENDING"] },
          },
        })
      : Promise.resolve(0),
  ]);

  if (customerDueCount > 0) {
    const prefix = "Customer due:";
    if (!(await hasRecentNotification(tenantId, "customer_due", prefix))) {
      await prisma.notification.create({
        data: {
          tenantId,
          type: "customer_due",
          title: `${prefix} ${customerDueCount} invoice(s)`,
          message: "Customers have outstanding balances on completed sales.",
          link: "/dashboard/reports/customer_due",
        },
      });
    }
  }

  if (supplierDueCount > 0) {
    const prefix = "Supplier due:";
    if (!(await hasRecentNotification(tenantId, "supplier_due", prefix))) {
      await prisma.notification.create({
        data: {
          tenantId,
          type: "supplier_due",
          title: `${prefix} ${supplierDueCount} bill(s)`,
          message: "Suppliers have outstanding purchase balances.",
          link: "/dashboard/reports/supplier_due",
        },
      });
    }
  }

  if (purchaseDueCount > 0) {
    const prefix = "Purchase due:";
    if (!(await hasRecentNotification(tenantId, "purchase_due", prefix))) {
      await prisma.notification.create({
        data: {
          tenantId,
          type: "purchase_due",
          title: `${prefix} ${purchaseDueCount} purchase(s)`,
          message: "Purchases are unpaid or partially paid.",
          link: "/dashboard/purchases",
        },
      });
    }
  }

  if (pendingReturns > 0) {
    const prefix = "Sale returns:";
    if (!(await hasRecentNotification(tenantId, "sale_return", prefix))) {
      await prisma.notification.create({
        data: {
          tenantId,
          type: "sale_return",
          title: `${prefix} ${pendingReturns} pending`,
          message: "Sale returns need processing or approval.",
          link: "/dashboard/sale-returns",
        },
      });
    }
  }

  return {
    customerDueCount,
    supplierDueCount,
    purchaseDueCount,
    pendingReturns,
  };
}

export async function getDueSummary(tenantId: string) {
  const [customerDueTotal, supplierDueTotal] = await Promise.all([
    prisma.sale.aggregate({
      where: { tenantId, status: "COMPLETED", dueAmount: { gt: 0 } },
      _sum: { dueAmount: true },
    }),
    prisma.purchase.aggregate({
      where: { tenantId, dueAmount: { gt: 0 } },
      _sum: { dueAmount: true },
    }),
  ]);

  return {
    customerDueTotal: decimalToNumber(customerDueTotal._sum.dueAmount),
    supplierDueTotal: decimalToNumber(supplierDueTotal._sum.dueAmount),
  };
}
