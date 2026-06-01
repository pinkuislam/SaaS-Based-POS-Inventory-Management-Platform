import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ecommerceSettingKey } from "@/lib/ecommerce-platform";
import { testShopifyConnection, shopifyConfigFromSetting } from "@/lib/shopify";

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();

  let config = {
    storeUrl: body.storeUrl as string,
    accessToken: (body.accessToken || body.consumerKey) as string,
  };

  if (!config.storeUrl && body.useSaved) {
    const saved = await prisma.ecommerceSetting.findUnique({
      where: ecommerceSettingKey(tenantId, "shopify"),
    });
    if (!saved) {
      return NextResponse.json({ error: "No saved settings" }, { status: 400 });
    }
    config = shopifyConfigFromSetting(saved);
  }

  const result = await testShopifyConnection(config);
  return NextResponse.json(result);
}
