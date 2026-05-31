import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const setting = await prisma.ecommerceSetting.findUnique({
    where: { tenantId },
  });

  if (!setting) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: setting.id,
    platform: setting.platform,
    storeUrl: setting.storeUrl,
    consumerKey: setting.consumerKey.slice(0, 8) + "…",
    isActive: setting.isActive,
    syncProducts: setting.syncProducts,
    syncStock: setting.syncStock,
    syncOrders: setting.syncOrders,
    lastProductSync: setting.lastProductSync,
    lastOrderSync: setting.lastOrderSync,
    hasCredentials: true,
  });
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const {
    storeUrl,
    consumerKey,
    consumerSecret,
    isActive,
    syncProducts,
    syncStock,
    syncOrders,
  } = body;

  const existing = await prisma.ecommerceSetting.findUnique({
    where: { tenantId },
  });

  const finalKey = consumerKey?.trim() || existing?.consumerKey;
  const finalSecret = consumerSecret?.trim() || existing?.consumerSecret;

  if (!storeUrl?.trim() || !finalKey || !finalSecret) {
    return NextResponse.json(
      { error: "Store URL, consumer key, and secret are required" },
      { status: 400 }
    );
  }

  const setting = await prisma.ecommerceSetting.upsert({
    where: { tenantId },
    create: {
      tenantId,
      storeUrl: storeUrl.trim().replace(/\/$/, ""),
      consumerKey: finalKey,
      consumerSecret: finalSecret,
      isActive: isActive !== false,
      syncProducts: syncProducts !== false,
      syncStock: syncStock !== false,
      syncOrders: syncOrders !== false,
    },
    update: {
      storeUrl: storeUrl.trim().replace(/\/$/, ""),
      consumerKey: finalKey,
      consumerSecret: finalSecret,
      isActive: isActive !== false,
      syncProducts: syncProducts !== false,
      syncStock: syncStock !== false,
      syncOrders: syncOrders !== false,
    },
  });

  return NextResponse.json({
    id: setting.id,
    storeUrl: setting.storeUrl,
    isActive: setting.isActive,
  });
}
