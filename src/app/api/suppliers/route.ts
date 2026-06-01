import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("show") === "all";

  const suppliers = await prisma.supplier.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(showAll ? {} : { deletedAt: null, status: "active" }),
    },
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
      openingBalance: body.openingBalance || 0,
      paymentTerms: body.paymentTerms || null,
    },
  });

  return NextResponse.json(supplier);
}
