import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sale = await prisma.sale.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      customer: true,
      user: true,
      branch: true,
      tenant: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  return NextResponse.json(sale);
}
