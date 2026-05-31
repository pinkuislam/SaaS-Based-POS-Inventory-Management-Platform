import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const packages = await prisma.subscriptionPackage.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tenants: true } } },
  });

  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await request.json();
  const {
    name,
    description,
    price,
    billingCycle,
    trialDays,
    graceDays,
    maxUsers,
    maxBranches,
    maxProducts,
    maxInvoices,
    yearlyPrice,
    isPopular,
    features,
    isActive,
    sortOrder,
  } = body;

  if (!name?.trim() || price === undefined) {
    return NextResponse.json(
      { error: "Name and price are required" },
      { status: 400 }
    );
  }

  const slug = body.slug?.trim() || slugify(name);

  const existing = await prisma.subscriptionPackage.findUnique({
    where: { slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }

  const pkg = await prisma.subscriptionPackage.create({
    data: {
      name: name.trim(),
      slug,
      description,
      price,
      billingCycle: billingCycle || "monthly",
      trialDays: trialDays ?? 14,
      graceDays: graceDays ?? 7,
      maxUsers: maxUsers ?? 2,
      maxBranches: maxBranches ?? 1,
      maxProducts: maxProducts ?? 500,
      maxInvoices: maxInvoices ?? 1000,
      yearlyPrice: yearlyPrice != null ? yearlyPrice : null,
      isPopular: isPopular === true,
      features: features || [],
      isActive: isActive !== false,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(pkg);
}
