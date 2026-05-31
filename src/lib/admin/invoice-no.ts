import { prisma } from "@/lib/prisma";

export async function generateSubscriptionInvoiceNo() {
  const count = await prisma.subscriptionInvoice.count();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}
