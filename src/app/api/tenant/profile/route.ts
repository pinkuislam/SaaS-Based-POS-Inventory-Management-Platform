import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateTenantSettings, type TenantSettings } from "@/lib/tenant-settings";

export async function PATCH(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
    },
  });

  if (body.settings) {
    await updateTenantSettings(tenantId, body.settings as TenantSettings);
  }

  return NextResponse.json(tenant);
}
