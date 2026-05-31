import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireTenantSession } from "@/lib/api-auth";
import { getPaymentGatewayConfig } from "@/lib/payment-settings";
import { activateSubscriptionAfterPayment } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const authResult = await requireTenantSession();
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const config = await getPaymentGatewayConfig();
  if (!config.stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const checkoutId = session.metadata?.checkoutId;
  if (!checkoutId || session.metadata?.tenantId !== tenantId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const existing = await prisma.billingCheckout.findUnique({
    where: { id: checkoutId },
  });
  if (existing?.status === "paid") {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  const result = await activateSubscriptionAfterPayment(
    tenantId,
    checkoutId,
    session.payment_intent as string,
    "stripe"
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
