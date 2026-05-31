import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: session.user.tenantId, status: "active" },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: session.user.tenantId,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone,
      email: body.email,
      address: body.address,
    },
  });

  return NextResponse.json(supplier);
}
