import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPaymentGatewayConfig,
  savePaymentGatewayConfig,
} from "@/lib/payment-settings";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const config = await getPaymentGatewayConfig();
  return NextResponse.json({
    ...config,
    stripeSecretKey: config.stripeSecretKey
      ? config.stripeSecretKey.slice(0, 12) + "…"
      : "",
    sslcommerzStorePass: config.sslcommerzStorePass ? "••••••••" : "",
    stripeWebhookSecret: config.stripeWebhookSecret
      ? "••••••••"
      : "",
  });
}

export async function PATCH(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await request.json();
  const existing = await getPaymentGatewayConfig();

  await savePaymentGatewayConfig({
    stripeEnabled: body.stripeEnabled,
    stripePublishableKey: body.stripePublishableKey,
    stripeSecretKey:
      body.stripeSecretKey && !body.stripeSecretKey.includes("…")
        ? body.stripeSecretKey
        : existing.stripeSecretKey,
    stripeWebhookSecret:
      body.stripeWebhookSecret && body.stripeWebhookSecret !== "••••••••"
        ? body.stripeWebhookSecret
        : existing.stripeWebhookSecret,
    sslcommerzEnabled: body.sslcommerzEnabled,
    sslcommerzStoreId: body.sslcommerzStoreId,
    sslcommerzStorePass:
      body.sslcommerzStorePass && body.sslcommerzStorePass !== "••••••••"
        ? body.sslcommerzStorePass
        : existing.sslcommerzStorePass,
    sslcommerzSandbox: body.sslcommerzSandbox,
    defaultGateway: body.defaultGateway,
  });

  return NextResponse.json({ success: true });
}
