import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { testWooCommerceConnection } from "@/lib/woocommerce";

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();

  let config = {
    storeUrl: body.storeUrl as string,
    consumerKey: body.consumerKey as string,
    consumerSecret: body.consumerSecret as string,
  };

  if (!config.storeUrl && body.useSaved) {
    const saved = await prisma.ecommerceSetting.findUnique({
      where: { tenantId },
    });
    if (!saved) {
      return NextResponse.json({ error: "No saved settings" }, { status: 400 });
    }
    config = {
      storeUrl: saved.storeUrl,
      consumerKey: saved.consumerKey,
      consumerSecret: saved.consumerSecret,
    };
  }

  const result = await testWooCommerceConnection(config);
  return NextResponse.json(result);
}
