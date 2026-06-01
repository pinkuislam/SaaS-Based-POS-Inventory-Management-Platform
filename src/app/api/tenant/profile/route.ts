import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  getTenantSettings,
  updateTenantSettings,
  type TenantSettings,
} from "@/lib/tenant-settings";
import { getBusinessProfile } from "@/lib/business-profile";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const profile = await getBusinessProfile(authResult.session.user.tenantId!);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const session = authResult.session;
  const body = await request.json();

  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.email && body.email !== existing.email) {
    const emailTaken = await prisma.tenant.findFirst({
      where: { email: body.email, id: { not: tenantId } },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "This email is already used by another business" },
        { status: 400 }
      );
    }
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.ownerName !== undefined && {
        ownerName: body.ownerName?.trim() || null,
      }),
      ...(body.email !== undefined && { email: String(body.email).trim() }),
      ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
      ...(body.address !== undefined && {
        address: body.address?.trim() || null,
      }),
      ...(body.logo !== undefined && { logo: body.logo || null }),
    },
  });

  const currentSettings = await getTenantSettings(tenantId);
  const merged: TenantSettings = { ...currentSettings };

  if (body.business) {
    merged.business = {
      ...currentSettings.business,
      ...body.business,
    };
    merged.invoice = {
      ...currentSettings.invoice,
      prefix:
        body.business.invoicePrefix ??
        currentSettings.invoice?.prefix ??
        currentSettings.business?.invoicePrefix,
    };
  }

  if (body.settings) {
    const s = body.settings as TenantSettings;
    if (s.pos) merged.pos = { ...currentSettings.pos, ...s.pos };
    if (s.loyalty) merged.loyalty = { ...currentSettings.loyalty, ...s.loyalty };
    if (s.invoice) merged.invoice = { ...currentSettings.invoice, ...s.invoice };
    if (s.taxes !== undefined) merged.taxes = s.taxes;
  }

  await updateTenantSettings(tenantId, merged);

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "business_profile_updated",
    module: "settings",
    details: "Business profile or settings updated",
  });

  const profile = await getBusinessProfile(tenantId);
  return NextResponse.json(profile ?? tenant);
}
