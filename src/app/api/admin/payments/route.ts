import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      subscription: {
        include: { tenant: true, package: true },
      },
    },
  });

  return NextResponse.json(payments);
}
