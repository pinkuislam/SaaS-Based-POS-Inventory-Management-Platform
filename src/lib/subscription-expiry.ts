import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function processSubscriptionExpiry() {
  const now = new Date();

  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    include: { tenant: true, package: true },
  });

  let expired = 0;
  let graceWarnings = 0;

  for (const sub of activeSubs) {
    const graceDays = sub.package?.graceDays ?? 7;
    const graceEnd = addDays(sub.endDate, graceDays);

    if (now > graceEnd) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        }),
        prisma.tenant.update({
          where: { id: sub.tenantId },
          data: { status: "EXPIRED" },
        }),
      ]);
      expired++;

      await prisma.notification.create({
        data: {
          tenantId: sub.tenantId,
          type: "subscription_expired",
          title: "Subscription Expired",
          message: `Your ${sub.package?.name || ""} plan has expired. Renew to continue using the platform.`,
          link: "/dashboard/settings/billing",
        },
      });
    } else if (now > sub.endDate && now <= graceEnd) {
      const existing = await prisma.notification.findFirst({
        where: {
          tenantId: sub.tenantId,
          type: "subscription_grace",
          createdAt: { gte: addDays(now, -1) },
        },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            tenantId: sub.tenantId,
            type: "subscription_grace",
            title: "Subscription Grace Period",
            message: `Your plan expired but you have until ${graceEnd.toLocaleDateString()} to renew.`,
            link: "/dashboard/settings/billing",
          },
        });
        graceWarnings++;
      }
    } else if (now < sub.endDate && addDays(now, 7) >= sub.endDate) {
      const existing = await prisma.notification.findFirst({
        where: {
          tenantId: sub.tenantId,
          type: "subscription_expiring",
          createdAt: { gte: addDays(now, -3) },
        },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            tenantId: sub.tenantId,
            type: "subscription_expiring",
            title: "Subscription Expiring Soon",
            message: `Your plan expires on ${sub.endDate.toLocaleDateString()}.`,
            link: "/dashboard/settings/billing",
          },
        });
      }
    }
  }

  return { expired, graceWarnings };
}
