import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId: session.user.tenantId, status: "active" },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const customer = await prisma.customer.create({
    data: {
      tenantId: session.user.tenantId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      customerType: body.customerType || "retail",
      creditLimit: body.creditLimit || 0,
    },
  });

  return NextResponse.json(customer);
}
