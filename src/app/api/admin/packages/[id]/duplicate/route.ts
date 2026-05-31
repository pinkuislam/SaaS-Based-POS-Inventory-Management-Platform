import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const source = await prisma.subscriptionPackage.findUnique({ where: { id } });
  if (!source) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  let slug = `${source.slug}-copy`;
  let n = 1;
  while (await prisma.subscriptionPackage.findUnique({ where: { slug } })) {
    slug = `${source.slug}-copy-${n++}`;
  }

  const dup = await prisma.subscriptionPackage.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      description: source.description,
      price: source.price,
      yearlyPrice: source.yearlyPrice,
      billingCycle: source.billingCycle,
      trialDays: source.trialDays,
      graceDays: source.graceDays,
      maxUsers: source.maxUsers,
      maxBranches: source.maxBranches,
      maxProducts: source.maxProducts,
      maxInvoices: source.maxInvoices,
      maxCustomers: source.maxCustomers,
      maxSuppliers: source.maxSuppliers,
      storageLimitMb: source.storageLimitMb,
      features: source.features as Prisma.InputJsonValue,
      moduleFlags: source.moduleFlags as Prisma.InputJsonValue,
      isPopular: false,
      isActive: false,
      sortOrder: source.sortOrder + 1,
    },
  });

  return NextResponse.json(dup, { status: 201 });
}
