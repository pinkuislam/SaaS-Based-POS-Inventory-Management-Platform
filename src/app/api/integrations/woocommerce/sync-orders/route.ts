import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { fetchWooOrders } from "@/lib/woocommerce";
import { generateInvoiceNo } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";
import { ecommerceSettingKey } from "@/lib/ecommerce-platform";

export async function POST() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;

  const { getTenantPackageFeatures, hasPackageFeature, PACKAGE_FEATURES } =
    await import("@/lib/package-features");
  const features = await getTenantPackageFeatures(tenantId);
  if (!hasPackageFeature(features, PACKAGE_FEATURES.ECOMMERCE)) {
    return NextResponse.json(
      { error: "E-commerce is not included in your subscription package" },
      { status: 403 }
    );
  }

  const setting = await prisma.ecommerceSetting.findUnique({
    where: ecommerceSettingKey(tenantId, "woocommerce"),
  });

  if (
    !setting?.isActive ||
    setting.platform !== "woocommerce" ||
    !setting.syncOrders
  ) {
    return NextResponse.json(
      { error: "Order sync not enabled" },
      { status: 400 }
    );
  }

  const config = {
    storeUrl: setting.storeUrl,
    consumerKey: setting.consumerKey,
    consumerSecret: setting.consumerSecret,
  };

  try {
  const orders = await fetchWooOrders(
    config,
    setting.lastOrderSync || undefined
  );

  let imported = 0;
  let skipped = 0;

  for (const order of orders) {
    const externalId = String(order.id);
    const existing = await prisma.onlineOrder.findUnique({
      where: {
        tenantId_platform_externalId: {
          tenantId,
          platform: "woocommerce",
          externalId,
        },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const customerName = [order.billing.first_name, order.billing.last_name]
      .filter(Boolean)
      .join(" ");
    const total = parseFloat(order.total) || 0;

    let saleId: string | null = null;

    if (order.line_items.length > 0 && ["completed", "processing"].includes(order.status)) {
      const saleCount = await prisma.sale.count({ where: { tenantId } });
      const invoiceNo = generateInvoiceNo("WEB", saleCount + 1);

      const saleItems: {
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        tax: number;
        total: number;
      }[] = [];

      for (const line of order.line_items) {
        const sku = line.sku || `WC-${line.product_id}`;
        const product = await prisma.product.findFirst({
          where: { tenantId, OR: [{ sku }, { barcode: sku }] },
        });
        if (!product) continue;

        const qty = line.quantity;
        const lineTotal = parseFloat(line.total) || 0;
        const unitPrice = qty > 0 ? lineTotal / qty : 0;

        saleItems.push({
          productId: product.id,
          quantity: qty,
          unitPrice,
          discount: 0,
          tax: 0,
          total: lineTotal,
        });
      }

      if (saleItems.length > 0) {
        const subtotal = saleItems.reduce((s, i) => s + i.total, 0);
        const sale = await prisma.$transaction(async (tx) => {
          const newSale = await tx.sale.create({
            data: {
              tenantId,
              branchId: session.user.branchId,
              userId: session.user.id,
              invoiceNo,
              subtotal,
              total: total || subtotal,
              paidAmount: total || subtotal,
              dueAmount: 0,
              paymentMethod: "online",
              paymentStatus: "PAID",
              status: "COMPLETED",
              notes: `WooCommerce order #${order.number}`,
              items: { create: saleItems },
            },
          });

          for (const item of saleItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { decrement: item.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                tenantId,
                productId: item.productId,
                type: "SALE",
                quantity: -item.quantity,
                reference: invoiceNo,
                notes: "WooCommerce order",
              },
            });
          }

          return newSale;
        });
        saleId = sale.id;
      }
    }

    await prisma.onlineOrder.create({
      data: {
        tenantId,
        externalId,
        platform: "woocommerce",
        orderNumber: order.number,
        customerName: customerName || null,
        customerEmail: order.billing.email || null,
        total,
        status: order.status,
        saleId,
        orderDate: new Date(order.date_created),
      },
    });
    imported++;
  }

  await prisma.ecommerceSetting.update({
    where: ecommerceSettingKey(tenantId, "woocommerce"),
    data: { lastOrderSync: new Date() },
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "woocommerce_sync_orders",
    module: "integrations",
    details: `Imported ${imported}, skipped ${skipped}`,
  });

  return NextResponse.json({ imported, skipped });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    await logActivity({
      tenantId,
      userId: session.user.id,
      userName: session.user.name,
      action: "woocommerce_sync_orders_failed",
      module: "integrations",
      details: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
