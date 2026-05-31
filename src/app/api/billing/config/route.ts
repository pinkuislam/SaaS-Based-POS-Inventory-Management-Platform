import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/api-auth";
import { getPublicPaymentConfig } from "@/lib/payment-settings";

export async function GET() {
  const authResult = await requireTenantSession();
  if ("error" in authResult) return authResult.error;

  const config = await getPublicPaymentConfig();
  return NextResponse.json(config);
}
