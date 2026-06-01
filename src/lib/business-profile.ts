import { prisma } from "@/lib/prisma";
import { getTenantSettings, type TenantSettings } from "@/lib/tenant-settings";

export type BusinessProfileData = {
  id: string;
  name: string;
  ownerName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  logo: string | null;
  slug: string;
  status: string;
  packageName: string | null;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | null;
  business: {
    currency: string;
    timezone: string;
    invoicePrefix: string;
    taxVatNumber: string;
    businessType: string;
  };
  invoice: TenantSettings["invoice"];
  taxesCount: number;
  pos: TenantSettings["pos"];
};

export async function getBusinessProfile(
  tenantId: string
): Promise<BusinessProfileData | null> {
  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        package: { select: { name: true } },
        subscriptions: {
          take: 1,
          orderBy: { endDate: "desc" },
          select: { status: true, endDate: true },
        },
      },
    }),
    getTenantSettings(tenantId),
  ]);

  if (!tenant) return null;

  const taxes = (settings.taxes ?? []).filter((t) => t.isActive !== false);
  const sub = tenant.subscriptions[0];

  return {
    id: tenant.id,
    name: tenant.name,
    ownerName: tenant.ownerName,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    logo: tenant.logo,
    slug: tenant.slug,
    status: tenant.status,
    packageName: tenant.package?.name ?? null,
    subscriptionStatus: sub?.status ?? tenant.status,
    subscriptionEndDate: sub?.endDate ?? null,
    business: {
      currency: settings.business?.currency ?? "BDT",
      timezone: settings.business?.timezone ?? "Asia/Dhaka",
      invoicePrefix:
        settings.business?.invoicePrefix ??
        settings.invoice?.prefix ??
        "INV",
      taxVatNumber: settings.business?.taxVatNumber ?? "",
      businessType: settings.business?.businessType ?? "retail",
    },
    invoice: settings.invoice ?? {},
    taxesCount: taxes.length,
    pos: settings.pos ?? {},
  };
}
