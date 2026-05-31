import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSslcommerzPayment } from "@/lib/sslcommerz";
import { activateSubscriptionAfterPayment } from "@/lib/billing";

export async function POST(request: Request) {
  const form = await request.formData();
  const valId = form.get("val_id")?.toString();
  const tranId = form.get("tran_id")?.toString();
  const status = form.get("status")?.toString();

  if (!valId || !tranId || status !== "VALID") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const checkout = await prisma.billingCheckout.findUnique({
    where: { id: tranId },
  });
  if (!checkout || checkout.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  const validation = await validateSslcommerzPayment(valId);
  if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  await activateSubscriptionAfterPayment(
    checkout.tenantId,
    tranId,
    valId,
    "sslcommerz"
  );

  return NextResponse.json({ ok: true });
}
