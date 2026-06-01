import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  ecommerceSettingKey,
  parsePlatform,
  type EcommercePlatform,
} from "@/lib/ecommerce-platform";

function maskSetting(setting: {
  id: string;
  platform: string;
  storeUrl: string;
  consumerKey: string;
  isActive: boolean;
  syncProducts: boolean;
  syncStock: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  syncDirection: string;
  webhookSecret: string | null;
  lastProductSync: Date | null;
  lastOrderSync: Date | null;
  lastCustomerSync: Date | null;
}) {
  return {
    id: setting.id,
    platform: setting.platform,
    storeUrl: setting.storeUrl,
    consumerKey: setting.consumerKey.slice(0, 8) + "…",
    isActive: setting.isActive,
    syncProducts: setting.syncProducts,
    syncStock: setting.syncStock,
    syncOrders: setting.syncOrders,
    syncCustomers: setting.syncCustomers,
    syncDirection: setting.syncDirection,
    webhookSecret: setting.webhookSecret ? "••••••••" : null,
    hasWebhookSecret: !!setting.webhookSecret,
    lastProductSync: setting.lastProductSync,
    lastOrderSync: setting.lastOrderSync,
    lastCustomerSync: setting.lastCustomerSync,
    hasCredentials: true,
  };
}

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const platform = parsePlatform(searchParams.get("platform"));

  const setting = await prisma.ecommerceSetting.findUnique({
    where: ecommerceSettingKey(tenantId, platform),
  });

  if (!setting) {
    return NextResponse.json(null);
  }

  return NextResponse.json(maskSetting(setting));
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const platform = parsePlatform(body.platform as string);
  const {
    storeUrl,
    consumerKey,
    consumerSecret,
    isActive,
    syncProducts,
    syncStock,
    syncOrders,
    syncCustomers,
    syncDirection,
    webhookSecret,
  } = body;

  const existing = await prisma.ecommerceSetting.findUnique({
    where: ecommerceSettingKey(tenantId, platform),
  });

  const finalKey = consumerKey?.trim() || existing?.consumerKey;
  const finalSecret =
    consumerSecret?.trim() ||
    existing?.consumerSecret ||
    (platform === "shopify" ? "-" : "");

  if (!storeUrl?.trim() || !finalKey) {
    return NextResponse.json(
      {
        error:
          platform === "shopify"
            ? "Store URL and Admin API access token are required"
            : "Store URL, consumer key, and secret are required",
      },
      { status: 400 }
    );
  }

  if (platform === "woocommerce" && (!finalSecret || finalSecret === "-")) {
    return NextResponse.json(
      { error: "Consumer secret is required for WooCommerce" },
      { status: 400 }
    );
  }

  const normalizedUrl = storeUrl.trim().replace(/\/$/, "");

  const setting = await prisma.ecommerceSetting.upsert({
    where: ecommerceSettingKey(tenantId, platform),
    create: {
      tenantId,
      platform,
      storeUrl: normalizedUrl,
      consumerKey: finalKey,
      consumerSecret: finalSecret,
      isActive: isActive !== false,
      syncProducts: syncProducts !== false,
      syncStock: syncStock !== false,
      syncOrders: syncOrders !== false,
      syncCustomers: syncCustomers === true,
      syncDirection:
        syncDirection === "outbound" || syncDirection === "both"
          ? syncDirection
          : "inbound",
      webhookSecret: webhookSecret?.trim() || null,
    },
    update: {
      storeUrl: normalizedUrl,
      consumerKey: finalKey,
      consumerSecret: finalSecret,
      isActive: isActive !== false,
      syncProducts: syncProducts !== false,
      syncStock: syncStock !== false,
      syncOrders: syncOrders !== false,
      syncCustomers: syncCustomers === true,
      syncDirection:
        syncDirection === "outbound" || syncDirection === "both"
          ? syncDirection
          : existing?.syncDirection || "inbound",
      ...(webhookSecret !== undefined && {
        webhookSecret: webhookSecret?.trim() || null,
      }),
    },
  });

  return NextResponse.json({
    id: setting.id,
    platform: setting.platform,
    storeUrl: setting.storeUrl,
    isActive: setting.isActive,
  });
}

export async function DELETE(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const platformParam = searchParams.get("platform");

  if (platformParam) {
    const platform = parsePlatform(platformParam);
    await prisma.ecommerceSetting.deleteMany({
      where: { tenantId, platform },
    });
  } else {
    await prisma.ecommerceSetting.deleteMany({ where: { tenantId } });
  }

  return NextResponse.json({ success: true });
}
