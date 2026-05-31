import { prisma } from "@/lib/prisma";

export async function getTenantPackageLimits(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true },
  });
  return tenant?.package ?? null;
}

export async function assertProductLimit(tenantId: string) {
  const pkg = await getTenantPackageLimits(tenantId);
  const max = pkg?.maxProducts ?? 500;
  const count = await prisma.product.count({ where: { tenantId } });
  if (count >= max) {
    throw new Error(`Product limit reached (${max} on your plan)`);
  }
}

export async function assertInvoiceLimit(tenantId: string) {
  const pkg = await getTenantPackageLimits(tenantId);
  const max = pkg?.maxInvoices ?? 1000;
  const count = await prisma.sale.count({ where: { tenantId } });
  if (count >= max) {
    throw new Error(`Monthly invoice limit reached (${max} on your plan)`);
  }
}
