import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { activeCustomerWhere } from "@/lib/customers";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("show") === "all";
  const status = searchParams.get("status");

  const customers = await prisma.customer.findMany({
    where: {
      ...activeCustomerWhere(tenantId, { includeDeleted: showAll }),
      ...(status && status !== "all" ? { status } : showAll ? {} : { status: "active" }),
    },
    include: { group: true },
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
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
    },
  });

  return NextResponse.json(customer);
}
