import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import {
  getTenantSettings,
  updateTenantSettings,
  type TenantSettings,
  type TenantTaxRate,
} from "@/lib/tenant-settings";

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const settings = await getTenantSettings(authResult.session.user.tenantId!);
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const current = await getTenantSettings(tenantId);

  const merged: TenantSettings = {
    ...current,
    ...(body.pos && { pos: { ...current.pos, ...body.pos } }),
    ...(body.business && {
      business: { ...current.business, ...body.business },
    }),
    ...(body.loyalty && { loyalty: { ...current.loyalty, ...body.loyalty } }),
    ...(body.invoice && { invoice: { ...current.invoice, ...body.invoice } }),
    ...(body.taxes !== undefined && { taxes: body.taxes as TenantTaxRate[] }),
    ...(body.notifications && {
      notifications: { ...current.notifications, ...body.notifications },
    }),
    ...(body.stock && { stock: { ...current.stock, ...body.stock } }),
    ...(body.returnPolicy && {
      returnPolicy: { ...current.returnPolicy, ...body.returnPolicy },
    }),
    ...(body.general && { general: { ...current.general, ...body.general } }),
    ...(body.security && {
      security: { ...current.security, ...body.security },
    }),
  };

  await updateTenantSettings(tenantId, merged);
  return NextResponse.json(merged);
}
