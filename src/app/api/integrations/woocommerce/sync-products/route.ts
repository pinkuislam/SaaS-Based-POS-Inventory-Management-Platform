import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { fetchWooProducts } from "@/lib/woocommerce";
import { logActivity } from "@/lib/activity-log";
import { ecommerceSettingKey } from "@/lib/ecommerce-platform";

export async function POST() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;

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

  if (!setting?.isActive || setting.platform !== "woocommerce") {
    return NextResponse.json(
      { error: "WooCommerce not configured or inactive" },
      { status: 400 }
    );
  }

  const config = {
    storeUrl: setting.storeUrl,
    consumerKey: setting.consumerKey,
    consumerSecret: setting.consumerSecret,
  };

  let created = 0;
  let updated = 0;

  try {
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 10) {
    const products = await fetchWooProducts(config, page);
    if (products.length === 0) {
      hasMore = false;
      break;
    }

    for (const wp of products) {
      const sku = wp.sku || `WC-${wp.id}`;
      const sellingPrice = parseFloat(wp.price || wp.regular_price || "0") || 0;
      const stockQty = wp.manage_stock ? wp.stock_quantity ?? 0 : 0;

      const existing = await prisma.product.findFirst({
        where: { tenantId, OR: [{ sku }, { barcode: sku }] },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: wp.name,
            sellingPrice,
            ...(setting.syncStock && { stockQty }),
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            tenantId,
            name: wp.name,
            sku,
            barcode: sku,
            sellingPrice,
            purchasePrice: sellingPrice * 0.7,
            stockQty: setting.syncStock ? stockQty : 0,
            reorderLevel: 5,
          },
        });
        created++;
      }
    }

    page++;
    if (products.length < 100) hasMore = false;
  }

  await prisma.ecommerceSetting.update({
    where: ecommerceSettingKey(tenantId, "woocommerce"),
    data: { lastProductSync: new Date() },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name,
    action: "woocommerce_sync_products",
    module: "integrations",
    details: `Created ${created}, updated ${updated}`,
  });

  return NextResponse.json({ created, updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name,
      action: "woocommerce_sync_products_failed",
      module: "integrations",
      details: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
