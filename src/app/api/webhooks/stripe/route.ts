import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPaymentGatewayConfig } from "@/lib/payment-settings";
import { activateSubscriptionAfterPayment } from "@/lib/billing";

export async function POST(request: Request) {
  const config = await getPaymentGatewayConfig();
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      config.stripeWebhookSecret
    );
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const checkoutId = session.metadata?.checkoutId;
    const tenantId = session.metadata?.tenantId;

    if (checkoutId && tenantId && session.payment_status === "paid") {
      await activateSubscriptionAfterPayment(
        tenantId,
        checkoutId,
        (session.payment_intent as string) || session.id,
        "stripe"
      );
    }
  }

  return NextResponse.json({ received: true });
}
