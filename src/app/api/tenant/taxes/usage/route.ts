import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getTenantSettings } from "@/lib/tenant-settings";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const taxId = searchParams.get("id");
  const rateParam = searchParams.get("rate");

  const settings = await getTenantSettings(tenantId);
  const tax = settings.taxes?.find((t) => t.id === taxId);
  const rate =
    rateParam != null
      ? parseFloat(rateParam)
      : tax?.rate;

  if (rate == null || Number.isNaN(rate)) {
    return NextResponse.json({ error: "Invalid tax" }, { status: 400 });
  }

  const [productsCount, salesWithTax] = await Promise.all([
    prisma.product.count({
      where: {
        tenantId,
        status: "ACTIVE",
        taxRate: rate,
      },
    }),
    prisma.sale.count({
      where: {
        tenantId,
        status: "COMPLETED",
        tax: { gt: 0 },
      },
    }),
  ]);

  const inUse = productsCount > 0 || salesWithTax > 0;

  return NextResponse.json({
    inUse,
    productsCount,
    salesWithTaxCount: salesWithTax,
    message: inUse
      ? "This tax rate appears on products or historical invoices. Deactivating is safer than deleting."
      : null,
  });
}
