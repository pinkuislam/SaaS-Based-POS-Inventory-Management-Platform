import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { addMonths, addYears } from "date-fns";

export async function activateSubscriptionAfterPayment(
  tenantId: string,
  checkoutId: string,
  transactionId: string,
  gateway: string
) {
  const checkout = await prisma.billingCheckout.findFirst({
    where: { id: checkoutId, tenantId, status: "pending" },
  });
  if (!checkout) return { ok: false, error: "Checkout not found" };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true, subscriptions: { orderBy: { endDate: "desc" }, take: 1 } },
  });
  if (!tenant?.package) return { ok: false, error: "Tenant package missing" };

  const amount = decimalToNumber(checkout.amount);
  const billingCycle = tenant.package.billingCycle;
  const currentEnd = tenant.subscriptions[0]?.endDate ?? new Date();
  const baseDate = currentEnd > new Date() ? currentEnd : new Date();
  const newEnd =
    billingCycle === "yearly"
      ? addYears(baseDate, 1)
      : addMonths(baseDate, 1);

  await prisma.$transaction(async (tx) => {
    await tx.billingCheckout.update({
      where: { id: checkoutId },
      data: { status: "paid", externalRef: transactionId },
    });

    const sub = tenant.subscriptions[0];
    if (sub) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          endDate: newEnd,
          amount: checkout.amount,
        },
      });
      await tx.subscriptionPayment.create({
        data: {
          subscriptionId: sub.id,
          amount: checkout.amount,
          method: gateway,
          transactionId,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    } else {
      const newSub = await tx.subscription.create({
        data: {
          tenantId,
          packageId: tenant.packageId!,
          endDate: newEnd,
          status: "ACTIVE",
          amount: checkout.amount,
        },
      });
      await tx.subscriptionPayment.create({
        data: {
          subscriptionId: newSub.id,
          amount: checkout.amount,
          method: gateway,
          transactionId,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    await tx.tenant.update({
      where: { id: tenantId },
      data: { status: "ACTIVE" },
    });
  });

  return { ok: true };
}
