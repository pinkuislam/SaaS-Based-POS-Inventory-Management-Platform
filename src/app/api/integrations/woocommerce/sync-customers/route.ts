import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { fetchWooCustomers } from "@/lib/woocommerce";
import { logActivity } from "@/lib/activity-log";
import { ecommerceSettingKey } from "@/lib/ecommerce-platform";

export async function POST() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const setting = await prisma.ecommerceSetting.findUnique({
    where: ecommerceSettingKey(tenantId, "woocommerce"),
  });

  if (!setting?.isActive) {
    return NextResponse.json(
      { error: "WooCommerce is not connected" },
      { status: 400 }
    );
  }

  const config = {
    storeUrl: setting.storeUrl,
    consumerKey: setting.consumerKey,
    consumerSecret: setting.consumerSecret,
  };

  let created = 0;
  let updated = 0;
  let page = 1;

  try {
    while (page <= 10) {
      const customers = await fetchWooCustomers(config, page);
      if (customers.length === 0) break;

      for (const c of customers) {
        const name =
          `${c.first_name} ${c.last_name}`.trim() ||
          c.email ||
          `Customer ${c.id}`;
        const phone = c.billing?.phone?.trim() || null;
        const email = c.email?.trim() || null;

        const existing = await prisma.customer.findFirst({
          where: {
            tenantId,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
        });

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: existing.name || name,
              email: email || existing.email,
              phone: phone || existing.phone,
            },
          });
          updated++;
        } else {
          await prisma.customer.create({
            data: {
              tenantId,
              name,
              email,
              phone,
              customerType: "retail",
            },
          });
          created++;
        }
      }

      if (customers.length < 100) break;
      page++;
    }

    await prisma.ecommerceSetting.update({
      where: { id: setting.id },
      data: { lastCustomerSync: new Date() },
    });

    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name || undefined,
      action: "sync_customers",
      module: "integrations",
      details: `WooCommerce: ${created} created, ${updated} updated`,
    });

    return NextResponse.json({ created, updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name || undefined,
      action: "sync_customers_failed",
      module: "integrations",
      details: msg,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
