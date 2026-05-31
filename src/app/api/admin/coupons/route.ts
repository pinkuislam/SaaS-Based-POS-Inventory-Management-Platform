import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { package: { select: { id: true, name: true } } },
  });
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    code,
    discountType = "percentage",
    discountValue,
    expiryDate,
    usageLimit,
    packageId,
    isActive = true,
  } = body;

  if (!code || discountValue === undefined) {
    return NextResponse.json(
      { error: "code and discountValue required" },
      { status: 400 }
    );
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: String(code).toUpperCase(),
      discountType,
      discountValue,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageLimit: usageLimit ?? null,
      packageId: packageId || null,
      isActive,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
