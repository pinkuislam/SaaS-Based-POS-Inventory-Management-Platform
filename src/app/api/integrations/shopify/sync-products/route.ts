import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  fetchAllShopifyProducts,
  shopifyConfigFromSetting,
} from "@/lib/shopify";
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
    where: ecommerceSettingKey(tenantId, "shopify"),
  });

  if (!setting?.isActive || setting.platform !== "shopify") {
    return NextResponse.json(
      { error: "Shopify not configured or inactive" },
      { status: 400 }
    );
  }

  const config = shopifyConfigFromSetting(setting);
  let created = 0;
  let updated = 0;

  try {
    const products = await fetchAllShopifyProducts(config);

    for (const sp of products) {
      for (const variant of sp.variants) {
        const sku = variant.sku || `SHOPIFY-${variant.id}`;
        const sellingPrice = parseFloat(variant.price || "0") || 0;
        const stockQty = variant.inventory_quantity ?? 0;
        const name =
          sp.variants.length > 1
            ? `${sp.title} — ${variant.sku || variant.id}`
            : sp.title;

        const existing = await prisma.product.findFirst({
          where: { tenantId, OR: [{ sku }, { barcode: sku }] },
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name,
              sellingPrice,
              ...(setting.syncStock && { stockQty }),
            },
          });
          updated++;
        } else {
          await prisma.product.create({
            data: {
              tenantId,
              name,
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
    }

    await prisma.ecommerceSetting.update({
      where: ecommerceSettingKey(tenantId, "shopify"),
      data: { lastProductSync: new Date() },
    });

    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name,
      action: "shopify_sync_products",
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
      action: "shopify_sync_products_failed",
      module: "integrations",
      details: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
