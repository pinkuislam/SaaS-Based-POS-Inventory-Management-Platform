import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const customers = await prisma.customer.findMany({
    where: { tenantId: authResult.session.user.tenantId!, status: "active" },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const customer = await prisma.customer.create({
    data: {
      tenantId: authResult.session.user.tenantId!,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      customerType: body.customerType || "retail",
      groupId: body.groupId || null,
      openingBalance: body.openingBalance || 0,
      creditLimit: body.creditLimit || 0,
      loyaltyPoints: body.loyaltyPoints || 0,
    },
  });

  return NextResponse.json(customer);
}
