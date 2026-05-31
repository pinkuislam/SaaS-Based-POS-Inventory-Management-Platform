import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/** Remove platform rows that are not linked via Prisma Tenant relations. */
async function deleteTenantPlatformRows(tenantId: string) {
  await prisma.subscriptionInvoice.deleteMany({ where: { tenantId } });
  await prisma.tenantDatabaseBackup.deleteMany({ where: { tenantId } });
  await prisma.billingCheckout.deleteMany({ where: { tenantId } });
}

export async function deleteTenantPermanently(tenantId: string) {
  await deleteTenantPlatformRows(tenantId);
  await prisma.tenant.delete({ where: { id: tenantId } });
}

export function prismaDeleteErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return "Cannot delete: related records still exist. Remove dependencies first.";
    }
    if (error.code === "P2025") {
      return "Record not found or already deleted.";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Delete failed";
}
