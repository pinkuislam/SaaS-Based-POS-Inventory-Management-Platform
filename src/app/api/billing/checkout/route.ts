import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireTenantSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPaymentGatewayConfig } from "@/lib/payment-settings";
import { createSslcommerzSession } from "@/lib/sslcommerz";
import { decimalToNumber } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";

export async function POST(request: Request) {
  const authResult = await requireTenantSession();
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { gateway } = await request.json();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      package: true,
      subscriptions: { orderBy: { endDate: "desc" }, take: 1 },
    },
  });

  if (!tenant?.package) {
    return NextResponse.json({ error: "No package assigned" }, { status: 400 });
  }

  const amount = decimalToNumber(tenant.package.price);
  const subscriptionId = tenant.subscriptions[0]?.id;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const billingPath = tenantDashboardPath(tenant.slug, "/settings/billing");

  const checkout = await prisma.billingCheckout.create({
    data: {
      tenantId,
      subscriptionId,
      amount: tenant.package.price,
      currency: gateway === "sslcommerz" ? "BDT" : "USD",
      gateway,
      status: "pending",
    },
  });

  const paymentConfig = await getPaymentGatewayConfig();

  if (gateway === "stripe") {
    if (!paymentConfig.stripeEnabled || !paymentConfig.stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(paymentConfig.stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tenant.package.name} Subscription`,
              description: `${tenant.package.billingCycle} plan for ${tenant.name}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        checkoutId: checkout.id,
        tenantId,
      },
      success_url: `${baseUrl}${billingPath}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${billingPath}?cancelled=1`,
    });

    await prisma.billingCheckout.update({
      where: { id: checkout.id },
      data: { externalRef: session.id },
    });

    return NextResponse.json({ url: session.url, gateway: "stripe" });
  }

  if (gateway === "sslcommerz") {
    if (!paymentConfig.sslcommerzEnabled) {
      return NextResponse.json(
        { error: "SSLCommerz is not configured" },
        { status: 400 }
      );
    }

    const { gatewayUrl } = await createSslcommerzSession({
      tranId: checkout.id,
      amount,
      currency: "BDT",
      productName: `${tenant.package.name} Subscription`,
      customerName: tenant.name,
      customerEmail: tenant.email,
      customerPhone: tenant.phone || "01700000000",
      successUrl: `${baseUrl}/api/billing/sslcommerz/success`,
      failUrl: `${baseUrl}${billingPath}?failed=1`,
      cancelUrl: `${baseUrl}${billingPath}?cancelled=1`,
      ipnUrl: `${baseUrl}/api/billing/sslcommerz/ipn`,
    });

    return NextResponse.json({ url: gatewayUrl, gateway: "sslcommerz" });
  }

  return NextResponse.json({ error: "Invalid gateway" }, { status: 400 });
}
