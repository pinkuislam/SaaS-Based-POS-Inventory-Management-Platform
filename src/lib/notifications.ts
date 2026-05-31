import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { sendLowStockAlertEmail, isEmailConfigured } from "@/lib/email";

export async function syncLowStockNotifications(tenantId: string) {
  const lowStockProducts = await prisma.product.findMany({
    where: { tenantId, status: "ACTIVE" },
  });

  const lowStock = lowStockProducts.filter(
    (p) => decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel)
  );

  const existingAlerts = await prisma.notification.findMany({
    where: {
      tenantId,
      type: "low_stock",
      isRead: false,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const existingProductIds = new Set(
    existingAlerts
      .map((n) => {
        const match = n.link?.match(/products/);
        return match ? n.title : null;
      })
      .filter(Boolean)
  );

  if (lowStock.length === 0) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, email: true },
  });

  if (isEmailConfigured() && tenant?.email && lowStock.length > 0) {
    const emailedToday = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "low_stock_email",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (!emailedToday) {
      await sendLowStockAlertEmail({
        to: tenant.email,
        businessName: tenant.name,
        products: lowStock.slice(0, 20).map((p) => ({
          name: p.name,
          stockQty: decimalToNumber(p.stockQty),
          reorderLevel: decimalToNumber(p.reorderLevel),
        })),
      });
      await prisma.notification.create({
        data: {
          tenantId,
          type: "low_stock_email",
          title: "Low stock email sent",
          message: `Alert email sent to ${tenant.email} for ${lowStock.length} products`,
          isRead: true,
        },
      });
    }
  }

  if (lowStock.length > 5) {
    const alreadyHasSummary = existingAlerts.some((n) =>
      n.title.includes("products low on stock")
    );
    if (!alreadyHasSummary) {
      await prisma.notification.create({
        data: {
          tenantId,
          type: "low_stock",
          title: `${lowStock.length} products low on stock`,
          message: `Review inventory — ${lowStock
            .slice(0, 3)
            .map((p) => p.name)
            .join(", ")}${lowStock.length > 3 ? "..." : ""}`,
          link: "/dashboard/inventory",
        },
      });
    }
    return;
  }

  for (const product of lowStock) {
    if (existingProductIds.has(product.name)) continue;
    await prisma.notification.create({
      data: {
        tenantId,
        type: "low_stock",
        title: `Low stock: ${product.name}`,
        message: `Current stock ${decimalToNumber(product.stockQty)} — reorder level ${decimalToNumber(product.reorderLevel)}`,
        link: "/dashboard/inventory",
      },
    });
  }
}

export async function getUnreadNotifications(tenantId: string, limit = 10) {
  return prisma.notification.findMany({
    where: { tenantId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
