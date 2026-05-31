import { NextResponse } from "next/server";
import { validateSslcommerzPayment } from "@/lib/sslcommerz";
import { activateSubscriptionAfterPayment } from "@/lib/billing";
import { tenantDashboardPath } from "@/lib/tenant-path";

export async function POST(request: Request) {
  const form = await request.formData();
  const valId = form.get("val_id")?.toString();
  const tranId = form.get("tran_id")?.toString();
  const status = form.get("status")?.toString();

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  async function billingRedirect(
    tenantId: string | undefined,
    query: string
  ) {
    const { prisma } = await import("@/lib/prisma");
    const tenant = tenantId
      ? await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { slug: true },
        })
      : null;
    const path = tenant
      ? tenantDashboardPath(tenant.slug, `/settings/billing?${query}`)
      : `/login`;
    return NextResponse.redirect(`${baseUrl}${path}`);
  }

  if (!valId || !tranId || status !== "VALID") {
    return billingRedirect(undefined, "failed=1");
  }

  try {
    const validation = await validateSslcommerzPayment(valId);
    if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
      return billingRedirect(undefined, "failed=1");
    }

    const checkoutId = tranId;
    const { prisma } = await import("@/lib/prisma");
    const checkout = await prisma.billingCheckout.findUnique({
      where: { id: checkoutId },
    });
    if (!checkout) {
      return billingRedirect(undefined, "failed=1");
    }
    await activateSubscriptionAfterPayment(
      checkout.tenantId,
      checkoutId,
      valId,
      "sslcommerz"
    );

    return billingRedirect(checkout.tenantId, "success=1");
  } catch {
    return billingRedirect(undefined, "failed=1");
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  const fakeRequest = new Request(request.url, {
    method: "POST",
    body: params,
  });
  return POST(fakeRequest);
}
