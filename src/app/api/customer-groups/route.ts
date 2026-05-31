import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const groups = await prisma.customerGroup.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    include: { _count: { select: { customers: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const group = await prisma.customerGroup.create({
    data: {
      tenantId: authResult.session.user.tenantId!,
      name: body.name.trim(),
      description: body.description,
      discountPercent: body.discountPercent ?? 0,
    },
  });

  return NextResponse.json(group);
}
